import React, { useState, useEffect } from 'react';
import { useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import { workflowAPI } from '../../services/workflowApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import useWorkflowStore from '../../hooks/useWorkflow';
import { useToast } from '../ui/use-toast';

const NodePropertiesPanel: React.FC = () => {
  const { toast } = useToast();
  const { selectedNodes, currentWorkflow } = useWorkflowStore();
  const { getNodes, setNodes } = useReactFlow();
  const [nodeData, setNodeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Get selected node when selection changes
  useEffect(() => {
    if (selectedNodes.length === 1) {
      const nodes = getNodes();
      const selectedNode = nodes.find(node => node.id === selectedNodes[0]);
      if (selectedNode) {
        setNodeData({
          ...selectedNode.data,
          id: selectedNode.id,
          type: selectedNode.type
        });
      }
    } else {
      setNodeData(null);
    }
  }, [selectedNodes, getNodes]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    if (nodeData) {
      setNodeData({
        ...nodeData,
        [field]: value
      });
    }
  };

  // Handle nested data changes
  const handleDataChange = (field: string, value: any) => {
    if (nodeData) {
      setNodeData({
        ...nodeData,
        data: {
          ...nodeData.data,
          [field]: value
        }
      });
    }
  };

  // Save changes
  const saveChanges = async () => {
    if (!nodeData || !currentWorkflow) return;

    try {
      setLoading(true);
      
      // Update node in React Flow
      const nodes = getNodes();
      const updatedNodes = nodes.map(node => 
        node.id === nodeData.id 
          ? { 
              ...node, 
              data: nodeData.data,
              ...('label' in nodeData ? { data: { ...node.data, label: nodeData.label } } : {})
            }
          : node
      );
      
      // Update nodes in React Flow
      // setNodes(updatedNodes); // This should be handled by the store
      
      // Update in Zustand store
      useWorkflowStore.getState().updateNode(nodeData.id, {
        data: nodeData.data,
        ...(nodeData.label ? { data: { ...nodeData.data, label: nodeData.label } } : {})
      });

      toast({
        title: 'Success',
        description: 'Node properties updated successfully',
      });
    } catch (error) {
      console.error('Failed to update node properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to update node properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!nodeData) {
    return (
      <div className="text-sm text-gray-600">
        Select a node to edit its properties
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-sm mb-2">Node Properties</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={nodeData.data?.label || nodeData.label || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="node-description">Description</Label>
            <Textarea
              id="node-description"
              value={nodeData.data?.description || ''}
              onChange={(e) => handleDataChange('description', e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          
          {nodeData.type === 'agent' && (
            <>
              <div>
                <Label htmlFor="agent-id">Agent ID</Label>
                <Input
                  id="agent-id"
                  value={nodeData.data?.agent_id || ''}
                  onChange={(e) => handleDataChange('agent_id', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="agent-model">Model</Label>
                <Select 
                  value={nodeData.data?.agent_config?.model || 'llama2'} 
                  onValueChange={(value) => handleDataChange('agent_config', {
                    ...nodeData.data.agent_config,
                    model: value
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama2">Llama 2</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="codellama">Code Llama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="agent-temp">Temperature</Label>
                <Input
                  id="agent-temp"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={nodeData.data?.agent_config?.temperature || 0.7}
                  onChange={(e) => handleDataChange('agent_config', {
                    ...nodeData.data.agent_config,
                    temperature: parseFloat(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
            </>
          )}
          
          {nodeData.type === 'input' && (
            <>
              <div>
                <Label htmlFor="input-type">Input Type</Label>
                <Select 
                  value={nodeData.data?.input_type || 'text'} 
                  onValueChange={(value) => handleDataChange('input_type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="default-value">Default Value</Label>
                <Input
                  id="default-value"
                  value={nodeData.data?.default_value || ''}
                  onChange={(e) => handleDataChange('default_value', e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}
          
          {nodeData.type === 'output' && (
            <>
              <div>
                <Label htmlFor="output-type">Output Type</Label>
                <Select 
                  value={nodeData.data?.output_type || 'text'} 
                  onValueChange={(value) => handleDataChange('output_type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {nodeData.type === 'condition' && (
            <>
              <div>
                <Label htmlFor="condition-type">Condition Type</Label>
                <Select 
                  value={nodeData.data?.condition_type || 'if'} 
                  onValueChange={(value) => handleDataChange('condition_type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="if">If</SelectItem>
                    <SelectItem value="while">While</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="condition-expression">Condition Expression</Label>
                <Input
                  id="condition-expression"
                  value={nodeData.data?.condition_expression || ''}
                  onChange={(e) => handleDataChange('condition_expression', e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
        
        <Button 
          onClick={saveChanges} 
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default NodePropertiesPanel;