import api from './api';
import {
  Workflow,
  WorkflowTemplate,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecutionResponse,
  WorkflowExecution,
  WorkflowValidationResult
} from '../types';

export const workflowAPI = {
  // Workflow CRUD operations
  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await api.get('/workflows');
    return response.data;
  },

  getWorkflow: async (id: string): Promise<Workflow> => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  createWorkflow: async (workflow: CreateWorkflowRequest): Promise<Workflow> => {
    const response = await api.post('/workflows', workflow);
    return response.data;
  },

  updateWorkflow: async (id: string, workflow: UpdateWorkflowRequest): Promise<Workflow> => {
    const response = await api.put(`/workflows/${id}`, workflow);
    return response.data;
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  // Workflow execution
  executeWorkflow: async (request: ExecuteWorkflowRequest): Promise<WorkflowExecutionResponse> => {
    const response = await api.post('/workflows/execute', request);
    return response.data;
  },

  getWorkflowExecution: async (executionId: string): Promise<WorkflowExecution> => {
    const response = await api.get(`/workflow-executions/${executionId}`);
    return response.data;
  },

  // Workflow validation
  validateWorkflow: async (workflow: Workflow): Promise<WorkflowValidationResult> => {
    const response = await api.post('/workflows/validate', workflow);
    return response.data;
  },

  // Workflow templates
  getWorkflowTemplates: async (category?: string): Promise<WorkflowTemplate[]> => {
    const params = category ? { category } : {};
    const response = await api.get('/workflow-templates', { params });
    return response.data;
  },

  getWorkflowTemplate: async (id: string): Promise<WorkflowTemplate> => {
    const response = await api.get(`/workflow-templates/${id}`);
    return response.data;
  },

  useWorkflowTemplate: async (templateId: string, name: string, description?: string): Promise<Workflow> => {
    const response = await api.post('/workflows/from-template', {
      template_id: templateId,
      name,
      description
    });
    return response.data;
  },

  // Workflow import/export
  exportWorkflow: async (id: string, format: 'json' | 'yaml' = 'json'): Promise<any> => {
    const response = await api.get(`/workflows/${id}/export`, {
      params: { format }
    });
    return response.data;
  },

  importWorkflow: async (workflowData: any, format: 'json' | 'yaml' = 'json'): Promise<Workflow> => {
    const response = await api.post('/workflows/import', {
      data: workflowData,
      format
    });
    return response.data;
  }
};

export default workflowAPI;