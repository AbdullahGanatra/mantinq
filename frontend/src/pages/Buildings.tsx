import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Building2, MapPin, Layers, DoorOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import api from '@/services/api'
import BuildingFormDialog from '@/components/buildings/BuildingFormDialog'

export default function Buildings() {
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => { fetchBuildings() }, [])

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/buildings')
      setBuildings(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch buildings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setDialogMode('create')
    setSelectedBuilding(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (building: any) => {
    setDialogMode('edit')
    setSelectedBuilding(building)
    setDialogOpen(true)
  }

  const handleDelete = async (building: any) => {
    if (!window.confirm(`Delete building "${building.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/buildings/${building.id}`)
      toast({ title: 'Success', description: 'Building deleted' })
      fetchBuildings()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete building'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Buildings & Locations</h1>
          <p className="text-muted-foreground mt-1">Manage your facilities and rooms</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}><Plus className="w-4 h-4" /> Add Building</Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)
        ) : buildings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No buildings found</div>
        ) : buildings.map((building, i) => (
          <motion.div key={building.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">{building.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {building.address || 'No address'}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(building)}>
                      <Pencil className="w-4 h-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(building)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {building.floors?.map((floor: any) => (
                  <div key={floor.id} className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{floor.name}</p>
                    </div>
                    <div className="space-y-1">
                      {floor.rooms?.map((room: any) => (
                        <div key={room.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DoorOpen className="w-3 h-3" />
                          {room.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <BuildingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={selectedBuilding}
        onSuccess={fetchBuildings}
      />
    </div>
  )
}
