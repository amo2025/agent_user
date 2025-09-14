import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain.tools import Tool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
import uuid
import logging

logger = logging.getLogger(__name__)

# Workflow models
class WorkflowNode(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    source_handle: Optional[str] = None
    target_handle: Optional[str] = None
    type: Optional[str] = "default"
    label: Optional[str] = None

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    user_id: str
    created_at: str
    updated_at: str
    is_template: bool = False
    template_category: Optional[str] = None

class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    user_id: str
    status: str = "pending"
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    node_executions: List[Dict[str, Any]] = Field(default_factory=list)
    start_time: str
    end_time: Optional[str] = None
    error: Optional[str] = None

class WorkflowService:
    def __init__(self):
        self.workflows_file = "data/workflows.json"
        self.workflow_executions_file = "data/workflow_executions.json"
        self.templates_file = "data/workflow_templates.json"

    def load_workflows(self) -> Dict[str, Workflow]:
        """Load workflows from JSON file"""
        try:
            with open(self.workflows_file, 'r') as f:
                data = json.load(f)
                return {k: Workflow(**v) for k, v in data.items()}
        except FileNotFoundError:
            return {}
        except Exception as e:
            logger.error(f"Error loading workflows: {e}")
            return {}

    def save_workflows(self, workflows: Dict[str, Workflow]):
        """Save workflows to JSON file"""
        try:
            with open(self.workflows_file, 'w') as f:
                json.dump({k: v.dict() for k, v in workflows.items()}, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving workflows: {e}")
            raise

    def load_workflow_executions(self) -> Dict[str, WorkflowExecution]:
        """Load workflow executions from JSON file"""
        try:
            with open(self.workflow_executions_file, 'r') as f:
                data = json.load(f)
                return {k: WorkflowExecution(**v) for k, v in data.items()}
        except FileNotFoundError:
            return {}
        except Exception as e:
            logger.error(f"Error loading workflow executions: {e}")
            return {}

    def save_workflow_executions(self, executions: Dict[str, WorkflowExecution]):
        """Save workflow executions to JSON file"""
        try:
            with open(self.workflow_executions_file, 'w') as f:
                json.dump({k: v.dict() for k, v in executions.items()}, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving workflow executions: {e}")
            raise

    def create_workflow(self, workflow_data: Dict[str, Any], user_id: str) -> Workflow:
        """Create a new workflow"""
        workflows = self.load_workflows()

        workflow_id = str(uuid.uuid4())
        now = datetime.now().isoformat()

        workflow = Workflow(
            id=workflow_id,
            name=workflow_data["name"],
            description=workflow_data.get("description", ""),
            nodes=workflow_data.get("nodes", []),
            edges=workflow_data.get("edges", []),
            user_id=user_id,
            created_at=now,
            updated_at=now,
            is_template=workflow_data.get("is_template", False),
            template_category=workflow_data.get("template_category")
        )

        workflows[workflow_id] = workflow
        self.save_workflows(workflows)

        logger.info(f"Created workflow {workflow_id} for user {user_id}")
        return workflow

    def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Workflow]:
        """Get a specific workflow by ID"""
        workflows = self.load_workflows()
        workflow = workflows.get(workflow_id)

        if workflow and workflow.user_id == user_id:
            return workflow
        return None

    def get_user_workflows(self, user_id: str) -> List[Workflow]:
        """Get all workflows for a user"""
        workflows = self.load_workflows()
        return [w for w in workflows.values() if w.user_id == user_id]

    def update_workflow(self, workflow_id: str, workflow_data: Dict[str, Any], user_id: str) -> Optional[Workflow]:
        """Update an existing workflow"""
        workflows = self.load_workflows()
        workflow = workflows.get(workflow_id)

        if not workflow or workflow.user_id != user_id:
            return None

        # Update workflow fields
        if "name" in workflow_data:
            workflow.name = workflow_data["name"]
        if "description" in workflow_data:
            workflow.description = workflow_data["description"]
        if "nodes" in workflow_data:
            workflow.nodes = [WorkflowNode(**node) for node in workflow_data["nodes"]]
        if "edges" in workflow_data:
            workflow.edges = [WorkflowEdge(**edge) for edge in workflow_data["edges"]]

        workflow.updated_at = datetime.now().isoformat()

        workflows[workflow_id] = workflow
        self.save_workflows(workflows)

        logger.info(f"Updated workflow {workflow_id} for user {user_id}")
        return workflow

    def delete_workflow(self, workflow_id: str, user_id: str) -> bool:
        """Delete a workflow"""
        workflows = self.load_workflows()
        workflow = workflows.get(workflow_id)

        if not workflow or workflow.user_id != user_id:
            return False

        del workflows[workflow_id]
        self.save_workflows(workflows)

        logger.info(f"Deleted workflow {workflow_id} for user {user_id}")
        return True

    def validate_workflow(self, workflow: Workflow) -> Dict[str, Any]:
        """Validate workflow structure and logic"""
        errors = []
        warnings = []

        # Check for orphaned nodes
        connected_node_ids = set()
        for edge in workflow.edges:
            connected_node_ids.add(edge.source)
            connected_node_ids.add(edge.target)

        for node in workflow.nodes:
            if node.id not in connected_node_ids and node.type != "input":
                warnings.append({
                    "type": "node",
                    "node_id": node.id,
                    "message": "Node is not connected to any other nodes",
                    "suggestion": "Connect this node to other nodes or remove it"
                })

        # Check for input/output nodes
        input_nodes = [n for n in workflow.nodes if n.type == "input"]
        output_nodes = [n for n in workflow.nodes if n.type == "output"]

        if not input_nodes:
            errors.append({
                "type": "flow",
                "message": "Workflow must have at least one input node",
                "severity": "error"
            })

        if not output_nodes:
            warnings.append({
                "type": "flow",
                "message": "Workflow has no output nodes",
                "suggestion": "Consider adding output nodes to capture results"
            })

        # Check for cycles (simplified check)
        has_cycles = self._check_for_cycles(workflow.nodes, workflow.edges)
        if has_cycles:
            errors.append({
                "type": "flow",
                "message": "Workflow contains cycles which may cause infinite loops",
                "severity": "error"
            })

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def _check_for_cycles(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> bool:
        """Check if the workflow graph contains cycles"""
        adjacency = {}
        visited = set()
        recursion_stack = set()

        # Build adjacency list
        for node in nodes:
            adjacency[node.id] = []

        for edge in edges:
            adjacency[edge.source].append(edge.target)

        def has_cycle_dfs(node_id: str) -> bool:
            if node_id in recursion_stack:
                return True
            if node_id in visited:
                return False

            visited.add(node_id)
            recursion_stack.add(node_id)

            neighbors = adjacency.get(node_id, [])
            for neighbor in neighbors:
                if has_cycle_dfs(neighbor):
                    return True

            recursion_stack.remove(node_id)
            return False

        for node in nodes:
            if node.id not in visited:
                if has_cycle_dfs(node.id):
                    return True

        return False

    async def execute_workflow(self, workflow_id: str, user_id: str, input_data: Dict[str, Any] = None, dry_run: bool = False) -> WorkflowExecution:
        """Execute a workflow"""
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            raise ValueError("Workflow not found or access denied")

        # Validate workflow before execution
        validation_result = self.validate_workflow(workflow)
        if not validation_result["is_valid"]:
            raise ValueError(f"Workflow validation failed: {validation_result['errors']}")

        # Create execution record
        execution_id = str(uuid.uuid4())
        execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow_id,
            user_id=user_id,
            status="running",
            input_data=input_data or {},
            start_time=datetime.now().isoformat()
        )

        # Save execution record
        executions = self.load_workflow_executions()
        executions[execution_id] = execution
        self.save_workflow_executions(executions)

        if dry_run:
            execution.status = "completed"
            execution.end_time = datetime.now().isoformat()
            executions[execution_id] = execution
            self.save_workflow_executions(executions)
            return execution

        # Execute workflow in background
        asyncio.create_task(self._execute_workflow_async(workflow, execution))

        logger.info(f"Started workflow execution {execution_id} for workflow {workflow_id}")
        return execution

    async def _execute_workflow_async(self, workflow: Workflow, execution: WorkflowExecution):
        """Execute workflow asynchronously"""
        try:
            # Build execution graph
            graph = self._build_execution_graph(workflow)

            # Execute the graph
            result = await graph.ainvoke({
                "input": execution.input_data,
                "execution_id": execution.id
            })

            # Update execution with results
            execution.status = "completed"
            execution.output_data = result.get("output", {})
            execution.end_time = datetime.now().isoformat()

            logger.info(f"Completed workflow execution {execution.id}")

        except Exception as e:
            logger.error(f"Workflow execution {execution.id} failed: {e}")
            execution.status = "failed"
            execution.error = str(e)
            execution.end_time = datetime.now().isoformat()

        # Save updated execution
        executions = self.load_workflow_executions()
        executions[execution.id] = execution
        self.save_workflow_executions(executions)

    def _build_execution_graph(self, workflow: Workflow) -> StateGraph:
        """Build LangGraph execution graph from workflow"""
        # Define state schema
        class WorkflowState(BaseModel):
            input: Dict[str, Any] = {}
            output: Dict[str, Any] = {}
            node_results: Dict[str, Any] = {}
            execution_id: str

        # Create graph
        workflow_graph = StateGraph(WorkflowState)

        # Add nodes
        for node in workflow.nodes:
            if node.type == "input":
                workflow_graph.add_node(node.id, self._create_input_node(node))
            elif node.type == "output":
                workflow_graph.add_node(node.id, self._create_output_node(node))
            elif node.type == "agent":
                workflow_graph.add_node(node.id, self._create_agent_node(node))
            elif node.type == "condition":
                workflow_graph.add_node(node.id, self._create_condition_node(node))

        # Add edges
        for edge in workflow.edges:
            workflow_graph.add_edge(edge.source, edge.target)

        # Set entry and exit points
        input_nodes = [n for n in workflow.nodes if n.type == "input"]
        output_nodes = [n for n in workflow.nodes if n.type == "output"]

        if input_nodes:
            workflow_graph.set_entry_point(input_nodes[0].id)

        if output_nodes:
            for output_node in output_nodes:
                workflow_graph.add_edge(output_node.id, END)

        return workflow_graph.compile()

    def _create_input_node(self, node: WorkflowNode):
        """Create input node function"""
        async def input_node_function(state: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "node_results": {
                    **state.get("node_results", {}),
                    node.id: state.get("input", {})
                }
            }
        return input_node_function

    def _create_output_node(self, node: WorkflowNode):
        """Create output node function"""
        async def output_node_function(state: Dict[str, Any]) -> Dict[str, Any]:
            node_data = node.data
            output_key = node_data.get("label", node.id)

            # Collect inputs from connected nodes
            result = {}
            # This is a simplified implementation
            # In a full implementation, you'd trace the data flow

            return {
                "output": {
                    **state.get("output", {}),
                    output_key: result
                }
            }
        return output_node_function

    def _create_agent_node(self, node: WorkflowNode):
        """Create agent node function"""
        async def agent_node_function(state: Dict[str, Any]) -> Dict[str, Any]:
            # This would integrate with your existing agent execution system
            # For now, return a placeholder result
            agent_config = node.data.get("agent_config", {})

            result = {
                "agent_id": node.data.get("agent_id"),
                "model": agent_config.get("model", "llama2"),
                "status": "completed",
                "result": "Agent processing result"
            }

            return {
                "node_results": {
                    **state.get("node_results", {}),
                    node.id: result
                }
            }
        return agent_node_function

    def _create_condition_node(self, node: WorkflowNode):
        """Create condition node function"""
        async def condition_node_function(state: Dict[str, Any]) -> Dict[str, Any]:
            # Evaluate condition and route to appropriate branch
            condition_type = node.data.get("condition_type", "if")
            condition_expression = node.data.get("condition_expression", "")

            # Simplified condition evaluation
            # In a full implementation, you'd use a proper expression evaluator
            result = {"branch": "true"}  # Default branch

            return {
                "node_results": {
                    **state.get("node_results", {}),
                    node.id: result
                }
            }
        return condition_node_function

    def get_workflow_execution(self, execution_id: str, user_id: str) -> Optional[WorkflowExecution]:
        """Get workflow execution by ID"""
        executions = self.load_workflow_executions()
        execution = executions.get(execution_id)

        if execution and execution.user_id == user_id:
            return execution
        return None

    def get_user_workflow_executions(self, user_id: str) -> List[WorkflowExecution]:
        """Get all workflow executions for a user"""
        executions = self.load_workflow_executions()
        return [e for e in executions.values() if e.user_id == user_id]

# Global workflow service instance
workflow_service = WorkflowService()