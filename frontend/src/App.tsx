import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateAgent from './pages/CreateAgent'
import ExecuteAgent from './pages/ExecuteAgent'
import WorkflowEditor from './pages/WorkflowEditor'
import ManageAgents from './pages/ManageAgents'
import ModelManagement from './pages/ModelManagement'

function App() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('App error:', error);
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/create-agent" element={user ? <CreateAgent /> : <Navigate to="/login" />} />
      <Route path="/execute/:agentId" element={user ? <ExecuteAgent /> : <Navigate to="/login" />} />
      <Route path="/workflow-editor" element={user ? <WorkflowEditor /> : <Navigate to="/login" />} />
      <Route path="/agents" element={user ? <ManageAgents /> : <Navigate to="/login" />} />
      <Route path="/manage-agents" element={user ? <ManageAgents /> : <Navigate to="/login" />} />
      <Route path="/models" element={user ? <ModelManagement /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  )
}

export default App