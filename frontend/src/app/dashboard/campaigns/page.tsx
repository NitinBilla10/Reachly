'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const campaigns = [
  {
    name: 'New Product Drop',
    status: 'Running',
    progress: 68,
    sent: '6,220',
    total: '9,100',
  },
  {
    name: 'VIP Early Access',
    status: 'Completed',
    progress: 100,
    sent: '2,140',
    total: '2,140',
  },
  {
    name: 'Feedback Request',
    status: 'Scheduled',
    progress: 0,
    sent: '0',
    total: '1,800',
  },
]

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Messaging</h1>
        <p className="text-muted-foreground">
          Send personalized campaigns to customer segments using tags.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create a campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input placeholder="Spring promotion" />
            </div>
            <div className="space-y-2">
              <Label>Select template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Weekly Promo</SelectItem>
                  <SelectItem value="vip">VIP Early Access</SelectItem>
                  <SelectItem value="order">Order Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target tags</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">VIP</Badge>
                <Badge variant="secondary">Leads</Badge>
                <Badge variant="secondary">Paid</Badge>
                <Badge variant="outline">+ Add tag</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preview message</Label>
              <Textarea
                placeholder="Hi {{name}}, we have something special for you..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline">Schedule</Button>
              <Button>Send campaign</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.name} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{campaign.name}</p>
                  <Badge variant={campaign.status === 'Running' ? 'success' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <Progress value={campaign.progress} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {campaign.sent} / {campaign.total} sent
                    </span>
                    <span>{campaign.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
