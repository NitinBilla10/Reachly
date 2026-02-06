'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, MessageSquareText, Send, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const stats = [
  {
    title: 'Messages Sent',
    value: '28,492',
    change: '+12.4%',
    icon: Send,
  },
  {
    title: 'Active Customers',
    value: '3,204',
    change: '+6.1%',
    icon: Users,
  },
  {
    title: 'Templates Approved',
    value: '42',
    change: '+4 new',
    icon: MessageSquareText,
  },
  {
    title: 'Delivery Rate',
    value: '97.8%',
    change: '+1.2%',
    icon: Zap,
  },
]

const chartData = [
  { day: 'Mon', messages: 3200 },
  { day: 'Tue', messages: 4200 },
  { day: 'Wed', messages: 3800 },
  { day: 'Thu', messages: 5100 },
  { day: 'Fri', messages: 4600 },
  { day: 'Sat', messages: 5600 },
  { day: 'Sun', messages: 4800 },
]

const campaigns = [
  {
    name: 'Spring Collection Launch',
    status: 'Running',
    sent: '4,200',
    delivered: '4,088',
  },
  {
    name: 'VIP Early Access',
    status: 'Completed',
    sent: '2,140',
    delivered: '2,091',
  },
  {
    name: 'Abandoned Cart Follow-up',
    status: 'Scheduled',
    sent: '1,300',
    delivered: '—',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Welcome back, Riya</h1>
        <p className="text-muted-foreground">
          Here is what is happening with your WhatsApp campaigns today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="text-xs text-emerald-500">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Message Volume</CardTitle>
            <CardDescription>Messages sent across all campaigns</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="messages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(var(--primary))"
                  fill="url(#messages)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Health</CardTitle>
            <CardDescription>Live overview of active campaigns</CardDescription>
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
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Sent: {campaign.sent}</span>
                  <span>Delivered: {campaign.delivered}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View all campaigns
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
