import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return '密码长度至少为8个字符';
    }
    if (!/[A-Z]/.test(password)) {
      return '密码必须包含至少一个大写字母';
    }
    if (!/[a-z]/.test(password)) {
      return '密码必须包含至少一个小写字母';
    }
    if (!/[0-9]/.test(password)) {
      return '密码必须包含至少一个数字';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);

    const result = await register(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            创建账户
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            注册Agent User Platform账户
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>注册</CardTitle>
            <CardDescription>
              填写以下信息创建您的账户
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {(error || validationError) && (
                <Alert variant="destructive">
                  <AlertDescription>{error || validationError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="请输入邮箱地址"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="请输入密码（至少8位，包含大小写字母和数字）"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="请再次输入密码"
                  className="w-full"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '创建账户'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                已有账户？{' '}
                <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                  立即登录
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;