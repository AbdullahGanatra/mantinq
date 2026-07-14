import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Package,
  QrCode,
  Wrench,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  Barcode,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import api from '@/services/api'

export default function AssetDetail() {
  const { id } = useParams()
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAsset()
  }, [id])

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/assets/${id}`)
      setAsset(res.data.data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch asset', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl animate-pulse" />
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!asset) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/assets">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-heading">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getStatusColor(asset.status)}>
                {asset.status}
              </Badge>
              <span className="text-sm text-muted-foreground">{asset.category?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <QrCode className="w-4 h-4" />
            View QR
          </Button>
          <Button className="gap-2">
            <Wrench className="w-4 h-4" />
            Create Work Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={Barcode} label="Serial Number" value={asset.serialNumber || 'N/A'} />
              <InfoItem icon={Barcode} label="Barcode" value={asset.barcode || 'N/A'} />
              <InfoItem icon={Package} label="Model" value={asset.model || 'N/A'} />
              <InfoItem icon={Package} label="Manufacturer" value={asset.manufacturer || 'N/A'} />
              <InfoItem icon={MapPin} label="Location" value={`${asset.room?.name || 'N/A'} - ${asset.room?.floor?.building?.name || ''}`} />
              <InfoItem icon={Calendar} label="Purchase Date" value={asset.purchaseDate ? formatDate(asset.purchaseDate) : 'N/A'} />
              <InfoItem icon={DollarSign} label="Purchase Cost" value={asset.purchaseCost ? formatCurrency(Number(asset.purchaseCost)) : 'N/A'} />
              <InfoItem icon={Calendar} label="Warranty Expiry" value={asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : 'N/A'} />
            </CardContent>
          </Card>

          {/* Work Orders */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-violet-500" />
                Recent Work Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.workOrders?.length > 0 ? (
                asset.workOrders.map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">{wo.woNumber}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(wo.status)}>
                      {wo.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No work orders</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Work Orders</span>
                <span className="font-bold">{asset._count?.workOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Issues</span>
                <span className="font-bold">{asset._count?.issues || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Department</span>
                <span className="font-medium text-sm">{asset.department?.name || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {asset.createdBy?.firstName?.[0]}{asset.createdBy?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{asset.createdBy?.firstName} {asset.createdBy?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(asset.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium text-sm mt-0.5">{value}</p>
      </div>
    </div>
  )
}
