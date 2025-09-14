import { api } from './api';
import { Workflow, WorkflowExecution } from '../types/workflow';

export const workflowAPI = {
  // 获取用户工作流列表
  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await api.get('/api/workflows/');
    return response.data;
  },

  // 创建工作流
  createWorkflow: async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Workflow> => {
    const response = await api.post('/api/workflows/', workflow);
    return response.data;
  },

  // 获取特定工作流
  getWorkflow: async (id: string): Promise<Workflow> => {
    const response = await api.get(`/api/workflows/${id}`);
    return response.data;
  },

  // 更新工作流
  updateWorkflow: async (id: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await api.put(`/api/workflows/${id}`, workflow);
    return response.data;
  },

  // 删除工作流
  deleteWorkflow: async (id: string): Promise<void> => {
    await api.delete(`/api/workflows/${id}`);
  },

  // 执行工作流
  executeWorkflow: async (data: {
    workflow_id: string;
    input_data: Record<string, any>;
    dry_run?: boolean;
  }): Promise<WorkflowExecution> => {
    const response = await api.post('/api/workflows/execute', data);
    return response.data;
  },

  // 获取执行状态
  getExecution: async (id: string): Promise<WorkflowExecution> => {
    const response = await api.get(`/api/workflows/executions/${id}`);
    return response.data;
  },

  // 获取执行历史
  getExecutions: async (workflowId?: string): Promise<WorkflowExecution[]> => {
    const params = workflowId ? { workflow_id: workflowId } : {};
    const response = await api.get('/api/workflows/executions', { params });
    return response.data;
  },

  // 验证工作流
  validateWorkflow: async (workflow: Partial<Workflow>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    const response = await api.post('/api/workflows/validate', workflow);
    return response.data;
  },

  // 获取工作流模板
  getTemplates: async (): Promise<Workflow[]> => {
    const response = await api.get('/api/workflows/templates');
    return response.data;
  },

  // 从模板创建工作流
  createFromTemplate: async (templateId: string, name: string): Promise<Workflow> => {
    const response = await api.post('/api/workflows/from-template', {
      template_id: templateId,
      name
    });
    return response.data;
  },

  // 导出工作流
  exportWorkflow: async (id: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> => {
    const response = await api.get(`/api/workflows/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  },

  // 导入工作流
  importWorkflow: async (file: File): Promise<Workflow> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/workflows/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};