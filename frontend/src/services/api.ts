import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, ChangePasswordData, User, Agent, ExecutionRequest, ExecutionResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  changePassword: async (passwordData: ChangePasswordData): Promise<void> => {
    await api.post('/auth/change-password', passwordData);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const agentAPI = {
  createAgent: async (description: string): Promise<Agent> => {
    const response = await api.post('/agents/create', { description });
    return response.data;
  },

  getAgents: async (): Promise<Agent[]> => {
    const response = await api.get('/agents');
    return response.data;
  },

  getAgent: async (id: string): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  executeAgent: async (request: ExecutionRequest): Promise<ExecutionResponse> => {
    const response = await api.post('/agents/execute', request);
    return response.data;
  },

  getExecution: async (id: string): Promise<ExecutionResponse> => {
    const response = await api.get(`/executions/${id}`);
    return response.data;
  },

  getExecutionLogs: async (id: string): Promise<ExecutionResponse> => {
    const response = await api.get(`/executions/${id}/logs`);
    return response.data;
  },
};

export default api;