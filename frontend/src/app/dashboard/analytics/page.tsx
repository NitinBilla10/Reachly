'use client'

import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const messageData = [
  { name: 'Mon', sent: 3200, delivered: 3100 },
  { name: 'Tue', sent: 4200, delivered: 4050 },
  { name: 'Wed', sent: 3800, delivered: 3720 },
  { name: 'Thu', sent: 5100, delivered: 4980 },
  { name: 'Fri', sent: 4600, delivered: 4520 },
  { name: 'Sat', sent: 5600, delivered: 5480 },
  { name: 'Sun', sent: 4800, delivered: 4700 },
]

const tagEngagement = [
  { name: 'VIP', value: 320 },
  { name: 'Leads', value: 580 },
  { name: 'Paid', value: 410 },
  { name: 'Trial', value: 210 },
]

const campaignStats = [
  { name: 'Spring Drop', sent: '9,200', rate: '98.2%' },
  { name: 'VIP Early Access', sent: '4,100', rate: '99.1%' },
  { name: 'Feedback Request', sent: '2,800', rate: '96.5%' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">
          Measure delivery performance, engagement, and campaign success.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Message delivery</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageData} barSize={16}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="delivered" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top tags</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Pie
                  data={tagEngagement}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  fill="hsl(var(--primary))"
                  label
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {campaignStats.map((campaign) => (
            <div key={campaign.name} className="rounded-lg border p-4">
              <p className="text-sm font-semibold">{campaign.name}</p>
              <p className="mt-2 text-2xl font-semibold">{campaign.sent}</p>
              <Badge variant="success" className="mt-2">
                {campaign.rate} delivered
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
