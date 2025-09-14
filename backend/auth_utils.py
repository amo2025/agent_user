from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import os
import uuid
from typing import Optional, Dict, Any

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

security = HTTPBearer()

SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24小时

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS_FILE = "data/users.json"
os.makedirs("data", exist_ok=True)

class User(BaseModel):
    id: str
    email: str
    password_hash: str
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str

def load_users() -> Dict[str, User]:
    """加载用户数据"""
    if not os.path.exists(USERS_FILE):
        return {}

    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {user_id: User(**user_data) for user_id, user_data in data.items()}
    except Exception as e:
        print(f"Error loading users: {e}")
        return {}

def save_users(users: Dict[str, User]):
    """保存用户数据"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            users_dict = {user_id: user.dict() for user_id, user in users.items()}
            json.dump(users_dict, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving users: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    users = load_users()
    user = next((user for user in users.values() if user.email == email), None)
    if user is None:
        raise credentials_exception

    return user