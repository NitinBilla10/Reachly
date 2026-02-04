'use client'

import { Plus, Tag, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const tags = [
  {
    name: 'VIP',
    description: 'High-value customers with priority support',
    count: 128,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    name: 'Leads',
    description: 'New prospects from recent campaigns',
    count: 420,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    name: 'Paid',
    description: 'Customers with completed purchases',
    count: 312,
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    name: 'Churn Risk',
    description: 'Customers requiring follow-up',
    count: 64,
    color: 'bg-amber-500/10 text-amber-600',
  },
]

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tags</h1>
          <p className="text-muted-foreground">
            Segment your customers and target campaigns with tags.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create tag
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {tag.name}
                </span>
                <Badge className={tag.color}>{tag.count} customers</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{tag.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  {tag.count} active
                </span>
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
