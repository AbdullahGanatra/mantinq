import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  ClipboardList,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, getStatusColor } from '@/lib/utils'
import api from '@/services/api'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const statCards = [
  { key: 'totalAssets', label: 'Total Assets', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'totalWorkOrders', label: 'Work Orders', icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { key: 'totalIssues', label: 'Issues', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'totalUsers', label: 'Team Members', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/stats')
      setStats(res.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold font-heading">
          Welcome back, <span className="text-gradient">{user?.firstName}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your assets today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <motion.div key={card.key} variants={itemVariants}>
            <Card className="hover-lift cursor-pointer border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold font-heading">
                      {stats?.stats?.[card.key]?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.stats?.pendingWorkOrders || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Work Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.stats?.openIssues || 0}</p>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.stats?.completedWorkOrders || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Issues & Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Recent Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentIssues?.length > 0 ? (
                stats.recentIssues.map((issue: any) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">{issue.asset?.name}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(issue.status)}>
                      {issue.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent issues</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Upcoming Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.upcomingMaintenance?.length > 0 ? (
                stats.upcomingMaintenance.map((maint: any) => (
                  <div key={maint.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{maint.title}</p>
                      <p className="text-xs text-muted-foreground">{maint.asset?.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(maint.nextDueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming maintenance</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
