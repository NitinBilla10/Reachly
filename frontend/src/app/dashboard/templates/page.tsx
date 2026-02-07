'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquareText, 
  Plus, 
  Loader2, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Copy
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
import { templatesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  category: string
  language: string
  content: string
  status: string
  variables?: string[]
  createdAt: string
}

const statusConfig = {
  draft: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Draft' },
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejected' },
}

const categoryConfig = {
  marketing: { color: 'bg-blue-500', label: 'Marketing' },
  utility: { color: 'bg-purple-500', label: 'Utility' },
  authentication: { color: 'bg-orange-500', label: 'Authentication' },
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await templatesAPI.getAll()
      setTemplates(response.data.data)
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await templatesAPI.delete(id)
      toast.success('Template deleted successfully')
      loadTemplates()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete template')
    }
  }

  const extractVariables = (content: string) => {
    const matches = content.match(/{{(\w+)}}/g) || []
    return matches.map(m => m.replace(/[{}]/g, ''))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Message Templates</h1>
          <p className="text-muted-foreground">
            Create and manage WhatsApp message templates
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            All Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No templates yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Create message templates for your campaigns and quick replies.
              </p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => {
                const status = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.draft
                const category = categoryConfig[template.category as keyof typeof categoryConfig] || { color: 'bg-gray-500', label: template.category }
                const StatusIcon = status.icon
                const variables = extractVariables(template.content)

                return (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {template.language}
                        </Badge>
                        <Badge className={`${category.color} text-white text-xs`}>
                          {category.label}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg}`}>
                          <StatusIcon className={`h-3 w-3 ${status.color}`} />
                          <span className={status.color}>{status.label}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      {variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {variables.map((variable, index) => (
                            <code key={index} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {'{{'}{variable}{'}}'}
                            </code>
                          ))}
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
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/${template.id}`)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/${template.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {template.status === 'draft' && (
                          <DropdownMenuItem onClick={() => templatesAPI.sync(template.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Sync with WhatsApp
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
