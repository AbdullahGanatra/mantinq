import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface FormValues {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: string
  status: string
  departmentId: string
}

const USER_ROLES = [
  { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin' },
  { value: 'MAINTENANCE_MANAGER', label: 'Maintenance Manager' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'VIEWER', label: 'Viewer' },
]

const USER_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export default function UserFormDialog({ open, onOpenChange, mode, initialData, onSuccess }: UserFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [role, setRole] = useState('EMPLOYEE')
  const [status, setStatus] = useState('ACTIVE')
  const [departmentId, setDepartmentId] = useState('')

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      api.get('/departments').then(res => setDepartments(res.data.data)).catch(() => {})
      if (mode === 'edit' && initialData) {
        reset({
          email: initialData.email || '',
          password: '',
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          phone: initialData.phone || '',
          role: initialData.role || 'EMPLOYEE',
          status: initialData.status || 'ACTIVE',
          departmentId: initialData.department?.id || '',
        })
        setRole(initialData.role || 'EMPLOYEE')
        setStatus(initialData.status || 'ACTIVE')
        setDepartmentId(initialData.department?.id || '')
      } else {
        reset({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'EMPLOYEE', status: 'ACTIVE', departmentId: '' })
        setRole('EMPLOYEE')
        setStatus('ACTIVE')
        setDepartmentId('')
      }
    }
  }, [open, mode, initialData, reset])

  const onSubmit = async (data: FormValues) => {
    // Basic validation
    if (!data.firstName.trim()) { toast({ title: 'Error', description: 'First name is required', variant: 'destructive' }); return }
    if (!data.lastName.trim()) { toast({ title: 'Error', description: 'Last name is required', variant: 'destructive' }); return }
    if (mode === 'create') {
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        toast({ title: 'Error', description: 'A valid email is required', variant: 'destructive' }); return
      }
      if (!data.password || data.password.length < 8) {
        toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' }); return
      }
    }

    const payload: any = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim() || undefined,
      role,
      departmentId: departmentId || null,
    }
    if (mode === 'create') {
      payload.email = data.email.trim()
      payload.password = data.password
    } else {
      payload.status = status
      if (data.password) payload.password = data.password
    }

    try {
      setSubmitting(true)
      if (mode === 'create') {
        await api.post('/users', payload)
        toast({ title: 'Success', description: 'User created successfully' })
      } else {
        await api.put(`/users/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'User updated successfully' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add User' : 'Edit User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input {...register('firstName')} placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input {...register('lastName')} placeholder="Doe" />
            </div>
          </div>
          {mode === 'create' && (
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input {...register('email')} type="email" placeholder="john@example.com" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{mode === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}</Label>
            <Input {...register('password')} type="password" placeholder={mode === 'create' ? 'Min 8 characters' : '••••••••'} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register('phone')} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {USER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={departmentId || 'none'} onValueChange={v => setDepartmentId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
