'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { ArrowUpRight, MessageSquare, Send, Users, Zap } from 'lucide-react'

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { analyticsAPI, campaignsAPI } from '@/lib/api'
import Link from 'next/link'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview', '30d'],
    queryFn: () => analyticsAPI.getOverview('30d')
  })

  const { data: messagesRes, isLoading: messagesLoading } = useQuery({
    queryKey: ['analytics', 'messages', '7d', 'day'],
    queryFn: () => analyticsAPI.getMessages('7d', 'day')
  })

  const { data: campaignsRes, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsAPI.getAll()
  })

  const { data: customersRes, isLoading: customersLoading } = useQuery({
    queryKey: ['analytics', 'customers', '30d'],
    queryFn: () => analyticsAPI.getCustomers('30d')
  })

  const isLoading = overviewLoading || messagesLoading || campaignsLoading || customersLoading

  const data = overviewRes?.data?.data?.overview || null

  const messagesChart = useMemo(() => {
    if (messagesRes?.data?.data && Array.isArray(messagesRes.data.data.messageAnalytics)) {
      return messagesRes.data.data.messageAnalytics.map((item: any) => ({
        day: format(new Date(item.date), 'EEE'),
        messages: (item.sent || 0) + (item.delivered || 0)
      }))
    }
    return []
  }, [messagesRes])

  const customerChart = useMemo(() => {
    if (customersRes?.data?.data?.customerGrowth && Array.isArray(customersRes.data.data.customerGrowth)) {
      return customersRes.data.data.customerGrowth.map((item: any) => ({
        date: format(new Date(item.date), 'MMM dd'),
        customers: Number(item.count) || 0
      }))
    }
    return []
  }, [customersRes])

  const campaigns = useMemo(() => {
    if (campaignsRes?.data?.data && Array.isArray(campaignsRes.data.data)) {
      return campaignsRes.data.data.slice(0, 4)
    }
    return []
  }, [campaignsRes])

  const stats = [
    {
      title: 'Messages Sent (30d)',
      value: data?.totalMessages?.toLocaleString() || '0',
      icon: Send,
    },
    {
      title: 'Active Customers',
      value: data?.totalCustomers?.toLocaleString() || '0',
      icon: Users,
    },
    {
      title: 'Total Templates',
      value: data?.totalTemplates?.toLocaleString() || '0',
      icon: MessageSquare,
    },
    {
      title: 'Active Conversations',
      value: data?.activeConversations?.toLocaleString() || '0',
      icon: Zap,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
            <CardTitle>Weekly Message Volume</CardTitle>
            <CardDescription>Messages sent across all campaigns (Last 7 Days)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {messagesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={messagesChart}>
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No message data available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>New customers acquired (Last 30 Days)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {customerChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerChart}>
                  <defs>
                    <linearGradient id="customers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
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
                    dataKey="customers"
                    stroke="#10b981"
                    fill="url(#customers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No customer growth data available.
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Latest campaigns created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.length > 0 ? (
              campaigns.map((campaign: any) => (
                <div key={campaign.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate max-w-[150px]">{campaign.name}</p>
                    <Badge variant={campaign.status === 'completed' ? 'success' : campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target: {campaign.totalMessages || 0}</span>
                    <span>Delivered: {campaign.deliveredMessages || 0}</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="py-8 text-center text-sm text-muted-foreground">
                No campaigns found.
              </div>
            )}
            
            <Link href="/dashboard/campaigns" className="block w-full">
              <Button variant="outline" className="w-full mt-2">
                View all campaigns
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
