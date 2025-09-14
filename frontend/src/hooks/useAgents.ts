import { useState, useEffect } from 'react';
import { Agent, ExecutionRequest, ExecutionResponse } from '../types';
import { agentAPI } from '../services/api';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

interface ExecutionState {
  execution: ExecutionResponse | null;
  loading: boolean;
  error: string | null;
}

export const useAgents = () => {
  const [agentsState, setAgentsState] = useState<AgentsState>({
    agents: [],
    loading: true,
    error: null,
  });

  const [executionState, setExecutionState] = useState<ExecutionState>({
    execution: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const agents = await agentAPI.getAgents();
      setAgentsState({ agents, loading: false, error: null });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load agents';
      setAgentsState({ agents: [], loading: false, error: errorMessage });
    }
  };

  const createAgent = async (description: string) => {
    try {
      const newAgent = await agentAPI.createAgent(description);
      setAgentsState(prev => ({
        ...prev,
        agents: [...prev.agents, newAgent],
      }));
      return { success: true, agent: newAgent };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create agent';
      return { success: false, error: errorMessage };
    }
  };

  const getAgent = async (id: string): Promise<Agent | null> => {
    try {
      const agent = await agentAPI.getAgent(id);
      return agent;
    } catch (error: any) {
      return null;
    }
  };

  const executeAgent = async (request: ExecutionRequest) => {
    try {
      setExecutionState({ execution: null, loading: true, error: null });
      const execution = await agentAPI.executeAgent(request);
      setExecutionState({ execution, loading: false, error: null });
      return { success: true, execution };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Execution failed';
      setExecutionState({ execution: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const getExecution = async (id: string): Promise<ExecutionResponse | null> => {
    try {
      const execution = await agentAPI.getExecution(id);
      setExecutionState({ execution, loading: false, error: null });
      return execution;
    } catch (error: any) {
      return null;
    }
  };

  const getExecutionLogs = async (id: string): Promise<ExecutionResponse | null> => {
    try {
      const execution = await agentAPI.getExecutionLogs(id);
      setExecutionState({ execution, loading: false, error: null });
      return execution;
    } catch (error: any) {
      return null;
    }
  };

  return {
    agents: agentsState.agents,
    agentsLoading: agentsState.loading,
    agentsError: agentsState.error,
    execution: executionState.execution,
    executionLoading: executionState.loading,
    executionError: executionState.error,
    createAgent,
    getAgent,
    executeAgent,
    getExecution,
    getExecutionLogs,
  };
};