import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DiscoverPage from './pages/DiscoverPage'
import ProfilePage from './pages/ProfilePage'
import ConnectionsPage from './pages/ConnectionsPage'
import ChatPage from './pages/ChatPage'
import SessionsPage from './pages/SessionsPage'
import GroupSessionsPage from './pages/GroupSessionsPage'
import ProgressPage from './pages/ProgressPage'

function Protected({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}
function Guest({ children }) {
  const { token } = useAuth()
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login"    element={<Guest><LoginPage /></Guest>} />
          <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
        </Route>
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/discover"       element={<DiscoverPage />} />
          <Route path="/profile"        element={<ProfilePage />} />
          <Route path="/connections"    element={<ConnectionsPage />} />
          <Route path="/sessions"       element={<SessionsPage />} />
          <Route path="/group-sessions" element={<GroupSessionsPage />} />
          <Route path="/progress"       element={<ProgressPage />} />
          <Route path="/chat"           element={<ChatPage />} />
          <Route path="/chat/:id"       element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
