import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Scan, X, Package, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getStatusColor } from '@/lib/utils'
import api from '@/services/api'

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [scannedAsset, setScannedAsset] = useState<any>(null)
  const [manualInput, setManualInput] = useState('')
  const { toast } = useToast()

  const handleManualScan = async () => {
    if (!manualInput.trim()) return
    try {
      const res = await api.post('/assets/scan', { qrData: manualInput })
      setScannedAsset(res.data.data)
      toast({ title: 'Asset Found!', description: res.data.data.name })
    } catch {
      toast({ title: 'Not Found', description: 'No asset found with this QR code', variant: 'destructive' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">QR Code Scanner</h1>
        <p className="text-muted-foreground mt-1">Scan asset QR codes to quickly access information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="aspect-square max-w-sm mx-auto rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
              {scanning ? (
                <>
                  <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  <Scan className="w-16 h-16 text-primary animate-pulse" />
                  <p className="mt-4 text-sm font-medium">Scanning...</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setScanning(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <QrCode className="w-16 h-16 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Camera scanning coming soon</p>
                  <p className="text-xs text-muted-foreground">Use manual input below</p>
                </>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">Or enter QR data manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder='{"assetId": "..."}'
                  className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <Button onClick={handleManualScan}><Scan className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Asset */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Scanned Asset</h3>
            {scannedAsset ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{scannedAsset.name}</p>
                    <Badge variant="outline" className={getStatusColor(scannedAsset.status)}>{scannedAsset.status}</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Category:</span> {scannedAsset.category?.name}</p>
                  <p><span className="text-muted-foreground">Location:</span> {scannedAsset.room?.name || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Model:</span> {scannedAsset.model || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Serial:</span> {scannedAsset.serialNumber || 'N/A'}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm">View Details</Button>
                  <Button variant="outline" className="flex-1" size="sm">Create WO</Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Scan className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Scan a QR code to see asset details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
