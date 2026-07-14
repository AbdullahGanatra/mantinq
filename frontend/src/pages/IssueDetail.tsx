import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertTriangle, Package, User, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime, getStatusColor, getPriorityIcon } from '@/lib/utils'
import api from '@/services/api'

export default function IssueDetail() {
  const { id } = useParams()
  const [issue, setIssue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => { fetchIssue() }, [id])

  const fetchIssue = async () => {
    try {
      const res = await api.get(`/issues/${id}`)
      setIssue(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch issue', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-96 bg-muted rounded-xl animate-pulse" />
  if (!issue) return null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/issues">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-heading">{issue.issueNumber}</h1>
              <Badge variant="outline" className={getStatusColor(issue.status)}>{issue.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{issue.title}</p>
          </div>
        </div>
        <Button>Create Work Order</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={Package} label="Asset" value={issue.asset?.name} />
              <InfoItem icon={AlertTriangle} label="Priority" value={`${getPriorityIcon(issue.priority)} ${issue.priority}`} />
              <InfoItem icon={User} label="Reported By" value={`${issue.reportedBy?.firstName} ${issue.reportedBy?.lastName}`} />
              <InfoItem icon={User} label="Assigned To" value={issue.assignedTo ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}` : 'Unassigned'} />
              <InfoItem icon={Clock} label="Reported" value={formatDateTime(issue.reportedAt)} />
              {issue.resolvedAt && <InfoItem icon={Clock} label="Resolved" value={formatDateTime(issue.resolvedAt)} />}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{issue.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-sm">Asset Location</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{issue.asset?.room?.name || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">{issue.asset?.room?.floor?.name || ''}</p>
              <p className="text-xs text-muted-foreground">{issue.asset?.room?.floor?.building?.name || ''}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium text-sm mt-0.5">{value}</p>
      </div>
    </div>
  )
}
