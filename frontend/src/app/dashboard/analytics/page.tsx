'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { analyticsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await analyticsAPI.getOverview(period)
      setOverview(response.data.data)
    } catch (error) {
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      title: 'Total Customers',
      value: overview?.customers?.total || 0,
      change: `+${overview?.customers?.new || 0} new`,
      icon: Users,
    },
    {
      title: 'Messages Sent',
      value: overview?.messages?.sent || 0,
      change: `${overview?.messages?.deliveryRate || 0}% delivered`,
      icon: Send,
    },
    {
      title: 'Conversations',
      value: overview?.conversations?.active || 0,
      change: `${overview?.conversations?.total || 0} total`,
      icon: MessageSquare,
    },
    {
      title: 'Campaigns',
      value: overview?.campaigns?.sent || 0,
      change: `${overview?.campaigns?.total || 0} total`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your WhatsApp marketing performance
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
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
                  <div className="text-2xl font-semibold">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-emerald-500">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Message Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                  <p className="text-3xl font-bold text-emerald-600">
                    {overview?.messages?.deliveryRate || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Delivery Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <p className="text-3xl font-bold text-blue-600">
                    {overview?.messages?.readRate || 0}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Read Rate</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-3xl font-bold">
                    {overview?.messages?.total || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
