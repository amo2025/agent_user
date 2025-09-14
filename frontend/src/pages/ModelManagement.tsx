import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Plus, Settings, Trash2, Edit, Globe, HardDrive } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  type: 'local' | 'online';
  provider?: string;
  endpoint?: string;
  api_key?: string;
  model_name: string;
  description: string;
  status: 'active' | 'inactive';
  size?: number;
  parameter_size?: string;
  quantization?: string;
  modified_at?: string;
  created_at: string;
}

const ModelManagement = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'local' as 'local' | 'online',
    provider: '',
    endpoint: '',
    api_key: '',
    model_name: '',
    description: ''
  });
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
      return;
    }
    if (user) {
      loadModels();
    }
  }, [user, loading, navigate]);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 从后端API获取真实的Ollama模型数据
      const response = await fetch('/api/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const modelsData = await response.json();
      setModels(modelsData);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('加载模型列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newModel.name.trim() || !newModel.model_name.trim()) {
      setError('请填写模型名称和模型标识');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newModel)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add model');
      }
      
      // 重新加载模型列表
      await loadModels();
      
      // 重置表单
      setNewModel({
        name: '',
        type: 'local',
        provider: '',
        endpoint: '',
        api_key: '',
        model_name: '',
        description: ''
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to add model:', err);
      setError('添加模型失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/models/${modelId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle model');
      }
      
      // 重新加载模型列表
      await loadModels();
    } catch (err) {
      console.error('Failed to toggle model:', err);
      setError('切换模型状态失败');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('确定要删除这个模型配置吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete model');
      }
      
      // 重新加载模型列表
      await loadModels();
      setError(null);
    } catch (err: any) {
      console.error('Failed to delete model:', err);
      setError(err.message || '删除模型失败');
    }
  };

  const handleDeleteModelOld = (modelId: string) => {
    if (!confirm('确定要删除这个模型配置吗？')) {
      return;
    }
    setModels(models.filter(m => m.id !== modelId));
  };

  const toggleModelStatus = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId 
        ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' }
        : m
    ));
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
                模型管理
              </h1>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">添加模型</span>
              <span className="sm:hidden">添加</span>
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

        {/* Add Model Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>添加新模型</CardTitle>
              <CardDescription>配置本地或在线AI模型</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddModel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模型名称
                    </label>
                    <Input
                      value={newModel.name}
                      onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                      placeholder="例如: GPT-4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模型类型
                    </label>
                    <select
                      value={newModel.type}
                      onChange={(e) => setNewModel({...newModel, type: e.target.value as 'local' | 'online'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="local">本地模型</option>
                      <option value="online">在线模型</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模型标识
                    </label>
                    <Input
                      value={newModel.model_name}
                      onChange={(e) => setNewModel({...newModel, model_name: e.target.value})}
                      placeholder="例如: llama2, gpt-4"
                      required
                    />
                  </div>
                  {newModel.type === 'online' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        提供商
                      </label>
                      <Input
                        value={newModel.provider}
                        onChange={(e) => setNewModel({...newModel, provider: e.target.value})}
                        placeholder="例如: OpenAI, Anthropic"
                      />
                    </div>
                  )}
                </div>

                {newModel.type === 'online' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API端点
                      </label>
                      <Input
                        value={newModel.endpoint}
                        onChange={(e) => setNewModel({...newModel, endpoint: e.target.value})}
                        placeholder="https://api.openai.com/v1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API密钥
                      </label>
                      <Input
                        type="password"
                        value={newModel.api_key}
                        onChange={(e) => setNewModel({...newModel, api_key: e.target.value})}
                        placeholder="输入API密钥"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <Input
                    value={newModel.description}
                    onChange={(e) => setNewModel({...newModel, description: e.target.value})}
                    placeholder="模型描述"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    添加模型
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Models List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <Settings className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有配置任何模型
            </h3>
            <p className="text-gray-500 mb-6">
              添加本地或在线AI模型来创建智能Agent
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加第一个模型
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate flex items-center">
                        {model.type === 'local' ? (
                          <HardDrive className="h-4 w-4 mr-2 text-blue-600" />
                        ) : (
                          <Globe className="h-4 w-4 mr-2 text-green-600" />
                        )}
                        {model.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        {model.type === 'local' ? '本地模型' : `在线模型 - ${model.provider}`}
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      model.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {model.status === 'active' ? '活跃' : '停用'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">模型:</span> {model.model_name}
                    </p>
                    {model.parameter_size && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">参数:</span> {model.parameter_size}
                      </p>
                    )}
                    {model.quantization && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">量化:</span> {model.quantization}
                      </p>
                    )}
                    {model.size && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">大小:</span> {(model.size / (1024 * 1024 * 1024)).toFixed(1)} GB
                      </p>
                    )}
                    {model.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleToggleModel(model.id)}
                      variant={model.status === 'active' ? 'outline' : 'default'}
                      size="sm"
                      className="flex-1"
                    >
                      {model.status === 'active' ? '停用' : '启用'}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: 实现编辑功能
                          console.log('Edit model:', model.id);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Button>
                      {model.type === 'online' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteModel(model.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">删除</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ModelManagement;