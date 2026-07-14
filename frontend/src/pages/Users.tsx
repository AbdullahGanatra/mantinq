import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, MoreHorizontal, Mail, Shield, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { getStatusColor, getInitials } from '@/lib/utils'
import api from '@/services/api'
import UserFormDialog from '@/components/users/UserFormDialog'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => { fetchUsers() }, [search])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users', { params: { search: search || undefined } })
      setUsers(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setDialogMode('create')
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setDialogMode('edit')
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDelete = async (user: any) => {
    if (!window.confirm(`Delete user "${user.firstName} ${user.lastName}"? This cannot be undone.`)) return
    try {
      await api.delete(`/users/${user.id}`)
      toast({ title: 'Success', description: 'User deleted' })
      fetchUsers()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete user'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Users</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Add User</Button>
      </div>

      <Card className="p-4 border-border/50">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))
        ) : users.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No users found</div>
        ) : (
          users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 hover-lift p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="gradient-primary text-white text-lg font-bold">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                        <Pencil className="w-4 h-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className={getStatusColor(user.status)}>{user.status}</Badge>
                  <Badge variant="secondary" className="text-xs">{user.role.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {user._count?.assignedWorkOrders || 0} WOs</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user._count?.reportedIssues || 0} Issues</span>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={selectedUser}
        onSuccess={fetchUsers}
      />
    </div>
  )
}
