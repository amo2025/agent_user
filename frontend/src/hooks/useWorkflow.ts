import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowNode, WorkflowEdge, Workflow } from '../types/workflow';

interface WorkflowState {
  // 当前工作流
  currentWorkflow: Workflow | null;
  
  // 节点和边
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // 选中状态
  selectedNodes: string[];
  selectedEdges: string[];
  
  // 操作历史
  history: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[];
  historyIndex: number;
  
  // 操作方法
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (type: WorkflowNode['type'], position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  addEdge: (edge: Omit<WorkflowEdge, 'id'>) => void;
  removeEdge: (edgeId: string) => void;
  
  // 选择操作
  setSelectedNodes: (nodeIds: string[]) => void;
  setSelectedEdges: (edgeIds: string[]) => void;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // 工作流操作
  loadWorkflow: (workflow: Workflow) => void;
  saveWorkflow: () => Promise<void>;
  clearWorkflow: () => void;
}

export const useWorkflow = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  history: [],
  historyIndex: -1,

  setNodes: (nodes) => {
    set({ nodes });
    get().saveToHistory();
  },

  setEdges: (edges) => {
    set({ edges });
    get().saveToHistory();
  },

  addNode: (type, position) => {
    const newNode: WorkflowNode = {
      id: uuidv4(),
      type,
      position,
      data: {
        label: getDefaultLabel(type),
        ...getDefaultNodeData(type)
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }));
    get().saveToHistory();
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter(node => node.id !== nodeId),
      edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
    }));
    get().saveToHistory();
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    }));
    get().saveToHistory();
  },

  addEdge: (edge) => {
    const newEdge: WorkflowEdge = {
      ...edge,
      id: uuidv4()
    };

    set((state) => ({
      edges: [...state.edges, newEdge]
    }));
    get().saveToHistory();
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter(edge => edge.id !== edgeId),
      selectedEdges: state.selectedEdges.filter(id => id !== edgeId)
    }));
    get().saveToHistory();
  },

  setSelectedNodes: (nodeIds) => {
    set({ selectedNodes: nodeIds });
  },

  setSelectedEdges: (edgeIds) => {
    set({ selectedEdges: edgeIds });
  },

  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    
    // 限制历史记录数量
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        nodes: [...prevState.nodes],
        edges: [...prevState.edges],
        historyIndex: historyIndex - 1
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: [...nextState.nodes],
        edges: [...nextState.edges],
        historyIndex: historyIndex + 1
      });
    }
  },

  loadWorkflow: (workflow) => {
    set({
      currentWorkflow: workflow,
      nodes: workflow.nodes,
      edges: workflow.edges,
      selectedNodes: [],
      selectedEdges: [],
      history: [{ nodes: workflow.nodes, edges: workflow.edges }],
      historyIndex: 0
    });
  },

  saveWorkflow: async () => {
    const { currentWorkflow, nodes, edges } = get();
    if (!currentWorkflow) return;

    const updatedWorkflow: Workflow = {
      ...currentWorkflow,
      nodes,
      edges,
      updated_at: new Date().toISOString()
    };

    // TODO: 调用API保存工作流
    console.log('Saving workflow:', updatedWorkflow);
    
    set({ currentWorkflow: updatedWorkflow });
  },

  clearWorkflow: () => {
    set({
      currentWorkflow: null,
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1
    });
  }
}));

// 辅助函数
function getDefaultLabel(type: WorkflowNode['type']): string {
  switch (type) {
    case 'input':
      return '输入节点';
    case 'output':
      return '输出节点';
    case 'agent':
      return 'Agent节点';
    case 'condition':
      return '条件节点';
    default:
      return '未知节点';
  }
}

function getDefaultNodeData(type: WorkflowNode['type']): Record<string, any> {
  switch (type) {
    case 'input':
      return {
        input_type: 'text',
        required: true,
        description: '请输入数据'
      };
    case 'output':
      return {
        output_type: 'text',
        description: '输出结果'
      };
    case 'agent':
      return {
        agent_config: {
          model: 'llama2',
          temperature: 0.7,
          max_tokens: 1000,
          system_prompt: '你是一个有用的AI助手。'
        },
        description: 'AI处理节点'
      };
    case 'condition':
      return {
        condition_type: 'if_else',
        condition_expression: 'true',
        description: '条件判断节点'
      };
    default:
      return {};
  }
}