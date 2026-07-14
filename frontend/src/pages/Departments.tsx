import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Building2, Users, Package, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'
import DepartmentFormDialog from '@/components/departments/DepartmentFormDialog'

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedDept, setSelectedDept] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => { fetchDepartments() }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/departments')
      setDepartments(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch departments', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setDialogMode('create')
    setSelectedDept(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (dept: any) => {
    setDialogMode('edit')
    setSelectedDept(dept)
    setDialogOpen(true)
  }

  const handleDelete = async (dept: any) => {
    if (!window.confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/departments/${dept.id}`)
      toast({ title: 'Success', description: 'Department deleted' })
      fetchDepartments()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete department'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Departments</h1>
          <p className="text-muted-foreground mt-1">Organize your team by departments</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Add Department</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)
        ) : departments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No departments found</div>
        ) : departments.map((dept, i) => (
          <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50 hover-lift p-6" style={{ borderLeftColor: dept.color, borderLeftWidth: 4 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color + '20' }}>
                    <Building2 className="w-5 h-5" style={{ color: dept.color }} />
                  </div>
                  <div>
                    <p className="font-semibold">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.description || 'No description'}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(dept)}>
                      <Pencil className="w-4 h-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(dept)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {dept._count?.users || 0}</span>
                <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {dept._count?.assets || 0}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={selectedDept}
        onSuccess={fetchDepartments}
      />
    </div>
  )
}
