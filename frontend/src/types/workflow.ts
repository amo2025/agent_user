// Workflow types for v0.2

import { Node, Edge } from 'reactflow';

// Base workflow types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_template?: boolean;
  template_category?: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'default' | 'smoothstep' | 'straight';
  label?: string;
}

// Node types
export type NodeType =
  | 'input'
  | 'output'
  | 'agent'
  | 'condition'
  | 'parallel'
  | 'join'
  | 'code'
  | 'transform';

// Node data interfaces
export interface NodeData {
  label: string;
  description?: string;
  config?: any;
  parameters?: Record<string, any>;
  outputs?: Record<string, any>;
  validated?: boolean;
  error?: string;
}

// Agent node specific data
export interface AgentNodeData extends NodeData {
  agent_id?: string;
  agent_config?: {
    model: string;
    temperature: number;
    max_tokens: number;
    tools: string[];
    system_prompt?: string;
  };
  input_mapping?: Record<string, string>;
  output_mapping?: Record<string, string>;
}

// Condition node specific data
export interface ConditionNodeData extends NodeData {
  condition_type: 'if' | 'switch' | 'loop';
  condition_expression: string;
  branches: {
    id: string;
    label: string;
    condition?: string;
    target_node_id?: string;
  }[];
}

// Code node specific data
export interface CodeNodeData extends NodeData {
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  input_variables: string[];
  output_variables: string[];
}

// Workflow execution types
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  status: ExecutionStatus;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  node_executions: NodeExecution[];
  start_time: string;
  end_time?: string;
  error?: string;
}

export interface NodeExecution {
  node_id: string;
  status: ExecutionStatus;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  logs: ExecutionLog[];
  start_time: string;
  end_time?: string;
  error?: string;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  node_id?: string;
  metadata?: Record<string, any>;
}

// Workflow template types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
  usage_count: number;
  rating: number;
  created_at: string;
  author?: string;
}

// Workflow validation types
export interface WorkflowValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'node' | 'edge' | 'flow';
  node_id?: string;
  edge_id?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'node' | 'edge' | 'flow';
  node_id?: string;
  edge_id?: string;
  message: string;
  suggestion?: string;
}

// API request/response types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface ExecuteWorkflowRequest {
  workflow_id: string;
  input_data?: Record<string, any>;
  parameters?: Record<string, any>;
  dry_run?: boolean;
}

export interface WorkflowExecutionResponse {
  execution_id: string;
  status: ExecutionStatus;
  message?: string;
}

// React Flow integration types
export interface CustomNodeProps {
  id: string;
  data: NodeData;
  selected?: boolean;
  isConnectable?: boolean;
  onNodeClick?: (node: WorkflowNode) => void;
  onNodeDoubleClick?: (node: WorkflowNode) => void;
  onNodeContextMenu?: (node: WorkflowNode, event: React.MouseEvent) => void;
}

export interface CustomEdgeProps {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: 'top' | 'right' | 'bottom' | 'left';
  targetPosition?: 'top' | 'right' | 'bottom' | 'left';
  style?: React.CSSProperties;
  data?: any;
  markerEnd?: string;
  markerStart?: string;
  selected?: boolean;
  onEdgeClick?: (edge: WorkflowEdge) => void;
  onEdgeContextMenu?: (edge: WorkflowEdge, event: React.MouseEvent) => void;
}

// Workflow store types
export interface WorkflowStore {
  // Current workflow
  currentWorkflow: Workflow | null;
  selectedNodes: string[];
  selectedEdges: string[];
  clipboard: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null;

  // UI state
  showGrid: boolean;
  showMinimap: boolean;
  showPropertiesPanel: boolean;
  zoomLevel: number;

  // Actions
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  updateWorkflow: (updates: Partial<Workflow>) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void;

  // Selection
  selectNode: (nodeId: string, multi?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Clipboard
  copySelection: () => void;
  pasteSelection: () => void;

  // Validation
  validateWorkflow: () => WorkflowValidationResult;

  // UI
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowPropertiesPanel: (show: boolean) => void;
  setZoomLevel: (level: number) => void;
}