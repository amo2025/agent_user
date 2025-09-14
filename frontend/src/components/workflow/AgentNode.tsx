import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, Settings } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils';

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
}

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
      />

      <Card className={cn(
        "p-4 min-w-[200px] border-2 transition-all",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200",
        data.error ? "border-red-500 bg-red-50" : ""
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

        {data.error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded">
            {data.error}
          </div>
        )}

        <div className="absolute top-2 right-2">
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