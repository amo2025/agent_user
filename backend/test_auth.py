import pytest
import asyncio
import json
from main import app, load_users, save_users
from fastapi.testclient import TestClient

client = TestClient(app)

def test_register_success():
    """测试用户注册成功"""
    # Clear existing users for clean test
    save_users({})

    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "TestPassword123"
    })

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_register_duplicate_email():
    """测试重复邮箱注册"""
    # Register first user
    client.post("/api/auth/register", json={
        "email": "duplicate@example.com",
        "password": "TestPassword123"
    })

    # Try to register with same email
    response = client.post("/api/auth/register", json={
        "email": "duplicate@example.com",
        "password": "AnotherPassword123"
    })

    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_success():
    """测试用户登录成功"""
    # Clear and register a user
    save_users({})
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "TestPassword123"
    })

    # Login with correct credentials
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "TestPassword123"
    })

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials():
    """测试无效凭据登录"""
    response = client.post("/api/auth/login", json={
        "email": "invalid@example.com",
        "password": "WrongPassword"
    })

    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user():
    """测试获取当前用户信息"""
    # Clear and register a user
    save_users({})

    # Register and get token
    register_response = client.post("/api/auth/register", json={
        "email": "userinfo@example.com",
        "password": "TestPassword123"
    })
    token = register_response.json()["access_token"]

    # Get user info with token
    response = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "userinfo@example.com"
    assert "id" in data
    assert "created_at" in data

def test_change_password():
    """测试修改密码"""
    # Clear and register a user
    save_users({})

    # Register and get token
    register_response = client.post("/api/auth/register", json={
        "email": "changepwd@example.com",
        "password": "OldPassword123"
    })
    token = register_response.json()["access_token"]

    # Change password
    response = client.post("/api/auth/change-password",
        json={
            "current_password": "OldPassword123",
            "new_password": "NewPassword123"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert "successfully" in response.json()["message"]

    # Try to login with old password (should fail)
    login_response = client.post("/api/auth/login", json={
        "email": "changepwd@example.com",
        "password": "OldPassword123"
    })
    assert login_response.status_code == 401

    # Login with new password (should succeed)
    login_response = client.post("/api/auth/login", json={
        "email": "changepwd@example.com",
        "password": "NewPassword123"
    })
    assert login_response.status_code == 200

def test_unauthorized_access():
    """测试未授权访问"""
    # Try to access protected endpoint without token
    response = client.get("/api/auth/me")
    assert response.status_code == 403  # HTTPBearer will return 403 for missing auth

def test_invalid_token():
    """测试无效token"""
    response = client.get("/api/auth/me", headers={
        "Authorization": "Bearer invalid_token"
    })
    assert response.status_code == 401

def test_health_check():
    """测试健康检查"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_root_endpoint():
    """测试根端点"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Agent User Platform API"
    assert data["version"] == "0.1.0"

if __name__ == "__main__":
    # Run basic tests
    print("Running authentication tests...")

    # Test health check
    test_health_check()
    print("✓ Health check test passed")

    # Test root endpoint
    test_root_endpoint()
    print("✓ Root endpoint test passed")

    # Test registration
    test_register_success()
    print("✓ Registration test passed")

    test_register_duplicate_email()
    print("✓ Duplicate email test passed")

    # Test login
    test_login_success()
    print("✓ Login success test passed")

    test_login_invalid_credentials()
    print("✓ Invalid credentials test passed")

    # Test user info
    test_get_current_user()
    print("✓ Get user info test passed")

    # Test password change
    test_change_password()
    print("✓ Change password test passed")

    # Test authorization
    test_unauthorized_access()
    print("✓ Unauthorized access test passed")

    test_invalid_token()
    print("✓ Invalid token test passed")

    print("\n🎉 All authentication tests passed!")