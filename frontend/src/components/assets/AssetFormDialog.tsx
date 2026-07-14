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

const ASSET_STATUSES = [
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'OUT_OF_ORDER', label: 'Out of Order' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
  { value: 'RESERVED', label: 'Reserved' },
]

interface Category {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface RoomOption {
  id: string
  label: string
}

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
}

interface FormValues {
  name: string
  description: string
  model: string
  manufacturer: string
  serialNumber: string
  barcode: string
  purchaseDate: string
  purchaseCost: string
  warrantyExpiry: string
  status: string
  categoryId: string
  departmentId: string
  roomId: string
}

export default function AssetFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSuccess,
}: AssetFormDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [rooms, setRooms] = useState<RoomOption[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      model: '',
      manufacturer: '',
      serialNumber: '',
      barcode: '',
      purchaseDate: '',
      purchaseCost: '',
      warrantyExpiry: '',
      status: 'OPERATIONAL',
      categoryId: '',
      departmentId: '',
      roomId: '',
    },
  })

  const watchedStatus = watch('status')
  const watchedCategoryId = watch('categoryId')
  const watchedDepartmentId = watch('departmentId')
  const watchedRoomId = watch('roomId')

  // Load reference data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, deptRes, bldRes] = await Promise.all([
          api.get('/asset-categories'),
          api.get('/departments'),
          api.get('/buildings'),
        ])
        setCategories(catRes.data.data)
        setDepartments(deptRes.data.data)

        // Flatten buildings -> floors -> rooms
        const roomOptions: RoomOption[] = []
        for (const building of bldRes.data.data) {
          for (const floor of building.floors || []) {
            for (const room of floor.rooms || []) {
              roomOptions.push({
                id: room.id,
                label: `${building.name} / ${floor.name} / ${room.name}`,
              })
            }
          }
        }
        setRooms(roomOptions)
      } catch {
        toast({ title: 'Error', description: 'Failed to load form data', variant: 'destructive' })
      }
    }
    if (open) loadData()
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        model: initialData.model || '',
        manufacturer: initialData.manufacturer || '',
        serialNumber: initialData.serialNumber || '',
        barcode: initialData.barcode || '',
        purchaseDate: initialData.purchaseDate
          ? initialData.purchaseDate.substring(0, 10)
          : '',
        purchaseCost: initialData.purchaseCost != null ? String(initialData.purchaseCost) : '',
        warrantyExpiry: initialData.warrantyExpiry
          ? initialData.warrantyExpiry.substring(0, 10)
          : '',
        status: initialData.status || 'OPERATIONAL',
        categoryId: initialData.categoryId || '',
        departmentId: initialData.departmentId || '',
        roomId: initialData.roomId || '',
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        description: '',
        model: '',
        manufacturer: '',
        serialNumber: '',
        barcode: '',
        purchaseDate: '',
        purchaseCost: '',
        warrantyExpiry: '',
        status: 'OPERATIONAL',
        categoryId: '',
        departmentId: '',
        roomId: '',
      })
    }
  }, [open, mode, initialData])

  const onSubmit = async (values: FormValues) => {
    if (!values.name.trim()) {
      toast({ title: 'Validation', description: 'Asset name is required', variant: 'destructive' })
      return
    }
    if (!values.categoryId) {
      toast({ title: 'Validation', description: 'Category is required', variant: 'destructive' })
      return
    }

    const payload: any = {
      name: values.name.trim(),
      status: values.status,
      categoryId: values.categoryId,
    }
    if (values.description.trim()) payload.description = values.description.trim()
    if (values.model.trim()) payload.model = values.model.trim()
    if (values.manufacturer.trim()) payload.manufacturer = values.manufacturer.trim()
    if (values.serialNumber.trim()) payload.serialNumber = values.serialNumber.trim()
    if (values.barcode.trim()) payload.barcode = values.barcode.trim()
    if (values.purchaseDate) payload.purchaseDate = new Date(values.purchaseDate).toISOString()
    if (values.purchaseCost) payload.purchaseCost = parseFloat(values.purchaseCost)
    if (values.warrantyExpiry) payload.warrantyExpiry = new Date(values.warrantyExpiry).toISOString()
    if (values.departmentId) payload.departmentId = values.departmentId
    if (values.roomId) payload.roomId = values.roomId

    try {
      setSubmitting(true)
      if (mode === 'create') {
        await api.post('/assets', payload)
        toast({ title: 'Success', description: 'Asset created successfully' })
      } else {
        await api.put(`/assets/${initialData.id}`, payload)
        toast({ title: 'Success', description: 'Asset updated successfully' })
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Asset' : 'Edit Asset'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new asset.'
              : 'Update the asset information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" placeholder="e.g. HVAC Unit A" {...register('name')} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description..."
              rows={2}
              {...register('description')}
            />
          </div>

          {/* Row: Model + Manufacturer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="e.g. XC-3000" {...register('model')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" placeholder="e.g. Carrier" {...register('manufacturer')} />
            </div>
          </div>

          {/* Row: Serial + Barcode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" placeholder="SN-..." {...register('serialNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="Barcode value" {...register('barcode')} />
            </div>
          </div>

          {/* Row: Category (required) + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchedCategoryId}
                onValueChange={(val) => setValue('categoryId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {ASSET_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Department + Room */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={watchedDepartmentId || '__none__'}
                onValueChange={(val) => setValue('departmentId', val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Room / Location</Label>
              <Select
                value={watchedRoomId || '__none__'}
                onValueChange={(val) => setValue('roomId', val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Purchase Date + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchaseCost">Purchase Cost ($)</Label>
              <Input
                id="purchaseCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('purchaseCost')}
              />
            </div>
          </div>

          {/* Warranty Expiry */}
          <div className="space-y-1.5">
            <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
            <Input id="warrantyExpiry" type="date" {...register('warrantyExpiry')} className="max-w-xs" />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Create Asset'
                : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
