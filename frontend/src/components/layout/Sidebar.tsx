import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  AlertTriangle,
  Users,
  Building2,
  BarChart3,
  QrCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Assets', path: '/assets' },
  { icon: ClipboardList, label: 'Work Orders', path: '/work-orders' },
  { icon: AlertTriangle, label: 'Issues', path: '/issues' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: Building2, label: 'Buildings', path: '/buildings' },
  { icon: Wrench, label: 'Departments', path: '/departments' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: QrCode, label: 'QR Scanner', path: '/qr-scanner' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'relative flex flex-col bg-sidebar border-r border-border/50',
        collapsed ? 'items-center' : ''
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shadow-lg shadow-primary/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-lg font-bold text-white font-heading tracking-tight">
                MaintainIQ
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Enterprise CMMS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-white/40 truncate">{user?.role?.replace('_', ' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
