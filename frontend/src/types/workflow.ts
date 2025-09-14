// 工作流类型定义
export interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'agent' | 'condition';
  position: { x: number; y: number };
  data: {
    label: string;
    [key: string]: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  logs: string[];
  created_at: string;
  completed_at?: string;
}

// 节点数据类型
export interface InputNodeData {
  label: string;
  input_type: 'text' | 'file' | 'json' | 'url';
  default_value?: any;
  required?: boolean;
  description?: string;
}

export interface OutputNodeData {
  label: string;
  output_type: 'text' | 'file' | 'json' | 'table';
  format?: string;
  description?: string;
}

export interface AgentNodeData {
  label: string;
  agent_id?: string;
  agent_config?: {
    model: string;
    temperature: number;
    max_tokens: number;
    system_prompt: string;
  };
  description?: string;
}

export interface ConditionNodeData {
  label: string;
  condition_type: 'if_else' | 'switch' | 'loop';
  condition_expression: string;
  description?: string;
}