'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Lock, 
  MessageSquare, 
  Loader2, 
  CheckCircle,
  XCircle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { settingsAPI, authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [whatsappForm, setWhatsappForm] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessId: '',
    webhookVerifyToken: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const [profileRes, whatsappRes] = await Promise.all([
        settingsAPI.getProfile(),
        settingsAPI.getWhatsApp()
      ])
      
      const user = profileRes.data.data
      setProfile(user)
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
      
      if (whatsappRes.data.data) {
        setWhatsappConnected(whatsappRes.data.data.isActive)
        setWhatsappForm({
          accessToken: '',
          phoneNumberId: whatsappRes.data.data.phoneNumberId || '',
          businessId: whatsappRes.data.data.businessId || '',
          webhookVerifyToken: '',
        })
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    try {
      await settingsAPI.updateProfile(profileForm)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const savePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    setIsSaving(true)
    try {
      await settingsAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const saveWhatsApp = async () => {
    setIsSaving(true)
    try {
      await settingsAPI.updateWhatsApp(whatsappForm)
      toast.success('WhatsApp settings saved')
      setWhatsappConnected(true)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save WhatsApp settings')
    } finally {
      setIsSaving(false)
    }
  }

  const testWhatsApp = async () => {
    try {
      await settingsAPI.testWhatsApp()
      toast.success('WhatsApp connection successful')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Connection test failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <Button onClick={saveProfile} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <Button onClick={savePassword} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business API</CardTitle>
              <CardDescription>
                Configure your WhatsApp Business API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {whatsappConnected && (
                <Alert className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp is connected and active
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={whatsappForm.accessToken}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, accessToken: e.target.value })}
                  placeholder="Enter your WhatsApp access token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  value={whatsappForm.phoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
                  placeholder="Enter your phone number ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessId">Business ID</Label>
                <Input
                  id="businessId"
                  value={whatsappForm.businessId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, businessId: e.target.value })}
                  placeholder="Enter your business account ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookVerifyToken">Webhook Verify Token (optional)</Label>
                <Input
                  id="webhookVerifyToken"
                  value={whatsappForm.webhookVerifyToken}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, webhookVerifyToken: e.target.value })}
                  placeholder="Enter webhook verification token"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveWhatsApp} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Credentials
                </Button>
                {whatsappConnected && (
                  <Button variant="outline" onClick={testWhatsApp}>
                    Test Connection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
