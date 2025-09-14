import { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkAuth();
  }, []); // 只在组件挂载时执行一次

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Checking auth, token:', token ? 'exists' : 'not found');
      
      if (!token) {
        setAuthState({ user: null, loading: false, error: null });
        return;
      }

      const user = await authAPI.getCurrentUser();
      console.log('Auth check successful, user:', user);
      setAuthState({ user, loading: false, error: null });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      setAuthState({ user: null, loading: false, error: null });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      setAuthState({ user: null, loading: true, error: null });
      
      const response = await authAPI.login({ email, password });
      console.log('Login response:', response);
      
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        console.log('Token saved to localStorage');
        
        // 获取用户信息
        try {
          const user = await authAPI.getCurrentUser();
          console.log('User data:', user);
          setAuthState({ user, loading: false, error: null });
          return { success: true };
        } catch (userError) {
          console.error('Failed to get user info:', userError);
          // 即使获取用户信息失败，登录也算成功
          const fallbackUser = { id: 'temp', email, created_at: new Date().toISOString(), last_login: null };
          setAuthState({ user: fallbackUser, loading: false, error: null });
          return { success: true };
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setAuthState({ user: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await authAPI.register({ email, password });
      localStorage.setItem('access_token', response.access_token);
      await checkAuth();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      setAuthState({ user: null, loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setAuthState({ user: null, loading: false, error: null });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    logout,
    changePassword,
  };
};