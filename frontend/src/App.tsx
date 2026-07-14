import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import AssetDetail from './pages/AssetDetail'
import WorkOrders from './pages/WorkOrders'
import WorkOrderDetail from './pages/WorkOrderDetail'
import Issues from './pages/Issues'
import IssueDetail from './pages/IssueDetail'
import Users from './pages/Users'
import Departments from './pages/Departments'
import Buildings from './pages/Buildings'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import QRScanner from './pages/QRScanner'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">Loading MaintainIQ...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/qr-scanner" element={<QRScanner />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
