import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Play, Settings, Workflow, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setAgentsLoading(true);
        const agentsList = await agentAPI.getAgents();
        setAgents(agentsList);
        setAgentsError(null);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        setAgentsError('Failed to load agents');
        setAgents([]);
      } finally {
        setAgentsLoading(false);
      }
    };

    if (user) {
      fetchAgents();
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                Agent User Platform
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline truncate max-w-32 sm:max-w-none">
                欢迎, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">快速操作</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Button onClick={() => navigate('/create-agent')} className="w-full justify-center sm:justify-start">
                <Plus className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">创建Agent</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/workflow-editor')} className="w-full justify-center sm:justify-start">
                <Workflow className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">工作流编辑器</span>
              </Button>
              <Button variant="outline" onClick={() => {
                console.log('Navigating to /manage-agents');
                navigate('/manage-agents');
              }} className="w-full justify-center sm:justify-start">
                <Settings className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">管理Agent</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/models')} className="w-full justify-center sm:justify-start">
                <Database className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">模型管理</span>
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {agentsError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{agentsError}</AlertDescription>
            </Alert>
          )}

          {/* Agents Overview */}
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">我的Agent</h2>

            {agentsLoading ? (
              <div className="text-center py-12 sm:py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 text-sm sm:text-base">加载中...</p>
              </div>
            ) : agents.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                  <div className="max-w-sm mx-auto">
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">您还没有创建任何Agent</p>
                    <Button onClick={() => navigate('/create-agent')} className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      创建第一个Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {agents.map((agent) => (
                  <Card key={agent.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg truncate">{agent.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{agent.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                        <span className="text-xs sm:text-sm text-gray-600">
                          类型: {agent.config?.type || 'AI助手'}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          模型: {agent.config?.model || 'llama2'}
                        </span>
                      </div>
                    </CardContent>
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <Button
                        className="w-full text-sm sm:text-base"
                        onClick={() => navigate(`/execute/${agent.id}`)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        执行
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;