import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  QrCode,
  MoreHorizontal,
  Package,
  ArrowUpDown,
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
import { formatDate, getStatusColor } from '@/lib/utils'
import api from '@/services/api'
import AssetFormDialog from '@/components/assets/AssetFormDialog'

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<any>(null)
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingAsset, setEditingAsset] = useState<any>(null)

  useEffect(() => {
    fetchAssets()
  }, [page, search])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const res = await api.get('/assets', { params: { page, limit: 10, search: search || undefined } })
      setAssets(res.data.data)
      setMeta(res.data.meta)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch assets', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setDialogMode('create')
    setEditingAsset(null)
    setDialogOpen(true)
  }

  const openEdit = (asset: any) => {
    setDialogMode('edit')
    setEditingAsset(asset)
    setDialogOpen(true)
  }

  const handleDelete = async (asset: any) => {
    if (!window.confirm(`Delete asset "${asset.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/assets/${asset.id}`)
      toast({ title: 'Deleted', description: `"${asset.name}" has been deleted.` })
      fetchAssets()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete asset'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <QrCode className="w-4 h-4" />
            Scan QR
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Asset <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-muted rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No assets found</p>
                  </td>
                </tr>
              ) : (
                assets.map((asset, index) => (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/assets/${asset.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.model || asset.barcode}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {asset.category?.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {asset.room?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(asset.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(asset)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(asset)}
                          >
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

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AssetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={editingAsset}
        onSuccess={fetchAssets}
      />
    </div>
  )
}
