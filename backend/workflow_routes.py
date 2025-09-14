from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

from auth_utils import get_current_user, User
from workflow_service import workflow_service, Workflow, WorkflowExecution
from agent_service import agent_service

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# Request/Response models
class CreateWorkflowRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    is_template: bool = False
    template_category: Optional[str] = None

class UpdateWorkflowRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None

class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    input_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    dry_run: bool = False

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    user_id: str
    created_at: str
    updated_at: str
    is_template: bool
    template_category: Optional[str] = None

class WorkflowExecutionResponse(BaseModel):
    execution_id: str
    status: str
    message: Optional[str] = None

class WorkflowValidationResponse(BaseModel):
    is_valid: bool
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]

# Workflow CRUD endpoints
@router.get("/", response_model=List[WorkflowResponse])
async def get_workflows(current_user: User = Depends(get_current_user)):
    """Get all workflows for the current user"""
    try:
        workflows = workflow_service.get_user_workflows(current_user.id)
        return [WorkflowResponse(**workflow.dict()) for workflow in workflows]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workflows: {str(e)}"
        )

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific workflow by ID"""
    workflow = workflow_service.get_workflow(workflow_id, current_user.id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied"
        )
    return WorkflowResponse(**workflow.dict())

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    request: CreateWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new workflow"""
    try:
        workflow_data = request.dict()
        workflow = workflow_service.create_workflow(workflow_data, current_user.id)
        return WorkflowResponse(**workflow.dict())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    request: UpdateWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """Update an existing workflow"""
    try:
        workflow_data = request.dict(exclude_unset=True)
        workflow = workflow_service.update_workflow(workflow_id, workflow_data, current_user.id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found or access denied"
            )
        return WorkflowResponse(**workflow.dict())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workflow: {str(e)}"
        )

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """Delete a workflow"""
    success = workflow_service.delete_workflow(workflow_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied"
        )
    return {"message": "Workflow deleted successfully"}

# Workflow execution endpoints
@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    request: ExecuteWorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute a workflow"""
    try:
        execution = await workflow_service.execute_workflow(
            workflow_id=request.workflow_id,
            user_id=current_user.id,
            input_data=request.input_data,
            dry_run=request.dry_run
        )
        return WorkflowExecutionResponse(
            execution_id=execution.id,
            status=execution.status,
            message="Workflow execution started"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute workflow: {str(e)}"
        )

@router.get("/executions/{execution_id}")
async def get_workflow_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get workflow execution details"""
    execution = workflow_service.get_workflow_execution(execution_id, current_user.id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow execution not found or access denied"
        )
    return execution.dict()

@router.get("/executions", response_model=List[Dict[str, Any]])
async def get_workflow_executions(current_user: User = Depends(get_current_user)):
    """Get all workflow executions for the current user"""
    try:
        executions = workflow_service.get_user_workflow_executions(current_user.id)
        return [execution.dict() for execution in executions]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workflow executions: {str(e)}"
        )

# Workflow validation endpoint
@router.post("/validate", response_model=WorkflowValidationResponse)
async def validate_workflow(workflow: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Validate a workflow structure"""
    try:
        workflow_obj = Workflow(**workflow)
        validation_result = workflow_service.validate_workflow(workflow_obj)
        return WorkflowValidationResponse(**validation_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow data: {str(e)}"
        )

# Workflow templates endpoints
@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_workflow_templates(category: Optional[str] = None):
    """Get available workflow templates"""
    try:
        # Load templates from file or use default templates
        templates_file = "data/workflow_templates.json"
        default_templates = [
            {
                "id": "template-1",
                "name": "Simple Chat Bot",
                "description": "A basic chat bot workflow",
                "category": "chat",
                "difficulty": "beginner",
                "nodes": [
                    {
                        "id": "input-1",
                        "type": "input",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "User Input", "input_type": "text"}
                    },
                    {
                        "id": "agent-1",
                        "type": "agent",
                        "position": {"x": 300, "y": 100},
                        "data": {"label": "Chat Agent", "agent_config": {"model": "llama2", "temperature": 0.7}}
                    },
                    {
                        "id": "output-1",
                        "type": "output",
                        "position": {"x": 500, "y": 100},
                        "data": {"label": "Response", "output_type": "text"}
                    }
                ],
                "edges": [
                    {"id": "edge-1", "source": "input-1", "target": "agent-1"},
                    {"id": "edge-2", "source": "agent-1", "target": "output-1"}
                ],
                "tags": ["chat", "agent", "basic"],
                "usage_count": 0,
                "rating": 5.0,
                "created_at": datetime.now().isoformat(),
                "author": "System"
            },
            {
                "id": "template-2",
                "name": "Document Analysis",
                "description": "Analyze documents with AI",
                "category": "analysis",
                "difficulty": "intermediate",
                "nodes": [
                    {
                        "id": "input-1",
                        "type": "input",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Document Input", "input_type": "file"}
                    },
                    {
                        "id": "agent-1",
                        "type": "agent",
                        "position": {"x": 300, "y": 100},
                        "data": {"label": "Analysis Agent", "agent_config": {"model": "llama2", "temperature": 0.3}}
                    },
                    {
                        "id": "output-1",
                        "type": "output",
                        "position": {"x": 500, "y": 100},
                        "data": {"label": "Analysis Result", "output_type": "json"}
                    }
                ],
                "edges": [
                    {"id": "edge-1", "source": "input-1", "target": "agent-1"},
                    {"id": "edge-2", "source": "agent-1", "target": "output-1"}
                ],
                "tags": ["analysis", "document", "ai"],
                "usage_count": 0,
                "rating": 4.5,
                "created_at": datetime.now().isoformat(),
                "author": "System"
            },
            {
                "id": "template-3",
                "name": "Data Processing Pipeline",
                "description": "Process and transform data through multiple steps",
                "category": "data",
                "difficulty": "intermediate",
                "nodes": [
                    {
                        "id": "input-1",
                        "type": "input",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Data Input", "input_type": "json"}
                    },
                    {
                        "id": "agent-1",
                        "type": "agent",
                        "position": {"x": 300, "y": 100},
                        "data": {"label": "Data Cleaner", "agent_config": {"model": "llama2", "temperature": 0.3}}
                    },
                    {
                        "id": "agent-2",
                        "type": "agent",
                        "position": {"x": 500, "y": 100},
                        "data": {"label": "Data Analyzer", "agent_config": {"model": "llama2", "temperature": 0.7}}
                    },
                    {
                        "id": "output-1",
                        "type": "output",
                        "position": {"x": 700, "y": 100},
                        "data": {"label": "Processed Data", "output_type": "json"}
                    }
                ],
                "edges": [
                    {"id": "edge-1", "source": "input-1", "target": "agent-1"},
                    {"id": "edge-2", "source": "agent-1", "target": "agent-2"},
                    {"id": "edge-3", "source": "agent-2", "target": "output-1"}
                ],
                "tags": ["data", "processing", "pipeline"],
                "usage_count": 0,
                "rating": 4.2,
                "created_at": datetime.now().isoformat(),
                "author": "System"
            },
            {
                "id": "template-4",
                "name": "Conditional Workflow",
                "description": "Workflow with conditional branching",
                "category": "logic",
                "difficulty": "advanced",
                "nodes": [
                    {
                        "id": "input-1",
                        "type": "input",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Input Data", "input_type": "text"}
                    },
                    {
                        "id": "condition-1",
                        "type": "condition",
                        "position": {"x": 300, "y": 100},
                        "data": {"label": "Check Condition", "condition_type": "if", "condition_expression": "input.length > 10"}
                    },
                    {
                        "id": "agent-1",
                        "type": "agent",
                        "position": {"x": 500, "y": 50},
                        "data": {"label": "Long Text Processor", "agent_config": {"model": "llama2", "temperature": 0.7}}
                    },
                    {
                        "id": "agent-2",
                        "type": "agent",
                        "position": {"x": 500, "y": 150},
                        "data": {"label": "Short Text Processor", "agent_config": {"model": "llama2", "temperature": 0.3}}
                    },
                    {
                        "id": "output-1",
                        "type": "output",
                        "position": {"x": 700, "y": 100},
                        "data": {"label": "Result", "output_type": "text"}
                    }
                ],
                "edges": [
                    {"id": "edge-1", "source": "input-1", "target": "condition-1"},
                    {"id": "edge-2", "source": "condition-1", "target": "agent-1", "source_handle": "true", "target_handle": "a"},
                    {"id": "edge-3", "source": "condition-1", "target": "agent-2", "source_handle": "false", "target_handle": "a"},
                    {"id": "edge-4", "source": "agent-1", "target": "output-1"},
                    {"id": "edge-5", "source": "agent-2", "target": "output-1"}
                ],
                "tags": ["logic", "conditional", "branching"],
                "usage_count": 0,
                "rating": 4.8,
                "created_at": datetime.now().isoformat(),
                "author": "System"
            }
        ]
        
        # Try to load templates from file
        try:
            import json
            import os
            if os.path.exists(templates_file):
                with open(templates_file, 'r') as f:
                    file_templates = json.load(f)
                    # Merge with default templates, preferring file templates
                    template_dict = {t["id"]: t for t in default_templates}
                    for t in file_templates:
                        template_dict[t["id"]] = t
                    templates = list(template_dict.values())
            else:
                templates = default_templates
                # Save default templates to file
                os.makedirs("data", exist_ok=True)
                with open(templates_file, 'w') as f:
                    json.dump(templates, f, indent=2)
        except Exception:
            # Fallback to default templates if file loading fails
            templates = default_templates

        if category:
            templates = [t for t in templates if t["category"] == category]

        return templates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve workflow templates: {str(e)}"
        )

@router.post("/from-template", response_model=WorkflowResponse)
async def create_workflow_from_template(
    template_id: str,
    name: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Create a workflow from a template"""
    try:
        templates = await get_workflow_templates()
        template = next((t for t in templates if t["id"] == template_id), None)

        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )

        workflow_data = {
            "name": name,
            "description": description or template["description"],
            "nodes": template["nodes"],
            "edges": template["edges"]
        }

        workflow = workflow_service.create_workflow(workflow_data, current_user.id)
        return WorkflowResponse(**workflow.dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workflow from template: {str(e)}"
        )

# Import/Export endpoints
@router.get("/{workflow_id}/export")
async def export_workflow(
    workflow_id: str,
    format: str = "json",
    current_user: User = Depends(get_current_user)
):
    """Export a workflow in specified format"""
    workflow = workflow_service.get_workflow(workflow_id, current_user.id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied"
        )

    if format == "json":
        return workflow.dict()
    elif format == "yaml":
        import yaml
        return yaml.dump(workflow.dict(), default_flow_style=False)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported export format. Use 'json' or 'yaml'"
        )

@router.post("/import", response_model=WorkflowResponse)
async def import_workflow(
    data: Dict[str, Any],
    format: str = "json",
    current_user: User = Depends(get_current_user)
):
    """Import a workflow from specified format"""
    try:
        if format == "yaml":
            import yaml
            workflow_data = yaml.safe_load(data.get("data", ""))
        else:
            workflow_data = data.get("data", data)

        # Create workflow from imported data
        workflow_data["name"] = workflow_data.get("name", "Imported Workflow")
        workflow_data["description"] = workflow_data.get("description", "Imported workflow")

        workflow = workflow_service.create_workflow(workflow_data, current_user.id)
        return WorkflowResponse(**workflow.dict())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to import workflow: {str(e)}"
        )