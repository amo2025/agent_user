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
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setAuthState({ user: null, loading: false, error: null });
      return;
    }

    try {
      const user = await authAPI.getCurrentUser();
      setAuthState({ user, loading: false, error: null });
    } catch (error) {
      localStorage.removeItem('access_token');
      setAuthState({ user: null, loading: false, error: 'Authentication failed' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('access_token', response.access_token);
      await checkAuth();
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
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