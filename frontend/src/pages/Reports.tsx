import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, TrendingUp, Wrench, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

export default function Reports() {
  const [maintenanceCost, setMaintenanceCost] = useState<any[]>([])
  const [technicianPerf, setTechnicianPerf] = useState<any[]>([])
  const [assetUtil, setAssetUtil] = useState<any[]>([])
  const [issueResolution, setIssueResolution] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      const [mc, tp, au, ir] = await Promise.all([
        api.get('/reports/maintenance-cost'),
        api.get('/reports/technician-performance'),
        api.get('/reports/asset-utilization'),
        api.get('/reports/issue-resolution'),
      ])
      setMaintenanceCost(mc.data.data)
      setTechnicianPerf(tp.data.data)
      setAssetUtil(au.data.data)
      setIssueResolution(ir.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch reports', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
        </div>
        <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard icon={TrendingUp} label="Resolution Rate" value={`${Math.round(issueResolution?.resolutionRate || 0)}%`} color="text-emerald-500" bg="bg-emerald-500/10" />
        <ReportCard icon={Wrench} label="Avg Resolution Time" value={`${issueResolution?.avgResolutionTime || 0}h`} color="text-blue-500" bg="bg-blue-500/10" />
        <ReportCard icon={Package} label="Total Assets" value={assetUtil?.length || 0} color="text-violet-500" bg="bg-violet-500/10" />
        <ReportCard icon={AlertTriangle} label="Open Issues" value={issueResolution?.totalIssues - issueResolution?.resolvedIssues || 0} color="text-red-500" bg="bg-red-500/10" />
      </div>

      {/* Maintenance Cost Trend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Maintenance Cost Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceCost.map((item: any) => (
              <div key={item.month} className="flex items-center gap-4">
                <span className="text-sm w-24 shrink-0">{item.month}</span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.totalCost / 1000) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-lg"
                  />
                </div>
                <span className="text-sm font-medium w-20 text-right">${item.totalCost}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technician Performance */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Technician Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicianPerf.map((tech: any) => (
              <div key={tech.id} className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {tech.name?.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <p className="font-medium text-sm">{tech.name}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium">{tech.completedWorkOrders}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Hours</span><span className="font-medium">{tech.totalHours}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-medium">${tech.totalCost}</span></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="border-border/50 hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold font-heading">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
