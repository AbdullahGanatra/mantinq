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

interface IssueFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface IssueFormValues {
  title: string
  description: string
  priority: string
  status: string
  assetId: string
  assignedToId: string
}

export default function IssueFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSuccess,
}: IssueFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<IssueFormValues>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'OPEN',
      assetId: '',
      assignedToId: '',
    },
  })

  const watchedAssetId = watch('assetId')
  const watchedAssignedToId = watch('assignedToId')
  const watchedPriority = watch('priority')
  const watchedStatus = watch('status')

  useEffect(() => {
    if (open) {
      fetchDropdowns()
      if (mode === 'edit' && initialData) {
        reset({
          title: initialData.title || '',
          description: initialData.description || '',
          priority: initialData.priority || 'MEDIUM',
          status: initialData.status || 'OPEN',
          assetId: initialData.assetId || '',
          assignedToId: initialData.assignedToId || '',
        })
      } else {
        reset({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'OPEN',
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
      // silently fail — dropdowns may be empty
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const onSubmit = async (values: IssueFormValues) => {
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
        priority: values.priority,
        assetId: values.assetId,
        assignedToId: values.assignedToId || undefined,
      }
      if (mode === 'edit') {
        payload.status = values.status
      }

      if (mode === 'create') {
        await api.post('/issues', payload)
        toast({ title: 'Success', description: 'Issue reported successfully' })
      } else {
        await api.put(`/issues/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'Issue updated successfully' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save issue',
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
          <DialogTitle>{mode === 'create' ? 'Report Issue' : 'Edit Issue'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to report a new issue.'
              : 'Update the issue details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="issue-title"
              placeholder="Brief description of the issue"
              {...register('title', { required: true })}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">Title is required</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-description">Description</Label>
            <Textarea
              id="issue-description"
              placeholder="Provide more details about the issue..."
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

          {/* Priority */}
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
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REOPENED">Reopened</SelectItem>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'create' ? 'Report Issue' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
