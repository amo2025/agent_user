import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ArrowRight, FileInput } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils';

interface InputNodeData {
  label: string;
  description?: string;
  input_type: 'text' | 'file' | 'json' | 'url';
  default_value?: string;
  required?: boolean;
  validated?: boolean;
  error?: string;
}

const InputNode: React.FC<NodeProps<InputNodeData>> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Card className={cn(
        "p-4 min-w-[180px] border-2 transition-all",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200",
        data.error ? "border-red-500 bg-red-50" : ""
      )}>
        <div className="flex items-center gap-2 mb-2">
          <FileInput className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            {data.description && (
              <p className="text-xs text-gray-600">{data.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Input
          </Badge>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium capitalize">{data.input_type}</span>
          </div>
          {data.required && (
            <div className="flex justify-between">
              <span className="text-gray-600">Required:</span>
              <span className="font-medium text-red-600">Yes</span>
            </div>
          )}
          {data.default_value && (
            <div className="flex justify-between">
              <span className="text-gray-600">Default:</span>
              <span className="font-medium truncate max-w-[100px]">{data.default_value}</span>
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
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
};

export default InputNode;