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
os.makedirs("data", exist_ok=True)

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

def load_users():
    """加载用户数据"""
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    except Exception:
        return {}

def save_users(users_data):
    """保存用户数据"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, ensure_ascii=False, indent=2)
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

        users = load_users()
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

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    """用户注册"""
    users = load_users()

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
    if save_users(users):
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
    users = load_users()

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
    users = load_users()
    user = users.get(current_user.id)

    if not user or not verify_password(password_data.old_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )

    # 更新密码
    user["password_hash"] = hash_password(password_data.new_password)
    users[current_user.id] = user

    if save_users(users):
        return {"message": "密码修改成功"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码修改失败"
        )

@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "agent-user-platform-api"
    }

# 延迟导入路由以避免循环导入
from agent_routes import router as agent_router
from workflow_routes import router as workflow_router

# 注册路由
app.include_router(agent_router)
app.include_router(workflow_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)