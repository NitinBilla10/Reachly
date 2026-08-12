'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { analyticsAPI, campaignsAPI } from '@/lib/api'
import { format } from 'date-fns'

const COLORS = ['hsl(var(--primary))', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const [messageData, setMessageData] = useState<any[]>([])
  const [tagEngagement, setTagEngagement] = useState<any[]>([])
  const [campaignStats, setCampaignStats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const [overviewRes, messagesRes, campaignsRes] = await Promise.all([
          analyticsAPI.getOverview('30d'),
          analyticsAPI.getMessages('7d', 'day'),
          campaignsAPI.getAll()
        ])

        // Message Delivery Chart
        if (messagesRes.data.data && Array.isArray(messagesRes.data.data)) {
          const chartFormatted = messagesRes.data.data.map((item: any) => ({
            name: format(new Date(item.date), 'EEE'),
            sent: item.sent,
            delivered: item.delivered
          }))
          setMessageData(chartFormatted)
        }

        // Top Tags Pie Chart
        const topTags = overviewRes.data.data.topTags
        if (topTags && Array.isArray(topTags)) {
          const formattedTags = topTags.map((tag: any) => ({
            name: tag.name,
            value: tag._count.customers
          })).filter((tag: any) => tag.value > 0)
          
          setTagEngagement(formattedTags)
        }

        // Campaign Performance
        if (campaignsRes.data.data && Array.isArray(campaignsRes.data.data)) {
          const formattedCampaigns = campaignsRes.data.data
            .filter((c: any) => c.status === 'completed' || c.status === 'active')
            .map((c: any) => ({
              name: c.name,
              sent: c.targetCount || 0,
              delivered: c.deliveredCount || 0,
              rate: c.targetCount > 0 
                ? `${Math.round((c.deliveredCount / c.targetCount) * 100)}%` 
                : '0%'
            }))
            .slice(0, 3)
          setCampaignStats(formattedCampaigns)
        }

      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

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
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">
          Measure delivery performance, engagement, and campaign success.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Message delivery (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {messageData.length > 0 ? (
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No message data available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top tags</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {tagEngagement.length > 0 ? (
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
                  >
                    {tagEngagement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground text-center px-4">
                No tag engagement data available. Try adding tags to customers.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {campaignStats.length > 0 ? (
            campaignStats.map((campaign) => (
              <div key={campaign.name} className="rounded-lg border p-4">
                <p className="text-sm font-semibold truncate">{campaign.name}</p>
                <p className="mt-2 text-2xl font-semibold">{campaign.sent.toLocaleString()}</p>
                <Badge variant="success" className="mt-2">
                  {campaign.rate} delivered
                </Badge>
              </div>
            ))
          ) : (
             <div className="col-span-3 py-8 text-center text-sm text-muted-foreground">
              No active or completed campaigns found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
