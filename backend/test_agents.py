import pytest
import asyncio
import json
from main import app, load_users, save_users
from fastapi.testclient import TestClient

client = TestClient(app)

def get_auth_token():
    """Helper function to get authentication token"""
    # Clear and register a user
    save_users({})

    register_response = client.post("/api/auth/register", json={
        "email": "testagent@example.com",
        "password": "TestPassword123"
    })
    return register_response.json()["access_token"]

def test_create_agent_success():
    """测试成功创建Agent"""
    token = get_auth_token()

    response = client.post("/api/agents/create",
        json={
            "description": "创建一个能够帮助我总结文档内容的智能助手，它可以提取关键信息，生成简洁的摘要，并支持多种文档格式"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "description" in data
    assert "config" in data
    assert "created_at" in data

def test_create_agent_invalid_description():
    """测试创建Agent时描述过短"""
    token = get_auth_token()

    response = client.post("/api/agents/create",
        json={"description": "短描述"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 422  # Validation error

def test_get_agents():
    """测试获取用户Agent列表"""
    token = get_auth_token()

    # Create an agent first
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个编程专家Agent，能够帮助解决代码问题和提供编程建议"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # Get agents list
    response = client.get("/api/agents", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "name" in data[0]

def test_get_agent_by_id():
    """测试通过ID获取特定Agent"""
    token = get_auth_token()

    # Create an agent first
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个数据分析Agent，能够处理统计信息和图表生成"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_response.json()["id"]

    # Get specific agent
    response = client.get(f"/api/agents/{agent_id}", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == agent_id
    assert "name" in data
    assert "description" in data
    assert "config" in data

def test_get_nonexistent_agent():
    """测试获取不存在的Agent"""
    token = get_auth_token()

    response = client.get("/api/agents/nonexistent-id", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_execute_agent():
    """测试执行Agent"""
    token = get_auth_token()

    # Create an agent first
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个简单的对话Agent，能够进行基本的对话交流"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_response.json()["id"]

    # Execute the agent
    response = client.post("/api/agents/execute",
        json={
            "agent_id": agent_id,
            "input": "你好，请介绍一下你自己",
            "parameters": {}
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "status" in data
    assert "logs" in data
    assert "start_time" in data
    assert data["status"] == "running"

def test_execute_agent_with_parameters():
    """测试执行Agent并传递参数"""
    token = get_auth_token()

    # Create an agent first
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个文本处理Agent，能够根据参数进行不同的文本操作"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_response.json()["id"]

    # Execute the agent with parameters
    response = client.post("/api/agents/execute",
        json={
            "agent_id": agent_id,
            "input": "处理这段文本",
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 500,
                "language": "chinese"
            }
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] == "running"

def test_execute_nonexistent_agent():
    """测试执行不存在的Agent"""
    token = get_auth_token()

    response = client.post("/api/agents/execute",
        json={
            "agent_id": "nonexistent-id",
            "input": "测试输入",
            "parameters": {}
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_get_execution_status():
    """测试获取执行状态"""
    token = get_auth_token()

    # Create and execute an agent
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个快速响应的Agent"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_response.json()["id"]

    execute_response = client.post("/api/agents/execute",
        json={
            "agent_id": agent_id,
            "input": "简单测试",
            "parameters": {}
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    execution_id = execute_response.json()["id"]

    # Get execution status
    response = client.get(f"/api/executions/{execution_id}", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == execution_id
    assert "status" in data
    assert "logs" in data

def test_get_execution_logs():
    """测试获取执行日志"""
    token = get_auth_token()

    # Create and execute an agent
    create_response = client.post("/api/agents/create",
        json={
            "description": "创建一个会生成日志的Agent"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    agent_id = create_response.json()["id"]

    execute_response = client.post("/api/agents/execute",
        json={
            "agent_id": agent_id,
            "input": "生成一些日志",
            "parameters": {}
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    execution_id = execute_response.json()["id"]

    # Get execution logs
    response = client.get(f"/api/executions/{execution_id}/logs", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == execution_id
    assert "logs" in data
    assert isinstance(data["logs"], list)

def test_unauthorized_agent_access():
    """测试未授权的Agent访问"""
    # Try to create agent without authentication
    response = client.post("/api/agents/create", json={
        "description": "这应该失败"
    })

    assert response.status_code == 403  # HTTPBearer will return 403

    # Try to get agents without authentication
    response = client.get("/api/agents")
    assert response.status_code == 403

if __name__ == "__main__":
    # Run basic tests
    print("Running agent tests...")

    # Test agent creation
    test_create_agent_success()
    print("✓ Create agent test passed")

    test_create_agent_invalid_description()
    print("✓ Invalid description test passed")

    # Test agent retrieval
    test_get_agents()
    print("✓ Get agents test passed")

    test_get_agent_by_id()
    print("✓ Get agent by ID test passed")

    test_get_nonexistent_agent()
    print("✓ Get nonexistent agent test passed")

    # Test agent execution
    test_execute_agent()
    print("✓ Execute agent test passed")

    test_execute_agent_with_parameters()
    print("✓ Execute agent with parameters test passed")

    test_execute_nonexistent_agent()
    print("✓ Execute nonexistent agent test passed")

    # Test execution status and logs
    test_get_execution_status()
    print("✓ Get execution status test passed")

    test_get_execution_logs()
    print("✓ Get execution logs test passed")

    # Test authorization
    test_unauthorized_agent_access()
    print("✓ Unauthorized access test passed")

    print("\n🎉 All agent tests passed!")