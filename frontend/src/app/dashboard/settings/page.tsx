'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { settingsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false)
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  })
  
  const [whatsapp, setWhatsapp] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessId: '',
    webhookVerifyToken: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const [profileRes, whatsappRes] = await Promise.all([
        settingsAPI.getProfile().catch(() => ({ data: { data: { user: {} } } })),
        settingsAPI.getWhatsApp().catch(() => ({ data: { data: null } }))
      ])

      const user = profileRes?.data?.data?.user
      if (user) {
        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          company: user.company || ''
        })
      }

      const wa = whatsappRes?.data?.data
      if (wa) {
        setWhatsapp({
          accessToken: '', // Keep empty for security
          phoneNumberId: wa.phoneNumberId || '',
          businessId: wa.businessId || '',
          webhookVerifyToken: wa.webhookVerifyToken || ''
        })
      }

    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true)
      await settingsAPI.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        company: profile.company
      })
      toast.success('Profile updated successfully.')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveWhatsApp = async () => {
    try {
      setIsSavingWhatsApp(true)
      await settingsAPI.updateWhatsApp({
        accessToken: whatsapp.accessToken,
        phoneNumberId: whatsapp.phoneNumberId,
        businessId: whatsapp.businessId,
        webhookVerifyToken: whatsapp.webhookVerifyToken || undefined
      })
      toast.success('WhatsApp credentials verified and saved!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to verify WhatsApp credentials.')
    } finally {
      setIsSavingWhatsApp(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and WhatsApp API credentials.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input 
                value={profile.firstName} 
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input 
                value={profile.lastName} 
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={profile.email} 
              disabled // Usually email changes require extra verification
            />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input 
              placeholder="e.g. Reachly Labs"
              value={profile.company} 
              onChange={(e) => setProfile({...profile, company: e.target.value})}
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp API credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access token</Label>
            <Input 
              type="password" 
              placeholder="****************" 
              value={whatsapp.accessToken}
              onChange={(e) => setWhatsapp({...whatsapp, accessToken: e.target.value})}
            />
            <p className="text-[10px] text-muted-foreground">Leave empty if you don't want to change your existing token.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone number ID</Label>
              <Input 
                placeholder="123456789" 
                value={whatsapp.phoneNumberId}
                onChange={(e) => setWhatsapp({...whatsapp, phoneNumberId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Business ID</Label>
              <Input 
                placeholder="987654321" 
                value={whatsapp.businessId}
                onChange={(e) => setWhatsapp({...whatsapp, businessId: e.target.value})}
              />
            </div>
          </div>
          <Button onClick={handleSaveWhatsApp} disabled={isSavingWhatsApp}>
            {isSavingWhatsApp ? 'Saving...' : 'Save credentials'}
          </Button>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Webhook Setup Instructions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              In your Meta Developer Dashboard, set up your Webhook with the following details so that Reachly can receive your messages:
            </p>
            <div className="bg-muted p-4 rounded-md space-y-3 font-mono text-sm break-all">
              <div>
                <span className="font-semibold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Callback URL:</span>
                https://reachly-4u2x.onrender.com/webhooks/whatsapp
              </div>
              <div>
                <span className="font-semibold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Verify Token:</span>
                your-webhook-verify-token-here
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



    </div>
  )
}
