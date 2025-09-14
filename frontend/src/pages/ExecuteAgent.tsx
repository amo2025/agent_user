import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Play, Square, Loader2 } from 'lucide-react';
import { agentAPI } from '../services/api';

const ExecuteAgent = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) return;
      
      try {
        setIsLoading(true);
        const agentData = await agentAPI.getAgent(agentId);
        setAgent(agentData);
      } catch (error) {
        console.error('Failed to fetch agent:', error);
        setError('加载Agent失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && agentId) {
      fetchAgent();
    }
  }, [user, agentId]);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

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

  const handleExecute = async () => {
    if (!agentId || !input.trim()) return;

    setIsExecuting(true);
    setError('');
    setOutput('');

    try {
      console.log('🔍 Frontend: Executing agent with input:', input.trim());
      const result = await agentAPI.executeAgent({
        agent_id: agentId,
        input: input.trim()
      });
      
      console.log('🔍 Frontend: Execution result:', result);
      console.log('🔍 Frontend: Result keys:', Object.keys(result));
      
      // 显示AI的实际响应结果
      if (result.result) {
        console.log('🔍 Frontend: Using result field:', result.result);
        setOutput(result.result);
      } else if (result.logs && result.logs.length > 0) {
        console.log('🔍 Frontend: Using logs field:', result.logs);
        setOutput(result.logs.join('\n'));
      } else {
        console.log('🔍 Frontend: No valid response found');
        setOutput('执行完成，但没有返回结果');
      }
    } catch (error) {
      console.error('❌ Frontend: Failed to execute agent:', error);
      setError(`执行失败: ${error.response?.data?.detail || error.message || '请重试'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = () => {
    setIsExecuting(false);
    setOutput(prev => prev + '\n\n[执行已停止]');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {agent?.name || 'Agent执行'}
              </h1>
              {agent?.description && (
                <p className="text-sm text-gray-600 truncate mt-1">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">输入</CardTitle>
              <CardDescription className="text-sm">
                输入您希望Agent处理的内容或问题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入您的问题或需要处理的内容..."
                className="w-full min-h-40 sm:min-h-32 text-base sm:text-sm resize-none"
                rows={8}
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting || !input.trim()}
                  className="w-full sm:flex-1"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      执行
                    </>
                  )}
                </Button>
                
                {isExecuting && (
                  <Button
                    variant="outline"
                    onClick={handleStop}
                    className="w-full sm:w-auto"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    停止
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">输出</CardTitle>
              <CardDescription className="text-sm">
                Agent的执行结果将显示在这里
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-40 sm:min-h-32">
                {output ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {output}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    {isExecuting ? '正在执行...' : '执行结果将显示在这里'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Info Card - Mobile Only */}
        {agent && (
          <Card className="mt-6 shadow-sm lg:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Agent信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">类型:</span>
                  <span className="ml-2 text-gray-600">{agent.config?.type || 'AI助手'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">模型:</span>
                  <span className="ml-2 text-gray-600">{agent.config?.model || 'llama2'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ExecuteAgent;