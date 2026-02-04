'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, WhatsApp API credentials, and billing.
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
              <Input defaultValue="Riya" />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input defaultValue="Kapoor" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="riya@reachly.io" />
          </div>
          <div className="space-y-2">
            <Label>Company</Label>
            <Input defaultValue="Reachly Labs" />
          </div>
          <Button>Save profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp API credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access token</Label>
            <Input type="password" placeholder="****************" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone number ID</Label>
              <Input placeholder="123456789" />
            </div>
            <div className="space-y-2">
              <Label>Business ID</Label>
              <Input placeholder="987654321" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Webhook verification token</Label>
            <Input placeholder="reachly-webhook-token" />
          </div>
          <Button variant="outline">Verify & save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Professional Plan</p>
            <p className="text-xs text-muted-foreground">Renews on 12 May 2025</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline">Manage subscription</Button>
              <Button variant="ghost">View invoices</Button>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Usage</p>
            <p className="text-xs text-muted-foreground">
              6,220 of 10,000 messages used this month.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly security report</p>
              <p className="text-xs text-muted-foreground">Receive a summary every Monday</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Audit log note</Label>
            <Textarea placeholder="Add a note for your compliance logs" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
