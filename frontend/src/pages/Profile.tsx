import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Camera, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'
import api from '@/services/api'

export default function Profile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  })

  const handleSave = async () => {
    try {
      await api.put('/users/profile', formData)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
      setIsEditing(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarFallback className="gradient-primary text-white text-2xl font-bold">
                  {getInitials(user?.firstName || '', user?.lastName || '')}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold mt-4">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-2">{user?.role?.replace('_', ' ')}</Badge>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              <Button variant="outline" size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={!isEditing} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={!isEditing} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={user?.email} disabled className="pl-10 bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} className="pl-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
