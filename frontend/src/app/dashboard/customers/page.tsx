'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { customersAPI, tagsAPI } from '@/lib/api'

interface TagItem {
  id: string
  name: string
  color: string
}

interface CustomerItem {
  id: string
  name: string
  phone: string
  email?: string | null
  tags: TagItem[]
  createdAt: string
  _count?: {
    messages: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    tags: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTags = async () => {
    try {
      const response = await tagsAPI.getAll()
      setTags(response.data.data)
    } catch (err) {
      setTags([])
    }
  }

  const fetchCustomers = async (query: string, tagIds: string[]) => {
    try {
      setIsLoading(true)
      const response = await customersAPI.getAll({
        search: query || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        limit: 50,
      })
      setCustomers(response.data.data.customers)
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load customers.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers(search, selectedTagIds)
    }, 300)

    return () => clearTimeout(timeout)
  }, [search, selectedTagIds])

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const toggleFormTag = (tagId: string) => {
    setFormState((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }))
  }

  const handleCreateCustomer = async () => {
    if (!formState.name.trim() || !formState.phone.trim()) {
      setError('Customer name and phone number are required.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await customersAPI.create({
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim() || undefined,
        notes: formState.notes.trim() || undefined,
        tags: formState.tags,
      })
      setCustomers((prev) => [response.data.data, ...prev])
      setFormState({
        name: '',
        phone: '',
        email: '',
        notes: '',
        tags: [],
      })
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to create customer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoDate))

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your CRM and segment contacts with tags.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4 text-primary" />
          Add customer details
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Full name</Label>
            <Input
              id="customer-name"
              placeholder="Ava Thompson"
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone number</Label>
            <Input
              id="customer-phone"
              placeholder="+1 202 555 0192"
              value={formState.phone}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email address</Label>
            <Input
              id="customer-email"
              placeholder="ava@brightagency.io"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-notes">Notes</Label>
            <Textarea
              id="customer-notes"
              placeholder="Important preferences or notes about this customer"
              value={formState.notes}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>Assign tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                Create tags to start tagging customers.
              </span>
            ) : (
              tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={formState.tags.includes(tag.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFormTag(tag.id)}
                >
                  {tag.name}
                </Button>
              ))
            )}
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button className="mt-4" onClick={handleCreateCustomer} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save customer'}
        </Button>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, phone, or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedTagIds.length === 0 ? 'secondary' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTagIds([])}
            >
              All
            </Badge>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTagFilter(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
        {selectedTags.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Filtering by: {selectedTags.map((tag) => tag.name).join(', ')}
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  No customers found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.length === 0 ? (
                        <Badge variant="outline">No tags</Badge>
                      ) : (
                        customer.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>{customer._count?.messages ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
