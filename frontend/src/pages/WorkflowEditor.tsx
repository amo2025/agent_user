import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAuth } from '../hooks/useAuth';
import { useWorkflow } from '../hooks/useWorkflow';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Save, Play, Plus, Settings, Undo, Redo } from 'lucide-react';

// 导入自定义节点组件
import InputNode from '../components/workflow/InputNode';
import OutputNode from '../components/workflow/OutputNode';
import AgentNode from '../components/workflow/AgentNode';
import ConditionNode from '../components/workflow/ConditionNode';

// 定义节点类型
const nodeTypes: NodeTypes = {
  input: InputNode,
  output: OutputNode,
  agent: AgentNode,
  condition: ConditionNode,
};

const WorkflowEditor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // 使用 React Flow 的状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // 使用工作流状态管理
  const {
    addNode,
    history,
    historyIndex,
    undo,
    redo,
    saveWorkflow,
    clearWorkflow
  } = useWorkflow();

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // 添加节点到画布
  const handleAddNode = useCallback((nodeType: 'input' | 'output' | 'agent' | 'condition') => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };
    
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: getDefaultNodeData(nodeType),
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // 获取默认节点数据
  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'input':
        return {
          label: '输入节点',
          input_type: 'text',
          required: true,
          description: '请输入数据'
        };
      case 'output':
        return {
          label: '输出节点',
          output_type: 'text',
          description: '输出结果'
        };
      case 'agent':
        return {
          label: 'Agent节点',
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
          label: '条件节点',
          condition_type: 'if_else',
          condition_expression: 'true',
          description: '条件判断节点'
        };
      default:
        return { label: '未知节点' };
    }
  };

  // 保存工作流
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: 实现保存逻辑
      console.log('Saving workflow with nodes:', nodes, 'and edges:', edges);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟保存
      alert('工作流已保存！');
    } catch (error) {
      console.error('Save failed:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges]);

  // 运行工作流
  const handleRun = useCallback(() => {
    if (nodes.length === 0) {
      alert('请先添加节点到工作流中');
      return;
    }
    
    console.log('Running workflow with nodes:', nodes, 'and edges:', edges);
    alert('工作流开始运行！');
  }, [nodes, edges]);

  // 撤销/重做快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // 认证检查
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">返回</span>
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                工作流编辑器
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="hidden sm:flex"
              >
                <Undo className="mr-2 h-4 w-4" />
                撤销
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="hidden sm:flex"
              >
                <Redo className="mr-2 h-4 w-4" />
                重做
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? '保存中...' : '保存'}
              </Button>
              <Button
                size="sm"
                onClick={handleRun}
                className="text-xs sm:text-sm"
              >
                <Play className="mr-2 h-4 w-4" />
                运行
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Node Palette */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">节点库</CardTitle>
                <CardDescription className="text-sm">
                  点击添加节点到工作流画布
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => handleAddNode('input')}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    输入节点
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => handleAddNode('agent')}
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    Agent节点
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => handleAddNode('condition')}
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    条件节点
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => handleAddNode('output')}
                  >
                    <Play className="mr-2 h-3 w-3" />
                    输出节点
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Action Buttons */}
            <div className="mt-4 space-y-2 sm:hidden">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isLoading}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? '保存中...' : '保存工作流'}
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-1"
                >
                  <Undo className="mr-2 h-4 w-4" />
                  撤销
                </Button>
                <Button
                  variant="outline"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1"
                >
                  <Redo className="mr-2 h-4 w-4" />
                  重做
                </Button>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">工作流画布</CardTitle>
                <CardDescription className="text-sm">
                  拖拽节点并连接它们来创建工作流
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 sm:h-[600px] bg-gray-50 rounded-lg overflow-hidden">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    className="bg-gray-50"
                  >
                    <Controls />
                    <MiniMap />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Node Count Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          当前工作流包含 {nodes.length} 个节点和 {edges.length} 个连接
        </div>
      </main>
    </div>
  );
};

export default WorkflowEditor;