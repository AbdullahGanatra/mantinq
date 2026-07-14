import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getStatusColor, getPriorityIcon } from '@/lib/utils'
import api from '@/services/api'
import WorkOrderFormDialog from '@/components/workorders/WorkOrderFormDialog'

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page] = useState(1)
  const [_meta, setMeta] = useState<any>(null)
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedWO, setSelectedWO] = useState<any>(null)

  useEffect(() => {
    fetchWorkOrders()
  }, [page, search])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/work-orders', { params: { page, limit: 10, search: search || undefined } })
      setWorkOrders(res.data.data)
      setMeta(res.data.meta)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch work orders', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setDialogMode('create')
    setSelectedWO(null)
    setDialogOpen(true)
  }

  const openEdit = (wo: any) => {
    setDialogMode('edit')
    setSelectedWO(wo)
    setDialogOpen(true)
  }

  const handleDelete = async (wo: any) => {
    if (!window.confirm(`Delete work order "${wo.title}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/work-orders/${wo.id}`)
      toast({ title: 'Deleted', description: 'Work order deleted successfully' })
      fetchWorkOrders()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete work order',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Work Orders</h1>
          <p className="text-muted-foreground mt-1">Manage maintenance work orders</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Work Order
        </Button>
      </div>

      <Card className="p-4 border-border/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">WO Number</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Priority</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Assigned To</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-10 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : workOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No work orders found</td></tr>
              ) : (
                workOrders.map((wo, i) => (
                  <motion.tr
                    key={wo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/work-orders/${wo.id}`} className="font-mono text-sm text-primary hover:underline">
                        {wo.woNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">{wo.asset?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{getPriorityIcon(wo.priority)} {wo.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusColor(wo.status)}>{wo.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {wo.assignedTo?.firstName?.[0]}{wo.assignedTo?.lastName?.[0]}
                        </div>
                        <span className="text-sm">{wo.assignedTo?.firstName} {wo.assignedTo?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {wo.dueDate ? formatDate(wo.dueDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(wo)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(wo)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <WorkOrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={selectedWO}
        onSuccess={fetchWorkOrders}
      />
    </div>
  )
}
