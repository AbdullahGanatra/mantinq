import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ClipboardList, Clock, User, Package, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatDateTime, getStatusColor, getPriorityIcon } from '@/lib/utils'
import api from '@/services/api'

export default function WorkOrderDetail() {
  const { id } = useParams()
  const [wo, setWo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => { fetchWorkOrder() }, [id])

  const fetchWorkOrder = async () => {
    try {
      const res = await api.get(`/work-orders/${id}`)
      setWo(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch work order', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-96 bg-muted rounded-xl animate-pulse" />
  if (!wo) return null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/work-orders">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-heading">{wo.woNumber}</h1>
              <Badge variant="outline" className={getStatusColor(wo.status)}>{wo.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{wo.title}</p>
          </div>
        </div>
        <Button>Edit Work Order</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={Package} label="Asset" value={wo.asset?.name} />
              <InfoItem icon={ClipboardList} label="Type" value={wo.type} />
              <InfoItem icon={Clock} label="Priority" value={`${getPriorityIcon(wo.priority)} ${wo.priority}`} />
              <InfoItem icon={User} label="Assigned To" value={`${wo.assignedTo?.firstName || 'Unassigned'} ${wo.assignedTo?.lastName || ''}`} />
              <InfoItem icon={Clock} label="Scheduled" value={wo.scheduledDate ? formatDateTime(wo.scheduledDate) : 'N/A'} />
              <InfoItem icon={Clock} label="Due Date" value={wo.dueDate ? formatDateTime(wo.dueDate) : 'N/A'} />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{wo.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {wo.startedAt && <TimelineItem label="Started" date={wo.startedAt} />}
              {wo.completedAt && <TimelineItem label="Completed" date={wo.completedAt} />}
              <TimelineItem label="Created" date={wo.createdAt} />
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

function TimelineItem({ label, date }: { label: string, date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(date)}</p>
      </div>
    </div>
  )
}
