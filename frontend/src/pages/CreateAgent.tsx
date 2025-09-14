import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Sparkles } from 'lucide-react';

const CreateAgent = () => {
  const navigate = useNavigate();
  const { createAgent } = useAgents();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const exampleDescriptions = [
    "创建一个能够帮助我总结文档内容的智能助手",
    "构建一个可以回答技术问题的编程专家Agent",
    "设计一个能够生成创意写作内容的AI助手",
    "开发一个可以帮助分析数据的统计专家Agent",
    "创建一个能够翻译多语言内容的翻译助手"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('请输入Agent描述');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await createAgent(description);
    if (result.success) {
      navigate(`/execute/${result.agent.id}`);
    } else {
      setError(result.error || '创建Agent失败');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              创建Agent
            </h1>
            <p className="text-lg text-gray-600">
              用自然语言描述您想要的Agent功能
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  自然语言描述
                </CardTitle>
                <CardDescription>
                  详细描述您希望Agent具备的功能和特性
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Agent描述
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="例如：创建一个能够帮助我总结长文档内容的智能助手，它可以提取关键信息，生成简洁的摘要，并支持多种文档格式..."
                      className="min-h-[150px] w-full"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      请尽可能详细地描述Agent的功能、目标和使用场景
                    </p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        创建中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        创建Agent
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Examples */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>示例描述</CardTitle>
                <CardDescription>
                  参考这些示例来获得灵感
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {exampleDescriptions.map((example, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setDescription(example)}
                    >
                      <p className="text-sm text-gray-700">{example}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 提示</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 描述越详细，创建的Agent越符合您的需求</li>
                    <li>• 说明Agent的主要功能和目标</li>
                    <li>• 指定Agent的专业领域或技能</li>
                    <li>• 描述期望的输入输出格式</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;