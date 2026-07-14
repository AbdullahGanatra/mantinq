import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface DepartmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface FormValues {
  name: string
  description: string
  color: string
}

export default function DepartmentFormDialog({ open, onOpenChange, mode, initialData, onSuccess }: DepartmentFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        reset({ name: initialData.name || '', description: initialData.description || '', color: initialData.color || '#2563EB' })
      } else {
        reset({ name: '', description: '', color: '#2563EB' })
      }
    }
  }, [open, mode, initialData, reset])

  const onSubmit = async (data: FormValues) => {
    if (!data.name.trim()) {
      toast({ title: 'Error', description: 'Department name is required', variant: 'destructive' })
      return
    }
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      color: data.color || '#2563EB',
    }
    try {
      setSubmitting(true)
      if (mode === 'create') {
        await api.post('/departments', payload)
        toast({ title: 'Success', description: 'Department created successfully' })
      } else {
        await api.put(`/departments/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'Department updated successfully' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong'
      // Surface uniqueness conflict cleanly
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Department' : 'Edit Department'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input {...register('name')} placeholder="Engineering" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register('description')} placeholder="Optional description..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('color')}
                className="h-11 w-16 cursor-pointer rounded-lg border border-input bg-background p-1"
              />
              <Input {...register('color')} placeholder="#2563EB" className="flex-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : mode === 'create' ? 'Create Department' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
