'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { campaignsAPI, tagsAPI, templatesAPI } from '@/lib/api'

interface TagItem {
  id: string
  name: string
}

interface TemplateItem {
  id: string
  name: string
  content: string
}

interface CampaignItem {
  id: string
  name: string
  status: string
  totalMessages: number
  sentMessages: number
  template?: TemplateItem
  createdAt: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [formState, setFormState] = useState({
    name: '',
    description: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [campaignResponse, tagResponse, templateResponse] = await Promise.all([
        campaignsAPI.getAll(),
        tagsAPI.getAll(),
        templatesAPI.getAll(),
      ])
      setCampaigns(campaignResponse.data.data)
      setTags(tagResponse.data.data)
      setTemplates(templateResponse.data.data)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to load campaigns.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  )

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleCreateCampaign = async (sendNow: boolean) => {
    if (!formState.name.trim() || !selectedTemplateId || selectedTagIds.length === 0) {
      setError('Campaign name, template, and at least one tag are required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await campaignsAPI.create({
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        templateId: selectedTemplateId,
        tagIds: selectedTagIds,
      })

      const newCampaign = response.data.data
      setCampaigns((prev) => [newCampaign, ...prev])

      if (sendNow) {
        await campaignsAPI.send(newCampaign.id, { tagIds: selectedTagIds })
        await fetchData()
      }

      setFormState({ name: '', description: '' })
      setSelectedTemplateId('')
      setSelectedTagIds([])
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to create campaign.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusVariant = (status: string) => {
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'destructive'
    if (status === 'sending') return 'warning'
    return 'secondary'
  }

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
              <Input
                placeholder="Spring promotion"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional details for internal tracking"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Select template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <Badge variant="outline">No tags available</Badge>
                ) : (
                  tags.map((tag) => (
                    <Button
                      key={tag.id}
                      type="button"
                      variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Button>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preview message</Label>
              <Textarea
                placeholder="Choose a template to preview its content"
                className="min-h-[120px]"
                value={selectedTemplate?.content || ''}
                readOnly
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateCampaign(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save draft'}
              </Button>
              <Button onClick={() => handleCreateCampaign(true)} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Create & send'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No campaigns yet. Create one to reach your audience.
              </p>
            ) : (
              campaigns.map((campaign) => {
                const progress = campaign.totalMessages
                  ? Math.round((campaign.sentMessages / campaign.totalMessages) * 100)
                  : 0
                return (
                  <div key={campaign.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{campaign.name}</p>
                      <Badge variant={statusVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Template: {campaign.template?.name || '—'}
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={progress} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {campaign.sentMessages} / {campaign.totalMessages} sent
                        </span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Campaigns will appear here once created.
            </p>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.template?.name || 'No template'} ·{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                    }).format(new Date(campaign.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
                  <Badge variant="outline">
                    {campaign.sentMessages}/{campaign.totalMessages} sent
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
