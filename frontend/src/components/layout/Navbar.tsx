import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn, formatDateTime } from '@/lib/utils'

// Mock notifications
const mockNotifications = [
  { id: '1', title: 'New Work Order', message: 'WO-2024-00002 assigned to you', type: 'WORK_ORDER_CREATED', isRead: false, createdAt: new Date().toISOString() },
  { id: '2', title: 'Issue Reported', message: 'Critical: Server room temperature high', type: 'ISSUE_CREATED', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', title: 'Maintenance Due', message: 'HVAC filter replacement due in 2 days', type: 'MAINTENANCE_DUE', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const unreadCount = mockNotifications.filter(n => !n.isRead).length

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex items-center flex-1 max-w-xl">
          <AnimatePresence>
            {showSearch ? (
              <motion.div
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search assets, work orders, issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setShowSearch(false)}
                  className="w-full h-10 pl-10 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Search anything...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-mono">
                  ⌘K
                </kbd>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="rounded-xl relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-96 rounded-2xl border bg-popover shadow-xl shadow-black/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Mark all read
                    </Button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0',
                          !notif.isRead && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2 shrink-0',
                          !notif.isRead ? 'bg-primary' : 'bg-transparent'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateTime(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="rounded-xl text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
