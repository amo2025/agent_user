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
        "email": "testworkflow@example.com",
        "password": "TestPassword123"
    })
    return register_response.json()["access_token"]

def test_create_workflow():
    """Test creating a new workflow"""
    token = get_auth_token()

    workflow_data = {
        "name": "Test Workflow",
        "description": "A test workflow for unit testing",
        "nodes": [
            {
                "id": "input-1",
                "type": "input",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Test Input",
                    "input_type": "text",
                    "default_value": "Hello World"
                }
            },
            {
                "id": "agent-1",
                "type": "agent",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "Test Agent",
                    "agent_config": {
                        "model": "llama2",
                        "temperature": 0.7,
                        "max_tokens": 500,
                        "tools": []
                    }
                }
            },
            {
                "id": "output-1",
                "type": "output",
                "position": {"x": 500, "y": 100},
                "data": {
                    "label": "Test Output",
                    "output_type": "text"
                }
            }
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "input-1",
                "target": "agent-1"
            },
            {
                "id": "edge-2",
                "source": "agent-1",
                "target": "output-1"
            }
        ]
    }

    response = client.post("/api/workflows/",
        json=workflow_data,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "Test Workflow"
    assert data["description"] == "A test workflow for unit testing"
    assert len(data["nodes"]) == 3
    assert len(data["edges"]) == 2
    assert data["user_id"] == "testworkflow@example.com"
    assert "created_at" in data
    assert "updated_at" in data

def test_get_workflows():
    """Test getting user workflows"""
    token = get_auth_token()

    # Create a workflow first
    create_response = client.post("/api/workflows/",
        json={
            "name": "Test Workflow 2",
            "description": "Another test workflow",
            "nodes": [],
            "edges": []
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # Get workflows
    response = client.get("/api/workflows/",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["user_id"] == "testworkflow@example.com"

def test_get_workflow_by_id():
    """Test getting a specific workflow by ID"""
    token = get_auth_token()

    # Create a workflow first
    create_response = client.post("/api/workflows/",
        json={
            "name": "Specific Test Workflow",
            "description": "Workflow for ID test",
            "nodes": [],
            "edges": []
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    workflow_id = create_response.json()["id"]

    # Get specific workflow
    response = client.get(f"/api/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == workflow_id
    assert data["name"] == "Specific Test Workflow"

def test_update_workflow():
    """Test updating a workflow"""
    token = get_auth_token()

    # Create a workflow first
    create_response = client.post("/api/workflows/",
        json={
            "name": "Original Workflow",
            "description": "Original description",
            "nodes": [],
            "edges": []
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    workflow_id = create_response.json()["id"]

    # Update the workflow
    update_response = client.put(f"/api/workflows/{workflow_id}",
        json={
            "name": "Updated Workflow",
            "description": "Updated description"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert update_response.status_code == 200
    data = update_response.json()
    assert data["id"] == workflow_id
    assert data["name"] == "Updated Workflow"
    assert data["description"] == "Updated description"

def test_delete_workflow():
    """Test deleting a workflow"""
    token = get_auth_token()

    # Create a workflow first
    create_response = client.post("/api/workflows/",
        json={
            "name": "Workflow to Delete",
            "description": "This will be deleted",
            "nodes": [],
            "edges": []
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    workflow_id = create_response.json()["id"]

    # Delete the workflow
    delete_response = client.delete(f"/api/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Workflow deleted successfully"

    # Verify it's deleted
    get_response = client.get(f"/api/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == 404

def test_validate_workflow():
    """Test workflow validation"""
    token = get_auth_token()

    # Valid workflow
    valid_workflow = {
        "id": "test-workflow",
        "name": "Valid Workflow",
        "description": "A valid workflow",
        "nodes": [
            {
                "id": "input-1",
                "type": "input",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Input"}
            },
            {
                "id": "output-1",
                "type": "output",
                "position": {"x": 300, "y": 100},
                "data": {"label": "Output"}
            }
        ],
        "edges": [
            {"id": "edge-1", "source": "input-1", "target": "output-1"}
        ],
        "user_id": "test@example.com",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }

    response = client.post("/api/workflows/validate",
        json=valid_workflow,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] == True
    assert len(data["errors"]) == 0

def test_workflow_templates():
    """Test getting workflow templates"""
    token = get_auth_token()

    response = client.get("/api/workflows/templates",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "name" in data[0]
    assert "nodes" in data[0]
    assert "edges" in data[0]

def test_create_workflow_from_template():
    """Test creating workflow from template"""
    token = get_auth_token()

    response = client.post("/api/workflows/from-template",
        json={
            "template_id": "template-1",
            "name": "My Chat Bot",
            "description": "Created from template"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "My Chat Bot"
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0

def test_execute_workflow():
    """Test workflow execution"""
    token = get_auth_token()

    # Create a workflow first
    create_response = client.post("/api/workflows/",
        json={
            "name": "Execution Test Workflow",
            "description": "Workflow for execution test",
            "nodes": [
                {
                    "id": "input-1",
                    "type": "input",
                    "position": {"x": 100, "y": 100},
                    "data": {"label": "Input", "input_type": "text"}
                },
                {
                    "id": "output-1",
                    "type": "output",
                    "position": {"x": 300, "y": 100},
                    "data": {"label": "Output", "output_type": "text"}
                }
            ],
            "edges": [
                {"id": "edge-1", "source": "input-1", "target": "output-1"}
            ]
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    workflow_id = create_response.json()["id"]

    # Execute the workflow
    execute_response = client.post("/api/workflows/execute",
        json={
            "workflow_id": workflow_id,
            "input_data": {"test": "data"},
            "dry_run": False
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert execute_response.status_code == 200
    data = execute_response.json()
    assert "execution_id" in data
    assert data["status"] == "running"

def test_workflow_execution_status():
    """Test getting workflow execution status"""
    token = get_auth_token()

    # Create and execute a workflow
    create_response = client.post("/api/workflows/",
        json={
            "name": "Status Test Workflow",
            "description": "Workflow for status test",
            "nodes": [],
            "edges": []
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    workflow_id = create_response.json()["id"]

    execute_response = client.post("/api/workflows/execute",
        json={
            "workflow_id": workflow_id,
            "dry_run": True  # Use dry run for immediate completion
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    execution_id = execute_response.json()["execution_id"]

    # Get execution status
    status_response = client.get(f"/api/workflows/executions/{execution_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert status_response.status_code == 200
    data = status_response.json()
    assert data["id"] == execution_id
    assert data["workflow_id"] == workflow_id
    assert data["status"] in ["completed", "running", "failed"]

def test_unauthorized_workflow_access():
    """Test unauthorized workflow access"""
    # Try to access workflows without authentication
    response = client.get("/api/workflows/")
    assert response.status_code == 403

    # Try to create workflow without authentication
    response = client.post("/api/workflows/", json={
        "name": "Unauthorized Workflow",
        "description": "This should fail",
        "nodes": [],
        "edges": []
    })
    assert response.status_code == 403

def test_workflow_validation_errors():
    """Test workflow validation with errors"""
    token = get_auth_token()

    # Invalid workflow (no input nodes)
    invalid_workflow = {
        "id": "invalid-workflow",
        "name": "Invalid Workflow",
        "description": "An invalid workflow",
        "nodes": [
            {
                "id": "output-1",
                "type": "output",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Output"}
            }
        ],
        "edges": [],
        "user_id": "test@example.com",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }

    response = client.post("/api/workflows/validate",
        json=invalid_workflow,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] == False
    assert len(data["errors"]) > 0
    assert any(error.get("message") == "Workflow must have at least one input node" for error in data["errors"])

if __name__ == "__main__":
    # Run basic tests
    print("Running workflow tests...")

    # Test workflow creation
    test_create_workflow()
    print("✓ Create workflow test passed")

    test_get_workflows()
    print("✓ Get workflows test passed")

    test_get_workflow_by_id()
    print("✓ Get workflow by ID test passed")

    test_update_workflow()
    print("✓ Update workflow test passed")

    test_delete_workflow()
    print("✓ Delete workflow test passed")

    test_validate_workflow()
    print("✓ Validate workflow test passed")

    test_workflow_templates()
    print("✓ Workflow templates test passed")

    test_create_workflow_from_template()
    print("✓ Create workflow from template test passed")

    test_execute_workflow()
    print("✓ Execute workflow test passed")

    test_workflow_execution_status()
    print("✓ Workflow execution status test passed")

    test_unauthorized_workflow_access()
    print("✓ Unauthorized access test passed")

    test_workflow_validation_errors()
    print("✓ Workflow validation errors test passed")

    print("\n🎉 All workflow tests passed!")