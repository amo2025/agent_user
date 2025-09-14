import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { GitBranch, RotateCcw, Zap } from 'lucide-react';
import { ConditionNodeData } from '../../types/workflow';

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.condition_type) {
      case 'if_else':
        return <GitBranch className="h-4 w-4" />;
      case 'switch':
        return <Zap className="h-4 w-4" />;
      case 'loop':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`min-w-48 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {getIcon()}
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600">
          <div>类型: {data.condition_type}</div>
          <div className="mt-1 font-mono text-xs bg-gray-100 p-1 rounded">
            {data.condition_expression}
          </div>
          {data.description && (
            <div className="mt-1 text-gray-500">{data.description}</div>
          )}
        </div>
      </CardContent>
      
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
      />
      
      {/* 输出连接点 - True */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 bg-blue-500"
        style={{ top: '30%' }}
      />
      
      {/* 输出连接点 - False */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-3 h-3 bg-red-500"
        style={{ top: '70%' }}
      />
    </Card>
  );
};

export default ConditionNode;