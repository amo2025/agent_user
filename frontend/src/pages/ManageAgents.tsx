import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Plus, Settings, Play, Trash2, Edit, Save, X } from 'lucide-react';
import { agentAPI } from '../services/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  config: any;
  created_at: string;
}

const ManageAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', model: '' });
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }
    if (user) {
      loadAgents();
      loadAvailableModels();
    }
  }, [user, loading, navigate]);

  const loadAvailableModels = async () => {
    try {
      console.log('🔍 Frontend: Loading available models from API...');
      
      const response = await fetch('/api/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const models = await response.json();
        console.log('🔍 Frontend: API models response:', models);
        
        if (Array.isArray(models) && models.length > 0) {
          // 只显示状态为 'active' 的模型
          const activeModels = models.filter(model => model.status === 'active');
          console.log('🔍 Frontend: Active models for editing:', activeModels);
          
          if (activeModels.length > 0) {
            // 转换为前端需要的格式
            const formattedModels = activeModels.map(model => ({
              name: model.name,
              id: model.id,
              type: model.type,
              provider: model.provider,
              enabled: true
            }));
            
            setAvailableModels(formattedModels);
            return;
          }
        }
      }
      
      // 如果API调用失败或没有活跃模型，设置空数组
      console.error('❌ Frontend: No active models available from API');
      setAvailableModels([]);
      
    } catch (error) {
      console.error('❌ Frontend: Failed to load models for editing:', error);
      setAvailableModels([]);
    }
  };

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Frontend: Loading agents...');
      const response = await agentAPI.getAgents();
      console.log('🔍 Frontend: API response:', response);
      console.log('🔍 Frontend: Response type:', typeof response);
      console.log('🔍 Frontend: Response length:', Array.isArray(response) ? response.length : 'Not an array');
      
      // 确保response是数组
      const agentsArray = Array.isArray(response) ? response : [];
      console.log('🔍 Frontend: Setting agents array:', agentsArray);
      setAgents(agentsArray);
      
      // 强制重新渲染
      setTimeout(() => {
        console.log('🔍 Frontend: Current agents state:', agentsArray.length);
      }, 100);
    } catch (err) {
      console.error('❌ Frontend: Failed to load agents:', err);
      setError('加载Agent列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    // 第一次确认
    if (!confirm(`确定要删除Agent "${agentName}" 吗？`)) {
      return;
    }

    // 第二次确认
    if (!confirm(`⚠️ 警告：删除操作不可撤销！\n\n确定要永久删除Agent "${agentName}" 吗？`)) {
      return;
    }

    try {
      console.log('🔍 Frontend: Deleting agent:', agentId);
      setError(null);
      await agentAPI.deleteAgent(agentId);
      console.log('✅ Frontend: Agent deleted successfully');
      
      // 从本地状态中移除已删除的agent
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
      
      // 显示成功消息
      alert(`Agent "${agentName}" 删除成功！`);
    } catch (err) {
      console.error('❌ Frontend: Failed to delete agent:', err);
      setError(`删除Agent失败: ${err.response?.data?.detail || err.message || '请重试'}`);
    }
  };

  const handleExecuteAgent = (agentId: string) => {
    navigate(`/execute/${agentId}`);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditForm({
      name: agent.name,
      description: agent.description,
      model: agent.config?.model || 'llama2'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAgent || !editForm.name.trim() || !editForm.description.trim()) {
      setError('请填写完整的Agent信息');
      return;
    }

    setError(null);

    try {
      console.log('🔍 Frontend: Updating agent:', editingAgent.id);
      const updatedAgent = await agentAPI.updateAgent(editingAgent.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        config: {
          ...editingAgent.config,
          model: editForm.model
        }
      });
      
      console.log('✅ Frontend: Agent updated successfully');
      
      // 更新本地状态
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === editingAgent.id 
            ? { 
                ...agent, 
                name: editForm.name.trim(), 
                description: editForm.description.trim(),
                config: { ...agent.config, model: editForm.model }
              }
            : agent
        )
      );
      
      // 关闭编辑模式
      setEditingAgent(null);
      setEditForm({ name: '', description: '', model: '' });
      
      // 显示成功消息
      alert('Agent更新成功！');
    } catch (err) {
      console.error('❌ Frontend: Failed to update agent:', err);
      setError(`更新Agent失败: ${err.response?.data?.detail || err.message || '请重试'}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
    setEditForm({ name: '', description: '', model: '' });
    setError(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">返回</span>
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                管理 Agent
              </h1>
            </div>
            <Button
              onClick={() => navigate('/create-agent')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">创建 Agent</span>
              <span className="sm:hidden">创建</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          </div>
        ) : (!agents || agents.length === 0) ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <Settings className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有创建任何 Agent
            </h3>
            <p className="text-gray-500 mb-6">
              开始创建您的第一个 AI Agent 来自动化任务
            </p>
            <Button
              onClick={() => navigate('/create-agent')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建第一个 Agent
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {agent.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        创建于 {new Date(agent.created_at).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {agent.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleExecuteAgent(agent.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      执行
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id, agent.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Agent Modal */}
        {editingAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">编辑 Agent</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Agent名称
                    </label>
                    <Input
                      id="edit-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="输入Agent名称"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Agent描述
                    </label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="输入Agent描述"
                      className="w-full min-h-24 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-model" className="block text-sm font-medium text-gray-700 mb-1">
                      选择模型
                    </label>
                    <select
                      id="edit-model"
                      value={editForm.model || (availableModels.length > 0 ? availableModels[0].name : '')}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableModels.length === 0 ? (
                        <option value="">没有可用的模型</option>
                      ) : (
                        availableModels.map((model) => (
                          <option key={model.id} value={model.name}>
                            {model.name} ({model.type === 'local' ? '本地' : '在线'})
                            {model.provider && ` - ${model.provider}`}
                          </option>
                        ))
                      )}
                    </select>
                    {availableModels.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        没有可用的模型。请先在模型管理中启用至少一个模型。
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editForm.name.trim() || !editForm.description.trim()}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageAgents;