"""
工作流业务逻辑服务
"""
import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class WorkflowNode(BaseModel):
    id: str
    type: str  # input, output, agent, condition
    position: Dict[str, float]
    data: Dict[str, Any]

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Optional[str] = None

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    created_at: str
    updated_at: str
    user_id: str

class WorkflowExecution(BaseModel):
    id: str
    workflow_id: str
    status: str  # pending, running, completed, failed
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    logs: List[str] = []
    created_at: str
    completed_at: Optional[str] = None

class WorkflowService:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.workflows_file = os.path.join(data_dir, "workflows.json")
        self.executions_file = os.path.join(data_dir, "workflow_executions.json")
        self._ensure_data_files()

    def _ensure_data_files(self):
        """确保数据文件存在"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        if not os.path.exists(self.workflows_file):
            with open(self.workflows_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        
        if not os.path.exists(self.executions_file):
            with open(self.executions_file, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)

    def _load_workflows(self) -> List[Dict[str, Any]]:
        """加载工作流数据"""
        try:
            with open(self.workflows_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_workflows(self, workflows: List[Dict[str, Any]]):
        """保存工作流数据"""
        with open(self.workflows_file, 'w', encoding='utf-8') as f:
            json.dump(workflows, f, ensure_ascii=False, indent=2)

    def _load_executions(self) -> List[Dict[str, Any]]:
        """加载执行记录数据"""
        try:
            with open(self.executions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_executions(self, executions: List[Dict[str, Any]]):
        """保存执行记录数据"""
        with open(self.executions_file, 'w', encoding='utf-8') as f:
            json.dump(executions, f, ensure_ascii=False, indent=2)

    def get_user_workflows(self, user_id: str) -> List[Workflow]:
        """获取用户的工作流列表"""
        workflows = self._load_workflows()
        user_workflows = [w for w in workflows if w.get('user_id') == user_id]
        return [Workflow(**w) for w in user_workflows]

    def create_workflow(self, user_id: str, name: str, description: str = "", 
                       nodes: List[Dict] = None, edges: List[Dict] = None) -> Workflow:
        """创建新工作流"""
        workflow_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        workflow_data = {
            "id": workflow_id,
            "name": name,
            "description": description,
            "nodes": nodes or [],
            "edges": edges or [],
            "created_at": now,
            "updated_at": now,
            "user_id": user_id
        }
        
        workflows = self._load_workflows()
        workflows.append(workflow_data)
        self._save_workflows(workflows)
        
        return Workflow(**workflow_data)

    def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Workflow]:
        """获取特定工作流"""
        workflows = self._load_workflows()
        for w in workflows:
            if w.get('id') == workflow_id and w.get('user_id') == user_id:
                return Workflow(**w)
        return None

    def update_workflow(self, workflow_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Workflow]:
        """更新工作流"""
        workflows = self._load_workflows()
        
        for i, w in enumerate(workflows):
            if w.get('id') == workflow_id and w.get('user_id') == user_id:
                # 更新数据
                workflows[i].update(updates)
                workflows[i]['updated_at'] = datetime.now().isoformat()
                
                self._save_workflows(workflows)
                return Workflow(**workflows[i])
        
        return None

    def delete_workflow(self, workflow_id: str, user_id: str) -> bool:
        """删除工作流"""
        workflows = self._load_workflows()
        original_length = len(workflows)
        
        workflows = [w for w in workflows 
                    if not (w.get('id') == workflow_id and w.get('user_id') == user_id)]
        
        if len(workflows) < original_length:
            self._save_workflows(workflows)
            return True
        
        return False

    def validate_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """验证工作流结构"""
        errors = []
        warnings = []
        
        nodes = workflow_data.get('nodes', [])
        edges = workflow_data.get('edges', [])
        
        # 检查节点
        if not nodes:
            errors.append("工作流必须包含至少一个节点")
        
        node_ids = set()
        input_nodes = 0
        output_nodes = 0
        
        for node in nodes:
            node_id = node.get('id')
            node_type = node.get('type')
            
            if not node_id:
                errors.append("节点必须有ID")
                continue
                
            if node_id in node_ids:
                errors.append(f"重复的节点ID: {node_id}")
            node_ids.add(node_id)
            
            if node_type == 'input':
                input_nodes += 1
            elif node_type == 'output':
                output_nodes += 1
        
        # 检查是否有输入和输出节点
        if input_nodes == 0:
            warnings.append("建议添加至少一个输入节点")
        if output_nodes == 0:
            warnings.append("建议添加至少一个输出节点")
        
        # 检查边连接
        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')
            
            if source not in node_ids:
                errors.append(f"边的源节点不存在: {source}")
            if target not in node_ids:
                errors.append(f"边的目标节点不存在: {target}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def execute_workflow(self, workflow_id: str, user_id: str, input_data: Dict[str, Any], 
                        dry_run: bool = False) -> WorkflowExecution:
        """执行工作流"""
        execution_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        # 获取工作流
        workflow = self.get_workflow(workflow_id, user_id)
        if not workflow:
            raise ValueError(f"工作流不存在: {workflow_id}")
        
        # 创建执行记录
        execution_data = {
            "id": execution_id,
            "workflow_id": workflow_id,
            "status": "pending",
            "input_data": input_data,
            "output_data": None,
            "logs": [f"[{now}] 工作流执行开始"],
            "created_at": now,
            "completed_at": None
        }
        
        if dry_run:
            execution_data["status"] = "completed"
            execution_data["output_data"] = {"message": "干运行完成，未实际执行"}
            execution_data["logs"].append(f"[{now}] 干运行模式，跳过实际执行")
            execution_data["completed_at"] = now
        else:
            # TODO: 实现实际的工作流执行逻辑
            execution_data["status"] = "running"
            execution_data["logs"].append(f"[{now}] 开始执行工作流节点")
        
        # 保存执行记录
        executions = self._load_executions()
        executions.append(execution_data)
        self._save_executions(executions)
        
        return WorkflowExecution(**execution_data)

    def get_execution(self, execution_id: str) -> Optional[WorkflowExecution]:
        """获取执行记录"""
        executions = self._load_executions()
        for e in executions:
            if e.get('id') == execution_id:
                return WorkflowExecution(**e)
        return None

    def get_user_executions(self, user_id: str, workflow_id: str = None) -> List[WorkflowExecution]:
        """获取用户的执行历史"""
        executions = self._load_executions()
        user_workflows = [w.id for w in self.get_user_workflows(user_id)]
        
        user_executions = []
        for e in executions:
            if e.get('workflow_id') in user_workflows:
                if workflow_id is None or e.get('workflow_id') == workflow_id:
                    user_executions.append(WorkflowExecution(**e))
        
        return sorted(user_executions, key=lambda x: x.created_at, reverse=True)

# 全局工作流服务实例
workflow_service = WorkflowService()