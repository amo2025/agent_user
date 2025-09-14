import { create } from 'zustand';
import { WorkflowStore, Workflow, WorkflowNode, WorkflowEdge, WorkflowValidationResult, NodeType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // Current workflow state
  currentWorkflow: null,
  selectedNodes: [],
  selectedEdges: [],
  clipboard: null,

  // UI state
  showGrid: true,
  showMinimap: true,
  showPropertiesPanel: true,
  zoomLevel: 1,

  // Execution state
  isExecuting: false,
  isDebugging: false,
  currentExecutionId: null,
  executedNodes: [],
  executionMode: 'run' as 'run' | 'debug' | 'step',

  // Actions
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  updateWorkflow: (updates) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      ...updates,
      updated_at: new Date().toISOString()
    } : null
  })),

  addNode: (node) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      nodes: [...state.currentWorkflow.nodes, node],
      updated_at: new Date().toISOString()
    } : null
  })),

  removeNode: (nodeId) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = state.currentWorkflow.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        edges: updatedEdges,
        updated_at: new Date().toISOString()
      },
      selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
    };
  }),

  updateNode: (nodeId, updates) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      }
    };
  }),

  addEdge: (edge) => set((state) => {
    if (!state.currentWorkflow) return state;

    // Validate edge doesn't already exist
    const edgeExists = state.currentWorkflow.edges.some(
      e => e.source === edge.source && e.target === edge.target
    );

    if (edgeExists) return state;

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        edges: [...state.currentWorkflow.edges, edge],
        updated_at: new Date().toISOString()
      }
    };
  }),

  removeEdge: (edgeId) => set((state) => {
    if (!state.currentWorkflow) return state;

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        edges: state.currentWorkflow.edges.filter(edge => edge.id !== edgeId),
        updated_at: new Date().toISOString()
      },
      selectedEdges: state.selectedEdges.filter(id => id !== edgeId)
    };
  }),

  updateEdge: (edgeId, updates) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedEdges = state.currentWorkflow.edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        edges: updatedEdges,
        updated_at: new Date().toISOString()
      }
    };
  }),

  // Selection management
  selectNode: (nodeId, multi = false) => set((state) => {
    if (multi) {
      return {
        selectedNodes: state.selectedNodes.includes(nodeId)
          ? state.selectedNodes.filter(id => id !== nodeId)
          : [...state.selectedNodes, nodeId]
      };
    }
    return {
      selectedNodes: state.selectedNodes.includes(nodeId) ? state.selectedNodes : [nodeId],
      selectedEdges: []
    };
  }),

  deselectNode: (nodeId) => set((state) => ({
    selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
  })),

  selectAll: () => set((state) => {
    if (!state.currentWorkflow) return state;
    return {
      selectedNodes: state.currentWorkflow.nodes.map(node => node.id),
      selectedEdges: state.currentWorkflow.edges.map(edge => edge.id)
    };
  }),

  deselectAll: () => set({
    selectedNodes: [],
    selectedEdges: []
  }),

  // Clipboard operations
  copySelection: () => set((state) => {
    if (!state.currentWorkflow) return state;

    const selectedNodesData = state.currentWorkflow.nodes.filter(
      node => state.selectedNodes.includes(node.id)
    );
    const selectedEdgesData = state.currentWorkflow.edges.filter(
      edge => state.selectedEdges.includes(edge.id)
    );

    return {
      clipboard: {
        nodes: selectedNodesData,
        edges: selectedEdgesData
      }
    };
  }),

  pasteSelection: () => set((state) => {
    if (!state.currentWorkflow || !state.clipboard) return state;

    const offset = { x: 50, y: 50 };
    const newNodeIds = new Map<string, string>();

    // Create new nodes with offset position
    const newNodes = state.clipboard.nodes.map(node => {
      const newId = uuidv4();
      newNodeIds.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y
        }
      };
    });

    // Update edge references to new node IDs
    const newEdges = state.clipboard.edges.map(edge => ({
      ...edge,
      id: uuidv4(),
      source: newNodeIds.get(edge.source) || edge.source,
      target: newNodeIds.get(edge.target) || edge.target
    }));

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: [...state.currentWorkflow.nodes, ...newNodes],
        edges: [...state.currentWorkflow.edges, ...newEdges],
        updated_at: new Date().toISOString()
      },
      selectedNodes: newNodes.map(node => node.id),
      selectedEdges: newEdges.map(edge => edge.id)
    };
  }),

  // Validation
  validateWorkflow: (): WorkflowValidationResult => {
    const state = get();
    if (!state.currentWorkflow) {
      return { is_valid: false, errors: [], warnings: [] };
    }

    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for orphaned nodes
    const connectedNodeIds = new Set(
      state.currentWorkflow.edges.flatMap(edge => [edge.source, edge.target])
    );

    state.currentWorkflow.nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id) && node.type !== 'input') {
        warnings.push({
          type: 'node',
          node_id: node.id,
          message: 'Node is not connected to any other nodes',
          suggestion: 'Connect this node to other nodes or remove it'
        });
      }
    });

    // Check for input/output nodes
    const inputNodes = state.currentWorkflow.nodes.filter(n => n.type === 'input');
    const outputNodes = state.currentWorkflow.nodes.filter(n => n.type === 'output');

    if (inputNodes.length === 0) {
      errors.push({
        type: 'flow',
        message: 'Workflow must have at least one input node',
        severity: 'error'
      });
    }

    if (outputNodes.length === 0) {
      warnings.push({
        type: 'flow',
        message: 'Workflow has no output nodes',
        suggestion: 'Consider adding output nodes to capture results'
      });
    }

    // Check for cycles (simplified check)
    const hasCycles = checkForCycles(state.currentWorkflow.nodes, state.currentWorkflow.edges);
    if (hasCycles) {
      errors.push({
        type: 'flow',
        message: 'Workflow contains cycles which may cause infinite loops',
        severity: 'error'
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings
    };
  },

  // UI state management
  setShowGrid: (show) => set({ showGrid: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
  setShowPropertiesPanel: (show) => set({ showPropertiesPanel: show }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.1, Math.min(2, level)) }),

  // Execution controls
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setIsDebugging: (debugging) => set({ isDebugging: debugging }),
  setExecutionMode: (mode) => set({ executionMode: mode }),
  setCurrentExecutionId: (id) => set({ currentExecutionId: id }),
  addExecutedNode: (nodeId) => set((state) => ({
    executedNodes: [...state.executedNodes, nodeId]
  })),
  clearExecutedNodes: () => set({ executedNodes: [] }),

  // Breakpoint management
  toggleBreakpoint: (nodeId) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, breakpoint: !node.breakpoint } : node
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      }
    };
  }),

  clearAllBreakpoints: () => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node => ({
      ...node,
      breakpoint: false
    }));

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      }
    };
  }),

  getBreakpointNodes: () => {
    const state = get();
    if (!state.currentWorkflow) return [];
    return state.currentWorkflow.nodes.filter(node => node.breakpoint).map(node => node.id);
  },

  // Node execution status
  setNodeExecutionStatus: (nodeId, status) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, executionStatus: status } : node
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      }
    };
  }),

  setNodeExecutionData: (nodeId, data) => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, executionData: data } : node
    );

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      }
    };
  }),

  clearAllExecutionData: () => set((state) => {
    if (!state.currentWorkflow) return state;

    const updatedNodes = state.currentWorkflow.nodes.map(node => ({
      ...node,
      executionStatus: undefined,
      executionData: undefined
    }));

    return {
      currentWorkflow: {
        ...state.currentWorkflow,
        nodes: updatedNodes,
        updated_at: new Date().toISOString()
      },
      executedNodes: []
    };
  })
}));

// Helper function to check for cycles in workflow graph
function checkForCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  nodes.forEach(node => adjacency.set(node.id, []));
  edges.forEach(edge => {
    adjacency.get(edge.source)?.push(edge.target);
  });

  function hasCycleDFS(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycleDFS(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycleDFS(node.id)) return true;
    }
  }

  return false;
}

export default useWorkflowStore;