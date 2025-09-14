import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Plus } from 'lucide-react';
import { agentAPI } from '../services/api';

const CreateAgent = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
    if (user) {
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
          console.log('🔍 Frontend: Active models:', activeModels);
          
          if (activeModels.length > 0) {
            // 转换为前端需要的格式
            const formattedModels = activeModels.map(model => ({
              name: model.name,
              id: model.id,
              type: model.type,
              provider: model.provider,
              enabled: true
            }));
            
            console.log('🔍 Frontend: Formatted models:', formattedModels);
            setAvailableModels(formattedModels);
            setSelectedModel(formattedModels[0].name);
            return;
          }
        }
      }
      
      // 如果API调用失败或没有活跃模型，显示错误信息
      console.error('❌ Frontend: No active models available from API');
      setError('没有可用的模型。请先在模型管理中启用至少一个模型。');
      setAvailableModels([]);
      
    } catch (error) {
      console.error('❌ Frontend: Failed to load models:', error);
      setError('无法加载模型列表。请检查网络连接或联系管理员。');
      setAvailableModels([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim()) {
      setError('请输入Agent名称');
      setIsLoading(false);
      return;
    }

    if (!description.trim()) {
      setError('请输入Agent描述');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Creating agent with:', { name, description, model: selectedModel });
      const agent = await agentAPI.createAgent(`名称: ${name}\n描述: ${description}\n模型: ${selectedModel}`);
      console.log('Agent created successfully:', agent);
      
      // 显示成功消息
      alert(`🎉 Agent "${name}" 创建成功！\n\n您可以在以下位置找到和使用您的Agent：\n• Dashboard - 我的Agent 部分\n• 管理Agent - 查看所有Agent\n• 执行Agent - 测试Agent功能`);
      
      // 跳转到管理页面查看创建的Agent
      navigate('/manage-agents');
    } catch (error) {
      console.error('Failed to create agent:', error);
      setError(`创建Agent失败: ${error.response?.data?.detail || error.message || '请重试'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4 sm:py-6">
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
              创建Agent
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              创建新的Agent
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              填写Agent的基本信息，系统将根据您的描述自动生成智能助手
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-4 sm:px-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Agent名称
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="为您的Agent起一个名字"
                  className="w-full h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Agent描述
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="详细描述您希望Agent具备的功能和特点，例如：一个专业的代码审查助手，能够分析代码质量、发现潜在问题并提供改进建议..."
                  className="w-full min-h-32 sm:min-h-24 text-base sm:text-sm resize-none"
                  rows={6}
                />
                <p className="text-xs sm:text-sm text-gray-500">
                  描述越详细，生成的Agent越符合您的需求
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  选择模型
                </label>
                <select
                  id="model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  required
                  className="w-full h-11 sm:h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                >
                  {availableModels.length === 0 ? (
                    <option value="">加载模型中...</option>
                  ) : (
                    availableModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} {model.type === 'local' ? '(本地)' : '(在线)'}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs sm:text-sm text-gray-500">
                  选择Agent使用的AI模型，只显示已启用的模型
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !description.trim()}
                  className="w-full sm:flex-1 order-1 sm:order-2"
                >
                  {isLoading ? '创建中...' : '创建Agent'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">💡 创建提示</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 明确描述Agent的主要功能和用途</li>
              <li>• 说明Agent需要处理的具体任务类型</li>
              <li>• 提及期望的交互方式和回复风格</li>
              <li>• 如有特殊要求，请在描述中详细说明</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateAgent;