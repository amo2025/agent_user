import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bot, Settings } from 'lucide-react';
import { AgentNodeData } from '../../types/workflow';

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected }) => {
  return (
    <Card className={`min-w-48 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">
          {data.agent_config && (
            <>
              <div>模型: {data.agent_config.model}</div>
              <div>温度: {data.agent_config.temperature}</div>
              <div>最大令牌: {data.agent_config.max_tokens}</div>
            </>
          )}
          {data.description && (
            <div className="mt-1 text-gray-500">{data.description}</div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
          <Settings className="h-3 w-3" />
          配置
        </div>
      </CardContent>
      
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
      />
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </Card>
  );
};

export default AgentNode;