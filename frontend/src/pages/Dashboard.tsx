import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Play, Settings, Workflow } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { agents, agentsLoading, agentsError } = useAgents();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Agent User Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">欢迎, {user.email}</span>
              <Button variant="outline" onClick={logout}>
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">快速操作</h2>
            <div className="flex space-x-4">
              <Button onClick={() => navigate('/create-agent')}>
                <Plus className="mr-2 h-4 w-4" />
                创建Agent
              </Button>
              <Button variant="outline" onClick={() => navigate('/workflow-editor')}>
                <Workflow className="mr-2 h-4 w-4" />
                工作流编辑器
              </Button>
              <Button variant="outline" onClick={() => navigate('/agents')}>
                <Settings className="mr-2 h-4 w-4" />
                管理Agent
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">我的Agent</h2>

            {agentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载中...</p>
              </div>
            ) : agents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600 mb-4">您还没有创建任何Agent</p>
                  <Button onClick={() => navigate('/create-agent')}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建第一个Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          类型: {agent.config.type}
                        </span>
                        <span className="text-sm text-gray-600">
                          模型: {agent.config.model}
                        </span>
                      </div>
                    </CardContent>
                    <div className="px-6 pb-6">
                      <Button
                        className="w-full"
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