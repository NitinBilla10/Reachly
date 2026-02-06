'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { templatesAPI } from '@/lib/api'

interface TemplateItem {
  id: string
  name: string
  category: 'marketing' | 'utility' | 'authentication'
  content: string
  status: string
  variables?: string[] | null
  language?: string
}

const categoryOptions: Array<TemplateItem['category']> = [
  'marketing',
  'utility',
  'authentication',
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    name: '',
    category: 'marketing' as TemplateItem['category'],
    language: 'en_US',
    content: '',
  })
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({})
  const [previewResult, setPreviewResult] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await templatesAPI.getAll()
      setTemplates(response.data.data)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load templates.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (!previewTemplateId) {
      setPreviewVariables({})
      setPreviewResult(null)
      setPreviewError(null)
    }
  }, [previewTemplateId])

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === editingTemplateId) || null,
    [editingTemplateId, templates]
  )

  useEffect(() => {
    if (activeTemplate) {
      setFormState({
        name: activeTemplate.name,
        category: activeTemplate.category,
        language: activeTemplate.language || 'en_US',
        content: activeTemplate.content,
      })
    } else {
      setFormState({
        name: '',
        category: 'marketing',
        language: 'en_US',
        content: '',
      })
    }
  }, [activeTemplate])

  const handleSubmit = async () => {
    if (!formState.name.trim() || !formState.content.trim()) {
      setError('Template name and content are required.')
      return
    }

    try {
      setIsSubmitting(true)
      if (editingTemplateId) {
        const response = await templatesAPI.update(editingTemplateId, {
          name: formState.name.trim(),
          category: formState.category,
          language: formState.language.trim() || 'en_US',
          content: formState.content.trim(),
        })
        setTemplates((prev) =>
          prev.map((template) =>
            template.id === editingTemplateId ? response.data.data : template
          )
        )
      } else {
        const response = await templatesAPI.create({
          name: formState.name.trim(),
          category: formState.category,
          language: formState.language.trim() || 'en_US',
          content: formState.content.trim(),
        })
        setTemplates((prev) => [response.data.data, ...prev])
      }
      setEditingTemplateId(null)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to save template.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = async () => {
    if (!previewTemplateId) return

    try {
      setPreviewError(null)
      const response = await templatesAPI.preview(previewTemplateId, previewVariables)
      setPreviewResult(response.data.data.previewContent)
    } catch (err: any) {
      setPreviewError(err?.response?.data?.error || 'Preview failed.')
    }
  }

  const previewTemplate = templates.find((template) => template.id === previewTemplateId) || null
  const previewKeys = previewTemplate?.variables || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-muted-foreground">
            Build WhatsApp templates with variables and categories.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              {editingTemplateId ? 'Edit template' : 'New template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="Order Confirmation"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formState.category}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      category: value as TemplateItem['category'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-language">Language</Label>
                <Input
                  id="template-language"
                  placeholder="en_US"
                  value={formState.language}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, language: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Template content</Label>
              <Textarea
                id="template-content"
                placeholder="Hi {{name}}, your order {{order_id}} is confirmed."
                className="min-h-[140px]"
                value={formState.content}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, content: event.target.value }))
                }
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? editingTemplateId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingTemplateId
                  ? 'Save changes'
                  : 'Create template'}
              </Button>
              {editingTemplateId && (
                <Button variant="ghost" onClick={() => setEditingTemplateId(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Template preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewTemplate ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{previewTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {previewTemplate.content}
                  </p>
                </div>
                {previewKeys.length > 0 ? (
                  <div className="space-y-3">
                    {previewKeys.map((key) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={`preview-${key}`}>{key}</Label>
                        <Input
                          id={`preview-${key}`}
                          value={previewVariables[key] || ''}
                          onChange={(event) =>
                            setPreviewVariables((prev) => ({
                              ...prev,
                              [key]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This template has no variables to replace.
                  </p>
                )}
                {previewError && (
                  <p className="text-sm text-destructive">{previewError}</p>
                )}
                <Button onClick={handlePreview}>Generate preview</Button>
                {previewResult && (
                  <Card className="border-dashed p-4">
                    <p className="text-sm font-medium">Preview output</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {previewResult}
                    </p>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a template to preview the message with variables.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <Card className="border-dashed p-6 text-sm text-muted-foreground">
            No templates yet. Create one to start building campaigns.
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {template.name}
                  </CardTitle>
                  <Badge
                    variant={template.status === 'approved' ? 'success' : 'warning'}
                  >
                    {template.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{template.category}</Badge>
                  {template.variables && template.variables.length > 0 && (
                    <Badge variant="outline">{template.variables.length} vars</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{template.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplateId(template.id)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplateId(template.id)}
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
