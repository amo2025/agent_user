import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { AuthProvider } from '../hooks/useAuth'
import { BrowserRouter } from 'react-router-dom'

// Mock API
vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn().mockResolvedValue({
      access_token: 'test-token',
      user: { id: '1', email: 'test@example.com', username: 'testuser' }
    }),
    register: vi.fn().mockResolvedValue({
      access_token: 'test-token',
      user: { id: '1', email: 'test@example.com', username: 'testuser' }
    })
  }
}))

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Login Component', () => {
    it('renders login form with all fields', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )

      expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
      expect(screen.getByText(/还没有账户？/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )

      const loginButton = screen.getByRole('button', { name: /登录/i })
      await user.click(loginButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument()
        expect(screen.getByText(/请输入密码/i)).toBeInTheDocument()
      })
    })

    it('handles successful login', async () => {
      const user = userEvent.setup()
      const { authAPI } = await import('../services/api')

      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )

      // Fill form
      await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com')
      await user.type(screen.getByLabelText(/密码/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /登录/i }))

      // Check API was called
      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // Check token was stored
      expect(localStorage.getItem('access_token')).toBe('test-token')
    })

    it('handles login errors', async () => {
      const user = userEvent.setup()
      const { authAPI } = await import('../services/api')

      // Mock login failure
      authAPI.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/邮箱/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/密码/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /登录/i }))

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/登录失败/i)).toBeInTheDocument()
      })
    })
  })

  describe('Register Component', () => {
    it('renders registration form with all fields', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument()
    })

    it('validates password confirmation match', async () => {
      const user = userEvent.setup()
      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText(/用户名/i), 'testuser')
      await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com')
      await user.type(screen.getByLabelText(/密码/i), 'password123')
      await user.type(screen.getByLabelText(/确认密码/i), 'differentpassword')

      await user.click(screen.getByRole('button', { name: /注册/i }))

      // Should show password mismatch error
      await waitFor(() => {
        expect(screen.getByText(/密码不匹配/i)).toBeInTheDocument()
      })
    })

    it('handles successful registration', async () => {
      const user = userEvent.setup()
      const { authAPI } = await import('../services/api')

      render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      )

      // Fill form
      await user.type(screen.getByLabelText(/用户名/i), 'testuser')
      await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com')
      await user.type(screen.getByLabelText(/密码/i), 'password123')
      await user.type(screen.getByLabelText(/确认密码/i), 'password123')

      // Submit form
      await user.click(screen.getByRole('button', { name: /注册/i }))

      // Check API was called
      await waitFor(() => {
        expect(authAPI.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // Check token was stored
      expect(localStorage.getItem('access_token')).toBe('test-token')
    })
  })
})