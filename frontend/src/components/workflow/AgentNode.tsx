import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Settings, PauseCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils';
import useWorkflowStore from '../../hooks/useWorkflow';

interface AgentNodeData {
  label: string;
  description?: string;
  agent_id?: string;
  agent_config?: {
    model: string;
    temperature: number;
    max_tokens: number;
    tools: string[];
    system_prompt?: string;
  };
  validated?: boolean;
  error?: string;
  breakpoint?: boolean;
  executionStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  executionData?: any;
}

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected, id }) => {
  const { toggleBreakpoint } = useWorkflowStore();

  const handleBreakpointToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBreakpoint(id);
  };

  const getExecutionStatusColor = () => {
    switch (data.executionStatus) {
      case 'running': return 'border-blue-500 shadow-blue-200';
      case 'completed': return 'border-green-500 shadow-green-200';
      case 'failed': return 'border-red-500 shadow-red-200';
      case 'skipped': return 'border-gray-400 shadow-gray-200';
      default: return '';
    }
  };

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
      />

      <Card className={cn(
        "p-4 min-w-[200px] border-2 transition-all relative",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200",
        data.error ? "border-red-500 bg-red-50" : "",
        getExecutionStatusColor(),
        data.breakpoint ? "ring-2 ring-red-400" : ""
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            {data.description && (
              <p className="text-xs text-gray-600">{data.description}</p>
            )}
          </div>
          {data.validated && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Ready
            </Badge>
          )}
        </div>

        {data.agent_config && (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium">{data.agent_config.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Temp:</span>
              <span className="font-medium">{data.agent_config.temperature}</span>
            </div>
            {data.agent_config.tools.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tools:</span>
                <span className="font-medium">{data.agent_config.tools.length}</span>
              </div>
            )}
          </div>
        )}

          {/* Execution Status */}
          {data.executionStatus && (
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  data.executionStatus === 'running' && "text-blue-600 border-blue-600",
                  data.executionStatus === 'completed' && "text-green-600 border-green-600",
                  data.executionStatus === 'failed' && "text-red-600 border-red-600",
                  data.executionStatus === 'skipped' && "text-gray-600 border-gray-600"
                )}
              >
                {data.executionStatus === 'running' && '执行中'}
                {data.executionStatus === 'completed' && '已完成'}
                {data.executionStatus === 'failed' && '失败'}
                {data.executionStatus === 'skipped' && '已跳过'}
              </Badge>
              {data.executionData && (
                <Badge variant="secondary" className="text-xs">
                  有数据
                </Badge>
              )}
            </div>
          )}

        {data.error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded">
            {data.error}
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1">
          {data.breakpoint && (
            <PauseCircle className="w-4 h-4 text-red-500" />
          )}
          <button
            onClick={handleBreakpointToggle}
            className={cn(
              "p-1 rounded hover:bg-gray-100",
              data.breakpoint ? "text-red-500" : "text-gray-400 hover:text-gray-600"
            )}
            title={data.breakpoint ? "移除断点" : "添加断点"}
          >
            <PauseCircle className="w-4 h-4" />
          </button>
          <Settings className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
        </div>
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
};

export default AgentNode;