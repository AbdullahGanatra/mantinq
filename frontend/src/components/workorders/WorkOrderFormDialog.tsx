import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface WorkOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface WorkOrderFormValues {
  title: string
  description: string
  type: string
  priority: string
  status: string
  scheduledDate: string
  dueDate: string
  estimatedHours: string
  estimatedCost: string
  assetId: string
  assignedToId: string
}

export default function WorkOrderFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSuccess,
}: WorkOrderFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WorkOrderFormValues>({
    defaultValues: {
      title: '',
      description: '',
      type: 'CORRECTIVE',
      priority: 'MEDIUM',
      status: 'PENDING',
      scheduledDate: '',
      dueDate: '',
      estimatedHours: '',
      estimatedCost: '',
      assetId: '',
      assignedToId: '',
    },
  })

  const watchedAssetId = watch('assetId')
  const watchedAssignedToId = watch('assignedToId')
  const watchedPriority = watch('priority')
  const watchedStatus = watch('status')
  const watchedType = watch('type')

  useEffect(() => {
    if (open) {
      fetchDropdowns()
      if (mode === 'edit' && initialData) {
        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          type: initialData.type || 'CORRECTIVE',
          priority: initialData.priority || 'MEDIUM',
          status: initialData.status || 'PENDING',
          scheduledDate: initialData.scheduledDate
            ? new Date(initialData.scheduledDate).toISOString().split('T')[0]
            : '',
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate).toISOString().split('T')[0]
            : '',
          estimatedHours: initialData.estimatedHours != null ? String(initialData.estimatedHours) : '',
          estimatedCost: initialData.estimatedCost != null ? String(initialData.estimatedCost) : '',
          assetId: initialData.assetId || '',
          assignedToId: initialData.assignedToId || '',
        })
      } else {
        reset({
          title: '',
          description: '',
          type: 'CORRECTIVE',
          priority: 'MEDIUM',
          status: 'PENDING',
          scheduledDate: '',
          dueDate: '',
          estimatedHours: '',
          estimatedCost: '',
          assetId: '',
          assignedToId: '',
        })
      }
    }
  }, [open, mode, initialData])

  const fetchDropdowns = async () => {
    setLoadingDropdowns(true)
    try {
      const [assetsRes, usersRes] = await Promise.allSettled([
        api.get('/assets', { params: { limit: 100 } }),
        api.get('/users', { params: { limit: 100 } }),
      ])
      if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value.data.data || [])
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data || [])
    } catch {
      // silently fail
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const onSubmit = async (values: WorkOrderFormValues) => {
    if (!values.title.trim()) return
    if (!values.assetId) {
      toast({ title: 'Validation Error', description: 'Asset is required', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        type: values.type,
        priority: values.priority,
        assetId: values.assetId,
        assignedToId: values.assignedToId || undefined,
        scheduledDate: values.scheduledDate || undefined,
        dueDate: values.dueDate || undefined,
        estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : undefined,
      }
      if (mode === 'edit') {
        payload.status = values.status
      }

      if (mode === 'create') {
        await api.post('/work-orders', payload)
        toast({ title: 'Success', description: 'Work order created successfully' })
      } else {
        await api.put(`/work-orders/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'Work order updated successfully' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save work order',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Work Order' : 'Edit Work Order'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new work order.'
              : 'Update the work order details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="wo-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="wo-title"
              placeholder="Brief description of the work"
              {...register('title', { required: true })}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">Title is required</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="wo-description">Description</Label>
            <Textarea
              id="wo-description"
              placeholder="Detailed description of the work to be done..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Asset */}
          <div className="space-y-1.5">
            <Label>Asset <span className="text-destructive">*</span></Label>
            <Select
              value={watchedAssetId}
              onValueChange={(val) => setValue('assetId', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingDropdowns ? 'Loading...' : 'Select asset'} />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}{asset.barcode ? ` (${asset.barcode})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={watchedType}
                onValueChange={(val) => setValue('type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                  <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                  <SelectItem value="PREDICTIVE">Predictive</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={watchedPriority}
                onValueChange={(val) => setValue('priority', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (edit mode only) */}
          {mode === 'edit' && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watchedStatus}
                onValueChange={(val) => setValue('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assigned To */}
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select
              value={watchedAssignedToId || '__none__'}
              onValueChange={(val) => setValue('assignedToId', val === '__none__' ? '' : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingDropdowns ? 'Loading...' : 'Unassigned'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date & Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-scheduled">Scheduled Date</Label>
              <Input
                id="wo-scheduled"
                type="date"
                {...register('scheduledDate')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-due">Due Date</Label>
              <Input
                id="wo-due"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>

          {/* Estimated Hours & Cost row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="wo-hours">Est. Hours</Label>
              <Input
                id="wo-hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                {...register('estimatedHours')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-cost">Est. Cost ($)</Label>
              <Input
                id="wo-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('estimatedCost')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Work Order' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
