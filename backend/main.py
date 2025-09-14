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
from auth_utils import get_current_user, User, Token, UserRegister, UserLogin, UserChangePassword, verify_password, get_password_hash, create_access_token
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

# 延迟导入和注册路由
def setup_routes():
    from agent_routes import router as agent_router
    from workflow_routes import router as workflow_router
    app.include_router(agent_router)
    app.include_router(workflow_router)

# 调用函数设置路由
setup_routes()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)