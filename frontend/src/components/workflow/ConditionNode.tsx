import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Code } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils';

interface ConditionNodeData {
  label: string;
  description?: string;
  condition_type: 'if' | 'switch' | 'loop';
  condition_expression: string;
  branches: {
    id: string;
    label: string;
    condition?: string;
    target_node_id?: string;
  }[];
  validated?: boolean;
  error?: string;
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ data, selected }) => {
  const getBranchColor = (branchId: string) => {
    const colors = ['bg-green-100 text-green-800', 'bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800'];
    return colors[parseInt(branchId) % colors.length];
  };

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />

      <Card className={cn(
        "p-4 min-w-[200px] border-2 transition-all",
        selected ? "border-blue-500 shadow-lg" : "border-gray-200",
        data.error ? "border-red-500 bg-red-50" : ""
      )}>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-5 h-5 text-purple-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.label}</h3>
            {data.description && (
              <p className="text-xs text-gray-600">{data.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            {data.condition_type.toUpperCase()}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Code className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium">Condition:</span>
          </div>
          <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700">
            {data.condition_expression.length > 50
              ? `${data.condition_expression.substring(0, 50)}...`
              : data.condition_expression}
          </div>
        </div>

        {data.branches.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 mb-1">Branches:</div>
            {data.branches.map((branch) => (
              <div key={branch.id} className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-xs",
                getBranchColor(branch.id)
              )}>
                <div className="w-2 h-2 rounded-full bg-current" />
                <span className="font-medium">{branch.label}</span>
                {branch.condition && (
                  <span className="text-gray-600 ml-auto">
                    {branch.condition.length > 20
                      ? `${branch.condition.substring(0, 20)}...`
                      : branch.condition}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {data.error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-xs rounded">
            {data.error}
          </div>
        )}

        {data.validated && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Validated
            </Badge>
          </div>
        )}
      </Card>

      {/* Branch handles */}
      {data.branches.map((branch, index) => (
        <Handle
          key={branch.id}
          type="source"
          position={Position.Right}
          id={branch.id}
          style={{
            top: `${20 + (index * 15)}%`,
            backgroundColor: getBranchColor(branch.id).includes('green') ? '#16a34a' :
                           getBranchColor(branch.id).includes('red') ? '#dc2626' :
                           getBranchColor(branch.id).includes('blue') ? '#2563eb' : '#ca8a04'
          }}
          className="w-3 h-3"
        />
      ))}
    </div>
  );
};

export default ConditionNode;