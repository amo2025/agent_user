import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowLeft, FileOutput } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils';

interface OutputNodeData {
  label: string;
  description?: string;
  output_type: 'text' | 'file' | 'json' | 'table';
  format?: string;
  validated?: boolean;
  error?: string;
}

const OutputNode: React.FC<NodeProps<OutputNodeData>> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500"
      />

      <Card className={cn(
        "p-4 min-w-[180px] border-2 transition-all",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200",
        data.error ? "border-red-500 bg-red-50" : ""
      )}>
        <div className="flex items-center gap-2 mb-2">
          <FileOutput className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            {data.description && (
              <p className="text-xs text-gray-600">{data.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Output
          </Badge>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium capitalize">{data.output_type}</span>
          </div>
          {data.format && (
            <div className="flex justify-between">
              <span className="text-gray-600">Format:</span>
              <span className="font-medium">{data.format}</span>
            </div>
          )}
        </div>

        {data.error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded">
            {data.error}
          </div>
        )}
      </Card>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500"
      />
    </div>
  );
};

export default OutputNode;