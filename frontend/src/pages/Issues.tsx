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
import IssueFormDialog from '@/components/issues/IssueFormDialog'

export default function Issues() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page] = useState(1)
  const [_meta, setMeta] = useState<any>(null)
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedIssue, setSelectedIssue] = useState<any>(null)

  useEffect(() => { fetchIssues() }, [page, search])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const res = await api.get('/issues', { params: { page, limit: 10, search: search || undefined } })
      setIssues(res.data.data)
      setMeta(res.data.meta)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch issues', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setDialogMode('create')
    setSelectedIssue(null)
    setDialogOpen(true)
  }

  const openEdit = (issue: any) => {
    setDialogMode('edit')
    setSelectedIssue(issue)
    setDialogOpen(true)
  }

  const handleDelete = async (issue: any) => {
    if (!window.confirm(`Delete issue "${issue.title}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/issues/${issue.id}`)
      toast({ title: 'Deleted', description: 'Issue deleted successfully' })
      fetchIssues()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete issue',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Issues</h1>
          <p className="text-muted-foreground mt-1">Track and resolve reported issues</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Report Issue
        </Button>
      </div>

      <Card className="p-4 border-border/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Issue #</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Priority</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Asset</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Reported</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-10 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No issues found</td></tr>
              ) : (
                issues.map((issue, i) => (
                  <motion.tr
                    key={issue.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/issues/${issue.id}`} className="font-mono text-sm text-primary hover:underline">
                        {issue.issueNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm">{issue.title}</td>
                    <td className="px-6 py-4 text-sm">{getPriorityIcon(issue.priority)} {issue.priority}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusColor(issue.status)}>{issue.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{issue.asset?.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(issue.createdAt)}</td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(issue)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(issue)}
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

      <IssueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={selectedIssue}
        onSuccess={fetchIssues}
      />
    </div>
  )
}
