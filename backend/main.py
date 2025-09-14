from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
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
from auth_utils import get_current_user, User, Token, UserRegister, UserLogin, UserChangePassword, verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from workflow_routes import router as workflow_router
import scrypt
import secrets

app = FastAPI(
    title="Agent User Platform API",
    description="个人Agent助手平台后端API",
    version="0.1.0"
)

# 包含工作流路由
app.include_router(workflow_router)

# Store active WebSocket connections for real-time updates
active_connections = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

from auth_utils import load_users, save_users, User, Token, UserRegister, UserLogin, UserChangePassword, verify_password, get_password_hash, create_access_token, get_current_user

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    """用户注册"""
    users = load_users()

    # 检查邮箱是否已存在
    if any(user.email == user_data.email for user in users.values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 创建新用户
    user_id = str(uuid.uuid4())
    password_hash = get_password_hash(user_data.password)

    new_user = User(
        id=user_id,
        email=user_data.email,
        password_hash=password_hash,
        created_at=datetime.utcnow()
    )

    users[user_id] = new_user
    save_users(users)

    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """用户登录"""
    users = load_users()

    # 查找用户
    user = next((user for user in users.values() if user.email == user_data.email), None)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    save_users(users)

    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")

@app.post("/api/auth/change-password")
async def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_user)
):
    """修改密码"""
    users = load_users()

    # 验证当前密码
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # 更新密码
    current_user.password_hash = get_password_hash(password_data.new_password)
    save_users(users)

    return {"message": "Password changed successfully"}

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@app.get("/")
async def root():
    """根路径"""
    return {"message": "Agent User Platform API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# WebSocket endpoint for real-time log streaming
@app.websocket("/ws/logs/{execution_id}")
async def websocket_endpoint(websocket: WebSocket, execution_id: str):
    """WebSocket端点用于实时日志流"""
    await websocket.accept()
    
    # Store the connection
    connection_id = f"{execution_id}_{uuid.uuid4()}"
    active_connections[connection_id] = {
        "websocket": websocket,
        "execution_id": execution_id
    }
    
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text()
            # Echo back for keep-alive
            await websocket.send_text(f"Connected to execution {execution_id}")
    except WebSocketDisconnect:
        # Remove the connection when disconnected
        if connection_id in active_connections:
            del active_connections[connection_id]

# 简化的Agent路由 - 直接在main.py中定义
@app.get("/api/agents")
async def get_agents(current_user: User = Depends(get_current_user)):
    """获取用户的所有Agent"""
    try:
        import sys
        import os
        print(f"🔍 Current working directory: {os.getcwd()}")
        print(f"🔍 Python path includes current dir: {'.' in sys.path or os.getcwd() in sys.path}")
        
        from agent_data_service import agent_data_service
        print(f"🔍 GET /api/agents - User ID: {current_user.id}")
        print(f"🔍 User Email: {current_user.email}")
        
        agents = agent_data_service.get_agents_by_user(current_user.id)
        print(f"🔍 Found {len(agents)} agents for user")
        for agent in agents:
            print(f"  - Agent: {agent.get('name')} (ID: {agent.get('id')})")
        
        return agents
    except Exception as e:
        print(f"❌ Error loading agents: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.post("/api/agents/create")
async def create_agent(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """创建新的Agent"""
    try:
        from agent_data_service import agent_data_service
        
        # 从请求中解析名称和描述
        description = request.get("description", "")
        lines = description.split('\n')
        name = "AI Assistant"
        desc = description
        
        # 尝试从描述中提取名称
        for line in lines:
            if line.startswith("名称:") or line.startswith("名称："):
                name = line.split(":", 1)[1].strip() if ":" in line else line.split("：", 1)[1].strip()
                break
        
        # 创建Agent
        agent = agent_data_service.create_agent(
            user_id=current_user.id,
            name=name,
            description=desc
        )
        
        return agent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )

@app.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    """获取特定Agent"""
    try:
        from agent_data_service import agent_data_service
        print(f"🔍 GET /api/agents/{agent_id} - User ID: {current_user.id}")
        agent = agent_data_service.get_agent(agent_id, current_user.id)
        if not agent:
            print(f"❌ Agent {agent_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Agent not found")
        print(f"✅ Found agent: {agent.get('name', 'Unknown')}")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting agent {agent_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent: {str(e)}"
        )

@app.put("/api/agents/{agent_id}")
async def update_agent(
    agent_id: str, 
    updates: dict,
    current_user: User = Depends(get_current_user)
):
    """更新Agent"""
    try:
        from agent_data_service import agent_data_service
        updated_agent = agent_data_service.update_agent(agent_id, current_user.id, updates)
        if not updated_agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return updated_agent
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update agent: {str(e)}"
        )

@app.delete("/api/agents/{agent_id}")
async def delete_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    """删除Agent"""
    try:
        import sys
        import os
        print(f"🔍 DELETE /api/agents/{agent_id} - Current working directory: {os.getcwd()}")
        print(f"🔍 Python path includes current dir: {'.' in sys.path or os.getcwd() in sys.path}")
        
        from agent_data_service import agent_data_service
        print(f"🔍 agent_data_service imported successfully")
        
        success = agent_data_service.delete_agent(agent_id, current_user.id)
        print(f"🔍 Delete result: {success}")
        
        if not success:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"message": "Agent deleted successfully"}
    except ImportError as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import agent_data_service: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Delete error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete agent: {str(e)}"
        )

@app.post("/api/agents/execute")
async def execute_agent(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """执行Agent"""
    execution_id = str(uuid.uuid4())
    try:
        import httpx
        from agent_data_service import agent_data_service
        
        agent_id = request.get("agent_id")
        user_input = request.get("input", "")
        
        print(f"🔍 Starting agent execution - ID: {execution_id}")
        print(f"🔍 Agent ID: {agent_id}")
        print(f"🔍 User input: {user_input}")
        
        # 获取Agent配置
        agent = agent_data_service.get_agent(agent_id, current_user.id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        print(f"🔍 Found agent: {agent['name']}")
        
        # 构建提示词
        agent_prompt = f"""你是一个名为"{agent['name']}"的AI助手。

角色描述：{agent['description']}

用户输入：{user_input}

请根据你的角色和描述，为用户提供有用的回答。"""

        # 获取模型名称，优先使用 Agent 配置的模型
        model_name = agent['config'].get('model', 'gpt-oss:20b')
        
        # 模型名称映射 - 处理界面显示名称到实际模型名称的转换
        model_mapping = {
            'llama2': 'llama2:latest',
            'gpt-3.5-turbo': 'gpt-oss:20b',  # 使用本地可用的模型
            'gpt-4': 'gpt-oss:20b',  # 使用本地可用的模型
            'claude-3-sonnet': 'deepseek-r1:8b',  # 使用本地可用的模型
            'DeepSeek-V3.1': 'deepseek-r1:8b',  # 使用本地可用的模型
            'deepseek-r1:7b': 'deepseek-r1:8b'  # 修正错误的模型名称
        }
        
        actual_model = model_mapping.get(model_name, model_name)
        
        print(f"🔍 Configured model: {model_name}")
        print(f"🔍 Actual model to use: {actual_model}")
        print(f"🔍 Prompt length: {len(agent_prompt)} characters")
        
        # 调用Ollama API - 使用正确的超时配置
        timeout = httpx.Timeout(180.0, connect=10.0)  # 180秒总超时，10秒连接超时
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            ollama_request = {
                "model": actual_model,
                "prompt": agent_prompt,
                "stream": False
            }
            
            print(f"🔍 Calling Ollama API...")
            print(f"🔍 Request timeout: 120 seconds")
            
            try:
                ollama_response = await client.post(
                    "http://localhost:11434/api/generate",
                    json=ollama_request
                )
            except httpx.ReadTimeout:
                print(f"❌ Ollama API timeout after 120 seconds")
                return {
                    "id": execution_id,
                    "status": "error",
                    "result": f"模型响应超时。{actual_model} 模型可能需要更长时间处理，请稍后重试或选择其他模型。",
                    "logs": [
                        f"开始执行Agent: {agent['name']}",
                        f"用户输入: {user_input}",
                        f"使用模型: {actual_model}",
                        "错误: 模型响应超时 (120秒)"
                    ],
                    "start_time": datetime.utcnow().isoformat()
                }
            except httpx.ConnectError:
                print(f"❌ Cannot connect to Ollama API")
                return {
                    "id": execution_id,
                    "status": "error",
                    "result": "无法连接到 Ollama 服务。请确保 Ollama 正在运行。",
                    "logs": [
                        f"开始执行Agent: {agent['name']}",
                        f"用户输入: {user_input}",
                        f"使用模型: {actual_model}",
                        "错误: 无法连接到 Ollama 服务"
                    ],
                    "start_time": datetime.utcnow().isoformat()
                }
            
            print(f"🔍 Ollama response status: {ollama_response.status_code}")
            
            if ollama_response.status_code == 200:
                result = ollama_response.json()
                ai_response = result.get('response', '抱歉，我无法处理您的请求。')
                print(f"✅ Ollama API success - Response length: {len(ai_response)}")
                
                return {
                    "id": execution_id,
                    "status": "completed",
                    "result": ai_response,
                    "logs": [
                        f"开始执行Agent: {agent['name']}",
                        f"用户输入: {user_input}",
                        f"使用模型: {actual_model}",
                        f"生成回复长度: {len(ai_response)} 字符",
                        "执行完成"
                    ],
                    "start_time": datetime.utcnow().isoformat(),
                    "end_time": datetime.utcnow().isoformat()
                }
            else:
                error_text = ollama_response.text
                print(f"❌ Ollama API failed: {ollama_response.status_code}")
                print(f"❌ Response: {error_text}")
                
                return {
                    "id": execution_id,
                    "status": "error",
                    "result": f"模型调用失败，状态码：{ollama_response.status_code}，错误：{error_text}",
                    "logs": [
                        f"开始执行Agent: {agent['name']}",
                        f"用户输入: {user_input}",
                        f"使用模型: {actual_model}",
                        f"错误: HTTP {ollama_response.status_code} - {error_text}"
                    ],
                    "start_time": datetime.utcnow().isoformat()
                }
        
    except Exception as e:
        error_msg = str(e) if str(e) else f"未知错误: {type(e).__name__}"
        print(f"❌ Agent execution error: {error_msg}")
        import traceback
        traceback.print_exc()
        
        return {
            "id": execution_id,
            "status": "error",
            "result": f"执行失败: {error_msg}",
            "logs": [f"错误: {error_msg}"],
            "start_time": datetime.utcnow().isoformat()
        }

from model_service import model_service

@app.get("/api/models")
async def get_models(current_user: User = Depends(get_current_user)):
    """获取可用的模型列表"""
    try:
        models = await model_service.get_all_models()
        return models
    except Exception as e:
        print(f"Error fetching models: {e}")
        return []

@app.post("/api/models")
async def add_model(
    model_config: dict,
    current_user: User = Depends(get_current_user)
):
    """添加新的在线模型配置"""
    try:
        new_model = model_service.add_online_model(model_config)
        return new_model
    except Exception as e:
        print(f"Error adding model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add model: {str(e)}"
        )

@app.post("/api/models/{model_id}/toggle")
async def toggle_model(
    model_id: str,
    current_user: User = Depends(get_current_user)
):
    """切换模型状态（启用/停用）"""
    try:
        result = model_service.toggle_model_status(model_id)
        return result
    except Exception as e:
        print(f"Error toggling model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle model: {str(e)}"
        )

@app.delete("/api/models/{model_id}")
async def delete_model(
    model_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除模型配置（仅限在线模型）"""
    try:
        success = model_service.delete_online_model(model_id)
        if success:
            return {"message": f"Model {model_id} deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete local models or model not found"
            )
    except Exception as e:
        print(f"Error deleting model: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete model: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)