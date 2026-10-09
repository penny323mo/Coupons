import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout    from './components/Layout'
import { Spinner } from './components/ui'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Coupons   from './pages/Coupons'
import Calc      from './pages/Calc'
import Settings  from './pages/Settings'
import Archive   from './pages/Archive'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="boot"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index           element={<Dashboard />} />
        <Route path="coupons"  element={<Coupons />} />
        <Route path="calc"     element={<Calc />} />
        <Route path="settings" element={<Settings />} />
        <Route path="archive/:id" element={<Archive />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
