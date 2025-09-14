from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
from agent_service import AgentService, AgentConfig, ExecutionRequest, ExecutionResponse
from auth_utils import get_current_user, User

router = APIRouter(prefix="/api", tags=["agents"])
agent_service = AgentService()

class CreateAgentRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=1000, description="Natural language description of the agent")

class CreateAgentResponse(BaseModel):
    id: str
    name: str
    description: str
    config: Dict[str, Any]
    created_at: datetime

class ExecuteAgentRequest(BaseModel):
    agent_id: str
    input: str = Field(..., min_length=1, max_length=10000, description="Input for the agent")
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="Additional parameters for execution")

class ExecuteAgentResponse(BaseModel):
    id: str
    status: str
    logs: List[Dict[str, Any]]
    start_time: datetime

@router.post("/agents/create", response_model=CreateAgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new agent from natural language description"""
    try:
        # Create agent using the service
        agent_config = await agent_service.create_agent_from_description(
            description=request.description,
            user_id=current_user.id
        )

        return CreateAgentResponse(
            id=agent_config.id,
            name=agent_config.name,
            description=agent_config.description,
            config=agent_config.dict(),
            created_at=agent_config.created_at
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent: {str(e)}"
        )

@router.get("/agents", response_model=List[CreateAgentResponse])
async def get_agents(current_user: User = Depends(get_current_user)):
    """Get all agents for the current user"""
    try:
        agents = agent_service.get_user_agents(current_user.id)

        return [
            CreateAgentResponse(
                id=agent.id,
                name=agent.name,
                description=agent.description,
                config=agent.dict(),
                created_at=agent.created_at
            )
            for agent in agents
        ]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agents: {str(e)}"
        )

@router.get("/agents/{agent_id}", response_model=CreateAgentResponse)
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific agent by ID"""
    agent = agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    return CreateAgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        config=agent.dict(),
        created_at=agent.created_at
    )

@router.post("/agents/execute", response_model=ExecuteAgentResponse)
async def execute_agent(
    request: ExecuteAgentRequest,
    current_user: User = Depends(get_current_user)
):
    """Execute an agent with the given input"""
    try:
        # Check if agent exists
        agent = agent_service.get_agent(request.agent_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # Create execution request
        execution_request = ExecutionRequest(
            agent_id=request.agent_id,
            input=request.input,
            parameters=request.parameters
        )

        # Execute agent
        execution = await agent_service.execute_agent(execution_request)

        return ExecuteAgentResponse(
            id=execution.id,
            status=execution.status,
            logs=[log.dict() for log in execution.logs],
            start_time=execution.start_time
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute agent: {str(e)}"
        )

@router.get("/executions/{execution_id}", response_model=ExecuteAgentResponse)
async def get_execution(execution_id: str, current_user: User = Depends(get_current_user)):
    """Get execution status and results"""
    execution = agent_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    return ExecuteAgentResponse(
        id=execution.id,
        status=execution.status,
        logs=[log.dict() for log in execution.logs],
        start_time=execution.start_time
    )

@router.get("/executions/{execution_id}/logs", response_model=ExecuteAgentResponse)
async def get_execution_logs(execution_id: str, current_user: User = Depends(get_current_user)):
    """Get execution logs"""
    execution = agent_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found"
        )

    return ExecuteAgentResponse(
        id=execution.id,
        status=execution.status,
        logs=[log.dict() for log in execution.logs],
        start_time=execution.start_time
    )