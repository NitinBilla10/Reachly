'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Send, 
  Plus, 
  Loader2, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Play,
  Pause,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { campaignsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  totalMessages: number
  sentMessages: number
  deliveredMessages: number
  readMessages: number
  failedMessages: number
  scheduledAt?: string
  createdAt: string
  template?: { name: string; category: string }
  targetTags?: { id: string; name: string; color: string }[]
}

const statusConfig = {
  draft: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Scheduled' },
  sending: { icon: Play, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Sending' },
  completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
  cancelled: { icon: Pause, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Cancelled' },
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setIsLoading(true)
      const response = await campaignsAPI.getAll()
      setCampaigns(response.data.data.campaigns)
    } catch (error) {
      toast.error('Failed to load campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (id: string) => {
    try {
      await campaignsAPI.send(id, { tagIds: [] })
      toast.success('Campaign is being sent')
      loadCampaigns()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send campaign')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await campaignsAPI.cancel(id)
      toast.success('Campaign cancelled')
      loadCampaigns()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel campaign')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await campaignsAPI.delete(id)
      toast.success('Campaign deleted successfully')
      loadCampaigns()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete campaign')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage bulk messaging campaigns
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/campaigns/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            All Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No campaigns yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Create your first campaign to start sending bulk messages to your customers.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/campaigns/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft
                const StatusIcon = status.icon
                const progress = campaign.totalMessages > 0 
                  ? (campaign.sentMessages / campaign.totalMessages) * 100 
                  : 0

                return (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg}`}>
                            <StatusIcon className={`h-3 w-3 ${status.color}`} />
                            <span className={status.color}>{status.label}</span>
                          </div>
                          {campaign.template && (
                            <Badge variant="outline" className="text-xs">
                              {campaign.template.name}
                            </Badge>
                          )}
                        </div>
                        {campaign.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {campaign.description}
                          </p>
                        )}
                        {campaign.targetTags && campaign.targetTags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {campaign.targetTags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {campaign.status === 'sending' && (
                          <div className="mt-3">
                            <Progress value={progress} className="h-2" />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {campaign.sentMessages} of {campaign.totalMessages} sent ({Math.round(progress)}%)
                            </p>
                          </div>
                        )}
                        {campaign.status === 'completed' && (
                          <div className="mt-3 flex gap-4 text-sm">
                            <span className="text-emerald-600">
                              ✓ {campaign.deliveredMessages} delivered
                            </span>
                            <span className="text-blue-600">
                              ✓ {campaign.readMessages} read
                            </span>
                            {campaign.failedMessages > 0 && (
                              <span className="text-red-600">
                                ✗ {campaign.failedMessages} failed
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="ml-4">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleSend(campaign.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Send Now
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
                            <DropdownMenuItem onClick={() => handleCancel(campaign.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
