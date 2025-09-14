import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileOutput, FileText, Code, Table } from 'lucide-react';
import { OutputNodeData } from '../../types/workflow';

const OutputNode: React.FC<NodeProps<OutputNodeData>> = ({ data, selected }) => {
  const getIcon = () => {
    switch (data.output_type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'file':
        return <FileOutput className="h-4 w-4" />;
      case 'json':
        return <Code className="h-4 w-4" />;
      case 'table':
        return <Table className="h-4 w-4" />;
      default:
        return <FileOutput className="h-4 w-4" />;
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
          <div>类型: {data.output_type}</div>
          {data.format && <div>格式: {data.format}</div>}
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
    </Card>
  );
};

export default OutputNode;