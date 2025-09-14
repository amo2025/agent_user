import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Play, RotateCcw, Download } from 'lucide-react';

const ExecuteAgent = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getAgent, executeAgent, execution, executionLoading, executionError, getExecution } = useAgents();

  const [agent, setAgent] = useState<any>(null);
  const [input, setInput] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadAgent();
  }, [agentId, user]);

  useEffect(() => {
    if (execution?.logs) {
      setLogs(execution.logs);
    }
  }, [execution]);

  const loadAgent = async () => {
    if (!agentId) return;

    try {
      const agentData = await getAgent(agentId);
      if (agentData) {
        setAgent(agentData);
      } else {
        setError('Agent not found');
      }
    } catch (err) {
      setError('Failed to load agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!agentId || !input.trim()) return;

    let parsedParameters = {};
    try {
      parsedParameters = JSON.parse(parameters);
    } catch (e) {
      setError('Invalid parameters JSON format');
      return;
    }

    setError('');
    setLogs([]);

    const result = await executeAgent({
      agent_id: agentId,
      input: input.trim(),
      parameters: parsedParameters
    });

    if (result.success) {
      // Start polling for execution updates
      pollExecution(result.execution.id);
    }
  };

  const pollExecution = async (executionId: string) => {
    const pollInterval = setInterval(async () => {
      const updatedExecution = await getExecution(executionId);
      if (updatedExecution && (updatedExecution.status === 'completed' || updatedExecution.status === 'failed')) {
        clearInterval(pollInterval);
      }
    }, 1000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleReset = () => {
    setInput('');
    setParameters('{}');
    setLogs([]);
    setError('');
  };

  const handleDownloadLogs = () => {
    const logContent = logs.map(log =>
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution?.id || 'logs'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回仪表板
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{agent?.name || 'Agent执行'}</h1>
            <p className="text-lg text-gray-600">{agent?.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>输入参数</CardTitle>
                <CardDescription>
                  输入Agent执行的参数和数据
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {executionError && (
                  <Alert variant="destructive">
                    <AlertDescription>{executionError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="input" className="block text-sm font-medium text-gray-700">
                    输入内容
                  </label>
                  <textarea
                    id="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="请输入要处理的内容..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    disabled={executionLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="parameters" className="block text-sm font-medium text-gray-700">
                    参数 (JSON格式)
                  </label>
                  <textarea
                    id="parameters"
                    value={parameters}
                    onChange={(e) => setParameters(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary font-mono text-sm"
                    disabled={executionLoading}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleExecute}
                    disabled={executionLoading || !input.trim()}
                    className="flex-1"
                  >
                    {executionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        执行中...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        执行
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={executionLoading}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    重置
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Execution Result */}
            {execution && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>执行结果</CardTitle>
                  <CardDescription>
                    状态: <span className={`font-medium ${
                      execution.status === 'completed' ? 'text-green-600' :
                      execution.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>{execution.status}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {execution.result && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">结果</label>
                      <div className="p-4 bg-gray-50 rounded-md max-h-60 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{execution.result}</pre>
                      </div>
                    </div>
                  )}

                  {execution.error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription>{execution.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-4 text-sm text-gray-600">
                    <p>开始时间: {new Date(execution.start_time).toLocaleString()}</p>
                    {execution.end_time && (
                      <p>结束时间: {new Date(execution.end_time).toLocaleString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Logs Panel */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>执行日志</CardTitle>
                    <CardDescription>实时显示执行过程和调试信息</CardDescription>
                  </div>
                  {logs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadLogs}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载日志
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="h-96 bg-gray-900 rounded-md p-4 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      等待执行开始...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          className={`flex items-start space-x-2 ${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warning' ? 'text-yellow-400' :
                            log.level === 'debug' ? 'text-blue-400' :
                            'text-green-400'
                          }`
                        }
                        >
                          <span className="text-gray-500 flex-shrink-0">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          <span className="font-medium flex-shrink-0">
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-gray-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecuteAgent;