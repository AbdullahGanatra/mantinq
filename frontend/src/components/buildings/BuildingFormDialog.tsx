import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'

interface BuildingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface FormValues {
  name: string
  description: string
  address: string
}

export default function BuildingFormDialog({ open, onOpenChange, mode, initialData, onSuccess }: BuildingFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        reset({ name: initialData.name || '', description: initialData.description || '', address: initialData.address || '' })
      } else {
        reset({ name: '', description: '', address: '' })
      }
    }
  }, [open, mode, initialData, reset])

  const onSubmit = async (data: FormValues) => {
    if (!data.name.trim()) {
      toast({ title: 'Error', description: 'Building name is required', variant: 'destructive' })
      return
    }
    const payload = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      address: data.address.trim() || undefined,
    }
    try {
      setSubmitting(true)
      if (mode === 'create') {
        await api.post('/buildings', payload)
        toast({ title: 'Success', description: 'Building created successfully' })
      } else {
        await api.put(`/buildings/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'Building updated successfully' })
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
          <DialogTitle>{mode === 'create' ? 'Add Building' : 'Edit Building'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input {...register('name')} placeholder="Main Office" />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input {...register('address')} placeholder="123 Main St, City, State" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register('description')} placeholder="Optional description..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : mode === 'create' ? 'Create Building' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
