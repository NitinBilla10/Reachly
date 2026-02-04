'use client'

import { Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const templates = [
  {
    name: 'Order Confirmation',
    category: 'Utility',
    content: 'Hi {{name}}, your order {{order_id}} is confirmed and will ship soon.',
    status: 'Approved',
  },
  {
    name: 'Weekly Promo',
    category: 'Marketing',
    content: 'Hello {{name}}, enjoy 20% off with code WEEKLY20. Offer ends Sunday!',
    status: 'Pending',
  },
  {
    name: 'Appointment Reminder',
    category: 'Utility',
    content: 'Reminder: your appointment is scheduled for {{date}} at {{time}}.',
    status: 'Approved',
  },
]

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-muted-foreground">
            Build WhatsApp templates with variables and categories.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New template
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.name}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {template.name}
                </CardTitle>
                <Badge variant={template.status === 'Approved' ? 'success' : 'warning'}>
                  {template.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{template.category}</Badge>
                <Badge variant="outline">Variables</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{template.content}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  Preview
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
