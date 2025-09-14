import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input, FileText, Globe, Code } from 'lucide-react';
import { InputNodeData } from '../../types/workflow';

const InputNode: React.FC<NodeProps<InputNodeData>> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.input_type) {
      case 'text':
        return <Input className="h-4 w-4" />;
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <Globe className="h-4 w-4" />;
      case 'json':
        return <Code className="h-4 w-4" />;
      default:
        return <Input className="h-4 w-4" />;
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
          <div>类型: {data.input_type}</div>
          {data.required && <div className="text-red-500">必填</div>}
          {data.description && (
            <div className="mt-1 text-gray-500">{data.description}</div>
          )}
        </div>
      </CardContent>
      
      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </Card>
  );
};

export default InputNode;