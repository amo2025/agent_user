import React, { useState } from 'react';
import { Play, Pause, CornerDownRight, CornerRightDown, Stop, Bug, X, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import useWorkflowStore from '../../hooks/useWorkflow';
import { workflowAPI } from '../../services/workflowApi';

interface DebugPanelProps {
  className?: string;
  onClose?: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ className = '', onClose }) => {
  const {
    currentWorkflow,
    isExecuting,
    isDebugging,
    executionMode,
    currentExecutionId,
    executedNodes,
    nodes,
    setIsExecuting,
    setIsDebugging,
    setExecutionMode,
    setCurrentExecutionId,
    addExecutedNode,
    clearAllBreakpoints,
    getBreakpointNodes,
    setNodeExecutionStatus,
    clearAllExecutionData
  } = useWorkflowStore();

  const [isStepping, setIsStepping] = useState(false);
  const [currentStepNode, setCurrentStepNode] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<Array<{
    timestamp: string;
    nodeId: string;
    nodeName: string;
    status: string;
    data?: any;
    error?: string;
  }>>([]);

  const breakpointNodes = getBreakpointNodes();

  const addLog = (log: {
    nodeId: string;
    nodeName: string;
    status: string;
    data?: any;
    error?: string;
  }) => {
    setExecutionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      ...log
    }]);
  };

  const handleStartDebug = async () => {
    if (!currentWorkflow) return;

    setIsDebugging(true);
    setExecutionMode('debug');
    clearAllExecutionData();
    setExecutionLogs([]);

    try {
      // Start workflow execution in debug mode
      const response = await workflowAPI.executeWorkflow(currentWorkflow.id, {}, 'debug');
      setCurrentExecutionId(response.execution_id);
      setIsExecuting(true);

      addLog({
        nodeId: 'workflow',
        nodeName: 'Workflow',
        status: 'started',
        data: { executionId: response.execution_id }
      });

    } catch (error) {
      console.error('Failed to start debug execution:', error);
      setIsDebugging(false);
      addLog({
        nodeId: 'workflow',
        nodeName: 'Workflow',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleStepExecution = async () => {
    if (!currentWorkflow || !currentExecutionId) return;

    setIsStepping(true);

    try {
      // Get next node to execute (simplified logic)
      const nextNode = getNextNodeToExecute();
      if (!nextNode) {
        addLog({
          nodeId: 'workflow',
          nodeName: 'Workflow',
          status: 'completed'
        });
        handleStopExecution();
        return;
      }

      setCurrentStepNode(nextNode);
      setNodeExecutionStatus(nextNode, 'running');

      addLog({
        nodeId: nextNode,
        nodeName: nodes.find(n => n.id === nextNode)?.data?.name || nextNode,
        status: 'executing'
      });

      // Simulate step execution (in real implementation, this would call API)
      setTimeout(() => {
        setNodeExecutionStatus(nextNode, 'completed');
        addExecutedNode(nextNode);

        addLog({
          nodeId: nextNode,
          nodeName: nodes.find(n => n.id === nextNode)?.data?.name || nextNode,
          status: 'completed',
          data: { result: 'Step executed successfully' }
        });

        setIsStepping(false);
        setCurrentStepNode(null);
      }, 1000);

    } catch (error) {
      console.error('Step execution failed:', error);
      setIsStepping(false);
      if (currentStepNode) {
        setNodeExecutionStatus(currentStepNode, 'failed');
      }
    }
  };

  const handleContinueExecution = () => {
    // Continue execution until next breakpoint
    if (breakpointNodes.length > 0) {
      // In real implementation, this would continue execution via API
      addLog({
        nodeId: 'workflow',
        nodeName: 'Workflow',
        status: 'continuing',
        data: { breakpoints: breakpointNodes }
      });
    } else {
      // No breakpoints, run to completion
      handleStepExecution();
    }
  };

  const handleStopExecution = () => {
    setIsExecuting(false);
    setIsDebugging(false);
    setExecutionMode('run');
    setCurrentExecutionId(null);
    setCurrentStepNode(null);
    setIsStepping(false);

    addLog({
      nodeId: 'workflow',
      nodeName: 'Workflow',
      status: 'stopped'
    });
  };

  const getNextNodeToExecute = (): string | null => {
    // Simplified logic to get next node
    // In real implementation, this would be based on workflow graph and execution state
    if (!currentWorkflow) return null;

    const availableNodes = currentWorkflow.nodes.filter(node =>
      !executedNodes.includes(node.id) && node.type !== 'input'
    );

    return availableNodes.length > 0 ? availableNodes[0].id : null;
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'started': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={`debug-panel ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bug className="h-4 w-4" />
          调试控制台
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Execution Controls */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">执行控制</h4>
          <div className="flex gap-2">
            {!isDebugging ? (
              <Button
                size="sm"
                onClick={handleStartDebug}
                disabled={!currentWorkflow || isExecuting}
                className="flex items-center gap-1"
              >
                <Bug className="h-3 w-3" />
                开始调试
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleStepExecution}
                  disabled={isStepping || !currentExecutionId}
                  className="flex items-center gap-1"
                >
                  <CornerDownRight className="h-3 w-3" />
                  单步执行
                </Button>
                <Button
                  size="sm"
                  onClick={handleContinueExecution}
                  disabled={!currentExecutionId}
                  className="flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  继续
                </Button>
                <Button
                  size="sm"
                  onClick={handleStopExecution}
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Stop className="h-3 w-3" />
                  停止
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Breakpoint Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">断点管理</h4>
            <Button
              size="xs"
              variant="ghost"
              onClick={clearAllBreakpoints}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              清除全部
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            断点数量: {breakpointNodes.length}
          </div>
          {breakpointNodes.length > 0 && (
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {breakpointNodes.map(nodeId => {
                const node = nodes.find(n => n.id === nodeId);
                return (
                  <div key={nodeId} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>{node?.data?.name || nodeId}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Execution Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">执行状态</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>模式:</span>
              <Badge variant={isDebugging ? "default" : "secondary"} className="text-xs">
                {executionMode === 'debug' ? '调试' : executionMode === 'step' ? '单步' : '运行'}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>状态:</span>
              <Badge
                variant={isExecuting ? "default" : "secondary"}
                className="text-xs"
              >
                {isExecuting ? '执行中' : '已停止'}
              </Badge>
            </div>
            {currentStepNode && (
              <div className="flex justify-between text-xs">
                <span>当前节点:</span>
                <span className="text-muted-foreground">
                  {nodes.find(n => n.id === currentStepNode)?.data?.name || currentStepNode}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Execution Log */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">执行日志</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
            {executionLogs.length === 0 ? (
              <div className="text-muted-foreground">暂无日志</div>
            ) : (
              executionLogs.slice(-10).map((log, index) => (
                <div key={index} className="flex items-start gap-2 p-1 rounded bg-muted/50">
                  <div className={`w-2 h-2 rounded-full mt-1 ${getExecutionStatusColor(log.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{log.nodeName}</div>
                    <div className="text-muted-foreground">{log.status}</div>
                    {log.error && (
                      <div className="text-red-500 text-xs">{log.error}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;