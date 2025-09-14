export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  type: string;
  model: string;
  tools: string[];
  prompt_template: string;
  parameters: Record<string, any>;
}

export interface ExecutionRequest {
  agent_id: string;
  input: string;
  parameters?: Record<string, any>;
}

export interface ExecutionResponse {
  id: string;
  status: 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  logs: ExecutionLog[];
  start_time: string;
  end_time?: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

// Re-export workflow types first
export * from './workflow';

// Workflow API types (using imported types)
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes?: import('./workflow').WorkflowNode[];
  edges?: import('./workflow').WorkflowEdge[];
  tags?: string[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: import('./workflow').WorkflowNode[];
  edges?: import('./workflow').WorkflowEdge[];
  tags?: string[];
}

export interface ExecuteWorkflowRequest {
  inputs: Record<string, any>;
  mode?: 'run' | 'debug' | 'step';
  breakpoints?: string[];
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  current_node?: string;
  executed_nodes: string[];
  error?: string;
  created_at: string;
  updated_at: string;
}