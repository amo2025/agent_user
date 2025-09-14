import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Save, Play, Download, Upload, Settings, Grid, Bug } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { useToast } from '../components/ui/use-toast';
import useWorkflowStore from '../hooks/useWorkflow';
import { workflowAPI } from '../services';
import AgentNode from '../components/workflow/AgentNode';
import InputNode from '../components/workflow/InputNode';
import OutputNode from '../components/workflow/OutputNode';
import ConditionNode from '../components/workflow/ConditionNode';
import DebugPanel from '../components/workflow/DebugPanel';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types';

// Node types configuration
const nodeTypes: NodeTypes = {
  input: InputNode,
  output: OutputNode,
  agent: AgentNode,
  condition: ConditionNode,
  // Add more node types as needed
};

const WorkflowEditor: React.FC = () => {
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  // Zustand store
  const {
    currentWorkflow,
    setCurrentWorkflow,
    showGrid,
    showMinimap,
    showPropertiesPanel,
    setShowGrid,
    setShowMinimap,
    setShowPropertiesPanel,
  } = useWorkflowStore();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('input');
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Node type options
  const nodeOptions = [
    { type: 'input' as NodeType, label: 'Input', icon: '📥', description: 'Workflow input data' },
    { type: 'output' as NodeType, label: 'Output', icon: '📤', description: 'Workflow output data' },
    { type: 'agent' as NodeType, label: 'Agent', icon: '🤖', description: 'AI Agent processing' },
    { type: 'condition' as NodeType, label: 'Condition', icon: '🔀', description: 'Branch logic' },
  ];

  // Load existing workflows or create new one
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const workflows = await workflowAPI.getWorkflows();
      if (workflows.length > 0) {
        loadWorkflow(workflows[0]);
      } else {
        createNewWorkflow();
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflows',
        variant: 'destructive',
      });
      createNewWorkflow();
    } finally {
      setIsLoading(false);
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow = {
      id: '',
      name: 'Untitled Workflow',
      description: '',
      nodes: [],
      edges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '',
    };
    setCurrentWorkflow(newWorkflow);
    setNodes([]);
    setEdges([]);
  };

  const loadWorkflow = (workflow: any) => {
    setCurrentWorkflow(workflow);
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
  };

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add new node
  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      position: reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }),
      data: getDefaultNodeData(selectedNodeType),
    };

    setNodes((nds) => nds.concat(newNode));

    toast({
      title: 'Node Added',
      description: `${selectedNodeType} node added to workflow`,
    });
  }, [selectedNodeType, reactFlowInstance]);

  // Get default data for different node types
  const getDefaultNodeData = (nodeType: NodeType) => {
    const baseData = {
      label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
      description: '',
      validated: false,
    };

    switch (nodeType) {
      case 'input':
        return {
          ...baseData,
          input_type: 'text',
          default_value: '',
          required: true,
        };
      case 'output':
        return {
          ...baseData,
          output_type: 'text',
          format: '',
        };
      case 'agent':
        return {
          ...baseData,
          agent_id: '',
          agent_config: {
            model: 'llama2',
            temperature: 0.7,
            max_tokens: 500,
            tools: [],
          },
        };
      case 'condition':
        return {
          ...baseData,
          condition_type: 'if',
          condition_expression: '',
          branches: [
            { id: 'true', label: 'True', condition: 'true' },
            { id: 'false', label: 'False', condition: 'false' },
          ],
        };
      default:
        return baseData;
    }
  };

  // Save workflow
  const saveWorkflow = async () => {
    if (!currentWorkflow) return;

    try {
      setIsLoading(true);

      const workflowData = {
        ...currentWorkflow,
        nodes: nodes as any,
        edges: edges as any,
      };

      let savedWorkflow;
      if (currentWorkflow.id) {
        savedWorkflow = await workflowAPI.updateWorkflow(currentWorkflow.id, workflowData);
      } else {
        savedWorkflow = await workflowAPI.createWorkflow(workflowData);
      }

      setCurrentWorkflow(savedWorkflow);

      toast({
        title: 'Workflow Saved',
        description: 'Workflow saved successfully',
      });
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute workflow
  const executeWorkflow = async () => {
    if (!currentWorkflow?.id) {
      toast({
        title: 'Error',
        description: 'Please save the workflow first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const execution = await workflowAPI.executeWorkflow({
        workflow_id: currentWorkflow.id,
        dry_run: false,
      });

      toast({
        title: 'Workflow Started',
        description: `Execution ID: ${execution.execution_id}`,
      });
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export workflow
  const exportWorkflow = async () => {
    if (!currentWorkflow?.id) {
      toast({
        title: 'Error',
        description: 'No workflow to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      const workflowData = await workflowAPI.exportWorkflow(currentWorkflow.id);
      const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentWorkflow.name.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Workflow Exported',
        description: 'Workflow exported successfully',
      });
    } catch (error) {
      console.error('Failed to export workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to export workflow',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">
            {currentWorkflow?.name || 'Workflow Editor'}
          </h1>
          {currentWorkflow && (
            <Badge variant="outline">
              {nodes.length} nodes • {edges.length} connections
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Node Type Selector */}
          <select
            value={selectedNodeType}
            onChange={(e) => setSelectedNodeType(e.target.value as NodeType)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {nodeOptions.map((option) => (
              <option key={option.type} value={option.type}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>

          <Button onClick={addNode} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Node
          </Button>

          <Button onClick={saveWorkflow} size="sm" disabled={isLoading}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>

          <Button onClick={executeWorkflow} size="sm" variant="default" disabled={isLoading}>
            <Play className="w-4 h-4 mr-1" />
            Execute
          </Button>

          <Button onClick={exportWorkflow} size="sm" variant="outline" disabled={isLoading}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          {/* View Controls */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant={showDebugPanel ? "default" : "outline"}
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              title="调试面板"
            >
              <Bug className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={showGrid ? "default" : "outline"}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={showMinimap ? "default" : "outline"}
              onClick={() => setShowMinimap(!showMinimap)}
            >
              <div className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            {showGrid && <Background />}
            <Controls />
            {showMinimap && <MiniMap />}

            {/* Node Palette Panel */}
            <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 m-2">
              <h3 className="font-semibold text-sm mb-3">Node Palette</h3>
              <div className="space-y-2">
                {nodeOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelectedNodeType(option.type)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedNodeType === option.type
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{option.icon}</span>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <div className="w-80 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Properties
              </h2>
            </div>
            <div className="flex-1 p-4">
              <Tabs defaultValue="node">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="node">Node</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                </TabsList>
                <TabsContent value="node" className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Select a node to edit its properties
                  </div>
                </TabsContent>
                <TabsContent value="workflow" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={currentWorkflow?.name || ''}
                      onChange={(e) => {
                        if (currentWorkflow) {
                          setCurrentWorkflow({
                            ...currentWorkflow,
                            name: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md text-sm h-20"
                      value={currentWorkflow?.description || ''}
                      onChange={(e) => {
                        if (currentWorkflow) {
                          setCurrentWorkflow({
                            ...currentWorkflow,
                            description: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="w-80 border-l bg-background">
            <DebugPanel onClose={() => setShowDebugPanel(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component to provide ReactFlow context
const WorkflowEditorPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
};

export default WorkflowEditorPage;