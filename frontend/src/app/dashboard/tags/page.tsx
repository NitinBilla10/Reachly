'use client'

import { useEffect, useState } from 'react'
import { Plus, Tag, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { tagsAPI } from '@/lib/api'

interface TagItem {
  id: string
  name: string
  description?: string | null
  color: string
  _count?: {
    customers: number
  }
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })

  const fetchTags = async () => {
    try {
      setIsLoading(true)
      const response = await tagsAPI.getAll()
      setTags(response.data.data)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load tags.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const handleCreateTag = async () => {
    if (!formState.name.trim()) {
      setError('Tag name is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await tagsAPI.create({
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        color: formState.color,
      })
      setTags((prev) => [response.data.data, ...prev])
      setFormState({
        name: '',
        description: '',
        color: '#3B82F6',
      })
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to create tag.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tags</h1>
          <p className="text-muted-foreground">
            Segment your customers and target campaigns with tags.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Create tag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag name</Label>
              <Input
                id="tag-name"
                placeholder="VIP"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-color">Tag color</Label>
              <Input
                id="tag-color"
                type="color"
                value={formState.color}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, color: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-description">Description</Label>
            <Textarea
              id="tag-description"
              placeholder="High-value customers with priority support"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleCreateTag} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create tag'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tags...</p>
        ) : tags.length === 0 ? (
          <Card className="border-dashed p-6 text-sm text-muted-foreground">
            No tags yet. Create your first tag to start segmenting customers.
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {tag.name}
                  </span>
                  <Badge
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                    variant="outline"
                  >
                    {tag._count?.customers ?? 0} customers
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tag.description || 'No description added yet.'}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {tag._count?.customers ?? 0} active
                  </span>
                  <Badge variant="secondary">{tag.color}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
