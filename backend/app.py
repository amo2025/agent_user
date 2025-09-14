from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import os
import uuid
from typing import Optional, Dict, Any
import scrypt
import secrets
from agent_service import AgentService, AgentConfig, ExecutionRequest, ExecutionResponse
from workflow_service import WorkflowService, Workflow, WorkflowExecution

app = FastAPI(
    title="Agent User Platform API",
    description="个人Agent助手平台后端API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24小时

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS_FILE = "data/users.json"
AGENTS_FILE = "data/agents.json"
WORKFLOWS_FILE = "data/workflows.json"
EXECUTIONS_FILE = "data/executions.json"

# 确保数据目录存在
os.makedirs("data", exist_ok=True)

# 初始化服务
agent_service = AgentService()
workflow_service = WorkflowService()

# Pydantic模型
class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str

class User(BaseModel):
    id: str
    email: EmailStr
    username: str
    created_at: datetime
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    created_at: datetime
    is_active: bool

# Agent相关模型
class CreateAgentRequest(BaseModel):
    description: str
    name: Optional[str] = None

class CreateAgentResponse(BaseModel):
    id: str
    name: str
    description: str
    config: Dict[str, Any]
    created_at: datetime

class ExecuteAgentRequest(BaseModel):
    agent_id: str
    input: str
    parameters: Optional[Dict[str, Any]] = {}

class ExecuteAgentResponse(BaseModel):
    id: str
    status: str
    output: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime

# Workflow相关模型
class CreateWorkflowRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: list = []
    edges: list = []

class CreateWorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    nodes: list
    edges: list
    created_at: datetime

class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    input: str
    parameters: Optional[Dict[str, Any]] = {}

# 工具函数
def hash_password(password: str) -> str:
    """使用scrypt哈希密码"""
    salt = secrets.token_bytes(32)
    key = scrypt.hash(password.encode('utf-8'), salt, N=16384, r=8, p=1, buflen=64)
    return salt.hex() + key.hex()

def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    try:
        salt = bytes.fromhex(hashed[:64])
        key = bytes.fromhex(hashed[64:])
        new_key = scrypt.hash(password.encode('utf-8'), salt, N=16384, r=8, p=1, buflen=64)
        return key == new_key
    except Exception:
        return False

def load_json_data(filename: str, default=None):
    """加载JSON数据"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        return default or {}
    except Exception:
        return default or {}

def save_json_data(filename: str, data):
    """保存JSON数据"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def create_access_token(data: dict):
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的认证凭据",
                headers={"WWW-Authenticate": "Bearer"},
            )

        users = load_json_data(USERS_FILE)
        if user_id not in users:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_data = users[user_id]
        return User(**user_data)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )

# 认证相关路由
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    """用户注册"""
    users = load_json_data(USERS_FILE)

    # 检查邮箱是否已存在
    for user in users.values():
        if user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

    # 创建新用户
    user_id = str(uuid.uuid4())
    username = user_data.email.split('@')[0]

    new_user = {
        "id": user_id,
        "email": user_data.email,
        "username": username,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now().isoformat(),
        "is_active": True
    }

    users[user_id] = new_user
    if save_json_data(USERS_FILE, users):
        # 返回用户信息（不包含密码）
        user_response = {k: v for k, v in new_user.items() if k != "password_hash"}
        return UserResponse(**user_response)
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="用户注册失败"
        )

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """用户登录"""
    users = load_json_data(USERS_FILE)

    # 查找用户
    user = None
    for u in users.values():
        if u["email"] == user_data.email:
            user = u
            break

    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建访问令牌
    access_token = create_access_token(data={"sub": user["id"]})

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(**current_user.dict())

@app.put("/api/auth/password")
async def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_user)
):
    """修改密码"""
    users = load_json_data(USERS_FILE)
    user = users.get(current_user.id)

    if not user or not verify_password(password_data.old_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )

    # 更新密码
    user["password_hash"] = hash_password(password_data.new_password)
    users[current_user.id] = user

    if save_json_data(USERS_FILE, users):
        return {"message": "密码修改成功"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码修改失败"
        )

# Agent相关路由
@app.post("/api/agents", response_model=CreateAgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    current_user: User = Depends(get_current_user)
):
    """创建Agent"""
    try:
        agent_config = AgentConfig(
            description=request.description,
            name=request.name or f"Agent_{uuid.uuid4().hex[:8]}"
        )

        agent = agent_service.create_agent(agent_config)

        # 保存Agent信息
        agents = load_json_data(AGENTS_FILE)
        agents[agent.id] = {
            "id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "config": agent.config,
            "user_id": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        save_json_data(AGENTS_FILE, agents)

        return CreateAgentResponse(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            config=agent.config,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建Agent失败: {str(e)}"
        )

@app.get("/api/agents")
async def get_agents(current_user: User = Depends(get_current_user)):
    """获取用户Agent列表"""
    agents = load_json_data(AGENTS_FILE)
    user_agents = [
        {k: v for k, v in agent.items() if k != "user_id"}
        for agent in agents.values()
        if agent.get("user_id") == current_user.id
    ]
    return user_agents

@app.post("/api/agents/{agent_id}/execute", response_model=ExecuteAgentResponse)
async def execute_agent(
    agent_id: str,
    request: ExecuteAgentRequest,
    current_user: User = Depends(get_current_user)
):
    """执行Agent"""
    agents = load_json_data(AGENTS_FILE)
    agent_data = agents.get(agent_id)

    if not agent_data or agent_data.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent不存在或无权限"
        )

    try:
        execution_request = ExecutionRequest(
            agent_id=agent_id,
            input=request.input,
            parameters=request.parameters
        )

        execution = agent_service.execute_agent(execution_request)

        # 保存执行记录
        executions = load_json_data(EXECUTIONS_FILE)
        executions[execution.id] = {
            "id": execution.id,
            "agent_id": agent_id,
            "input": request.input,
            "output": execution.output,
            "error": execution.error,
            "status": execution.status,
            "user_id": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        save_json_data(EXECUTIONS_FILE, executions)

        return ExecuteAgentResponse(
            id=execution.id,
            status=execution.status,
            output=execution.output,
            error=execution.error,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"执行Agent失败: {str(e)}"
        )

@app.get("/api/agents/{agent_id}/executions")
async def get_agent_executions(
    agent_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取Agent执行历史"""
    executions = load_json_data(EXECUTIONS_FILE)
    agent_executions = [
        {k: v for k, v in execution.items() if k != "user_id"}
        for execution in executions.values()
        if execution.get("agent_id") == agent_id and execution.get("user_id") == current_user.id
    ]
    return agent_executions

# Workflow相关路由
@app.post("/api/workflows", response_model=CreateWorkflowResponse)
async def create_workflow(
    request: CreateWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """创建工作流"""
    try:
        workflow_config = WorkflowConfig(
            name=request.name,
            description=request.description,
            nodes=request.nodes,
            edges=request.edges
        )

        workflow_data = {
            "name": request.name,
            "description": request.description,
            "nodes": request.nodes,
            "edges": request.edges
        }
        workflow = workflow_service.create_workflow(workflow_data, current_user.id)

        # 保存工作流信息
        workflows = load_json_data(WORKFLOWS_FILE)
        workflows[workflow.id] = {
            "id": workflow.id,
            "name": workflow.name,
            "description": workflow.description,
            "nodes": workflow.nodes,
            "edges": workflow.edges,
            "user_id": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        save_json_data(WORKFLOWS_FILE, workflows)

        return CreateWorkflowResponse(
            id=workflow.id,
            name=workflow.name,
            description=workflow.description,
            nodes=workflow.nodes,
            edges=workflow.edges,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建工作流失败: {str(e)}"
        )

@app.get("/api/workflows")
async def get_workflows(current_user: User = Depends(get_current_user)):
    """获取用户工作流列表"""
    workflows = load_json_data(WORKFLOWS_FILE)
    user_workflows = [
        {k: v for k, v in workflow.items() if k != "user_id"}
        for workflow in workflows.values()
        if workflow.get("user_id") == current_user.id
    ]
    return user_workflows

@app.post("/api/workflows/{workflow_id}/execute", response_model=ExecuteAgentResponse)
async def execute_workflow(
    workflow_id: str,
    request: ExecuteWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """执行工作流"""
    workflows = load_json_data(WORKFLOWS_FILE)
    workflow_data = workflows.get(workflow_id)

    if not workflow_data or workflow_data.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="工作流不存在或无权限"
        )

    try:
        execution = await workflow_service.execute_workflow(
            workflow_id=workflow_id,
            user_id=current_user.id,
            input_data={"input": request.input, "parameters": request.parameters}
        )

        # 保存执行记录
        executions = load_json_data(EXECUTIONS_FILE)
        executions[execution.id] = {
            "id": execution.id,
            "workflow_id": workflow_id,
            "input": request.input,
            "output": execution.output,
            "error": execution.error,
            "status": execution.status,
            "user_id": current_user.id,
            "created_at": datetime.now().isoformat()
        }
        save_json_data(EXECUTIONS_FILE, executions)

        return ExecuteAgentResponse(
            id=execution.id,
            status=execution.status,
            output=execution.output,
            error=execution.error,
            created_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"执行工作流失败: {str(e)}"
        )

@app.get("/api/workflows/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取工作流执行历史"""
    executions = load_json_data(EXECUTIONS_FILE)
    workflow_executions = [
        {k: v for k, v in execution.items() if k != "user_id"}
        for execution in executions.values()
        if execution.get("workflow_id") == workflow_id and execution.get("user_id") == current_user.id
    ]
    return workflow_executions

# 健康检查接口
@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "agent-user-platform-api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)