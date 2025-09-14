export interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'agent' | 'condition';
  position: { x: number; y: number };
  data: {
    name?: string;
    description?: string;
    [key: string]: any;
  };
  breakpoint?: boolean; // New: breakpoint support
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  executionData?: any; // New: execution data for debugging
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: {
    condition?: string;
    [key: string]: any;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
  updated_at: string;
  tags?: string[];
  is_public?: boolean;
}

export interface WorkflowStore {
  currentWorkflow: Workflow | null;
  selectedNodes: string[];
  selectedEdges: string[];
  clipboard: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } | null;

  // UI state
  showGrid: boolean;
  showMinimap: boolean;
  showPropertiesPanel: boolean;
  zoomLevel: number;

  // Execution state
  isExecuting: boolean;
  isDebugging: boolean;
  currentExecutionId: string | null;
  executedNodes: string[];
  executionMode: 'run' | 'debug' | 'step';

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

  // UI controls
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowPropertiesPanel: (show: boolean) => void;
  setZoomLevel: (level: number) => void;

  // Execution controls
  setIsExecuting: (executing: boolean) => void;
  setIsDebugging: (debugging: boolean) => void;
  setExecutionMode: (mode: 'run' | 'debug' | 'step') => void;
  setCurrentExecutionId: (id: string | null) => void;
  addExecutedNode: (nodeId: string) => void;
  clearExecutedNodes: () => void;

  // Breakpoint management
  toggleBreakpoint: (nodeId: string) => void;
  clearAllBreakpoints: () => void;
  getBreakpointNodes: () => string[];

  // Node execution status
  setNodeExecutionStatus: (nodeId: string, status: WorkflowNode['executionStatus']) => void;
  setNodeExecutionData: (nodeId: string, data: any) => void;
  clearAllExecutionData: () => void;
}

export interface WorkflowValidationResult {
  is_valid: boolean;
  errors: Array<{
    type: 'node' | 'edge' | 'flow';
    node_id?: string;
    edge_id?: string;
    message: string;
    severity: 'error' | 'warning';
    suggestion?: string;
  }>;
  warnings: Array<{
    type: 'node' | 'edge' | 'flow';
    node_id?: string;
    edge_id?: string;
    message: string;
    suggestion?: string;
  }>;
}

export interface WorkflowExecutionRequest {
  workflow_id: string;
  inputs: Record<string, any>;
  mode?: 'run' | 'debug' | 'step';
  breakpoints?: string[];
}

export interface WorkflowExecutionResponse {
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  current_node?: string;
  executed_nodes: string[];
  outputs?: Record<string, any>;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Workflow;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  rating: number;
}

export interface NodeTypeDefinition {
  type: WorkflowNode['type'];
  name: string;
  description: string;
  icon: string;
  category: 'input' | 'processing' | 'output' | 'logic';
  defaultData: Record<string, any>;
  inputs: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
  validation?: (data: any) => { valid: boolean; errors?: string[] };
}

export type NodeType = 'input' | 'output' | 'agent' | 'condition';