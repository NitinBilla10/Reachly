'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  FileImage,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { customersAPI, tagsAPI, contactTypesAPI } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import toast from 'react-hot-toast'

interface TagItem {
  id: string
  name: string
  color: string
}

interface ContactTypeItem {
  id: string
  name: string
  color: string
}

interface CustomerItem {
  id: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  tags: TagItem[]
  type?: {
    id: string
    name: string
    color: string
  } | null
  gender?: string
  company?: string
  source?: string
  optIn: boolean
  image?: string
  createdAt: string
  _count?: {
    messages: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [contactTypes, setContactTypes] = useState<ContactTypeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [filterOptIn, setFilterOptIn] = useState<boolean | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null)

  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    tags: [] as string[],
    typeId: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    company: '',
    source: '',
    optIn: true,
    image: '',
  })

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [tagsResponse, contactTypesResponse] = await Promise.all([
        tagsAPI.getAll(),
        contactTypesAPI.getAll(),
      ])
      setTags(tagsResponse.data.data || [])
      setContactTypes(contactTypesResponse.data.data || [])
      await fetchCustomers()
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const params: any = {
        search: search || undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        typeId: selectedTypeId || undefined,
        limit: 50,
      }

      if (filterOptIn !== null) {
        params.optIn = filterOptIn
      }

      const response = await customersAPI.getAll(params)
      setCustomers(response.data.data.customers || [])
      setError(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load customers.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers()
    }, 300)

    return () => clearTimeout(timeout)
  }, [search, selectedTagIds, selectedTypeId, filterOptIn])

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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await customersAPI.create({
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim() || undefined,
        notes: formState.notes.trim() || undefined,
        tags: formState.tags,
        typeId: formState.typeId || undefined,
        gender: formState.gender || undefined,
        company: formState.company.trim() || undefined,
        source: formState.source.trim() || undefined,
        optIn: formState.optIn,
        image: formState.image.trim() || undefined,
      })

      toast.success('Customer created successfully')
      setCustomers((prev) => [response.data.data, ...prev])
      closeDialog()
    } catch (err: any) {
      console.error('Failed to create customer:', err)
      toast.error(err?.response?.data?.error || 'Failed to create customer.')
    }
  }

  const handleEditCustomer = (customer: CustomerItem) => {
    setEditingCustomer(customer)
    setFormState({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
      tags: customer.tags.map((t) => t.id),
      typeId: customer.type?.id || '',
      gender: (customer.gender || '') as any,
      company: customer.company || '',
      source: customer.source || '',
      optIn: customer.optIn,
      image: customer.image || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      await customersAPI.delete(id)
      toast.success('Customer deleted successfully')
      setCustomers((customers) => customers.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete customer:', err)
      toast.error('Failed to delete customer.')
    }
  }

  const openDialog = () => {
    setEditingCustomer(null)
    setFormState({
      name: '',
      phone: '',
      email: '',
      notes: '',
      tags: [],
      typeId: '',
      gender: '',
      company: '',
      source: '',
      optIn: true,
      image: '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingCustomer(null)
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

  const selectedContactType = useMemo(
    () => contactTypes.find((ct) => ct.id === selectedTypeId),
    [contactTypes, selectedTypeId]
  )

  const clearFilters = () => {
    setSelectedTagIds([])
    setSelectedTypeId('')
    setFilterOptIn(null)
  }

  const hasActiveFilters = selectedTagIds.length > 0 || selectedTypeId !== '' || filterOptIn !== null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your contacts, segment with tags, and track interactions.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name, phone, email, company..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedTypeId || 'all'} onValueChange={(val) => setSelectedTypeId(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {contactTypes.map((ct) => (
                  <SelectItem key={ct.id} value={ct.id}>
                    {ct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterOptIn === null ? 'all' : filterOptIn.toString()}
              onValueChange={(val) => setFilterOptIn(val === 'all' ? null : val === 'true')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Opt-in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500 inline" />
                  Opted In
                </SelectItem>
                <SelectItem value="false">
                  <XCircle className="mr-2 h-4 w-4 text-red-500 inline" />
                  Opted Out
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            variant={selectedTagIds.length === 0 ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTagIds([])}
          >
            All Tags
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
              className="cursor-pointer"
              style={{
                backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
              }}
              onClick={() => toggleTagFilter(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground ml-2">
              Clear filters to see all customers
            </span>
          )}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Customer</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Opt-in</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No customers found.
                  {!hasActiveFilters && ' Add your first customer to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {customer.image ? (
                        <Avatar className="h-9 w-9">
                          <img src={customer.image} alt={customer.name} className="h-full w-full object-cover" />
                        </Avatar>
                      ) : (
                        <Avatar className="h-9 w-9 bg-primary">
                          <AvatarFallback className="text-xs font-medium">
                            {customer.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {customer.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.source && (
                      <Badge variant="outline" className="text-xs">
                        {customer.source}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.optIn ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.type && (
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: `${customer.type.color}20`, color: customer.type.color }}
                      >
                        {customer.type.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.length === 0 ? (
                        <Badge variant="outline" className="text-xs">No tags</Badge>
                      ) : (
                        customer.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                            {tag.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </CardTitle>
              <CardDescription>
                {editingCustomer
                  ? 'Update customer information'
                  : 'Add a new contact to your CRM'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCustomer} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 202 555 0123"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formState.gender} onValueChange={(val) => setFormState({ ...formState, gender: val as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Company Inc."
                      value={formState.company}
                      onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g., website, referral, import"
                      value={formState.source}
                      onChange={(e) => setFormState({ ...formState, source: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="typeId">Contact Type</Label>
                    <Select value={formState.typeId || 'none'} onValueChange={(val) => setFormState({ ...formState, typeId: val === 'none' ? '' : val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No type</SelectItem>
                        {contactTypes.map((ct) => (
                          <SelectItem key={ct.id} value={ct.id}>
                            {ct.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Profile Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        placeholder="https://..."
                        value={formState.image}
                        onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                      />
                      {formState.image && (
                        <Avatar className="h-9 w-9">
                          <img src={formState.image} alt="Preview" className="h-full w-full object-cover" />
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optIn">Marketing Opt-in</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="optIn"
                      checked={formState.optIn}
                      onCheckedChange={(checked) => setFormState({ ...formState, optIn: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formState.optIn
                        ? 'Customer has opted in to receive marketing messages'
                        : 'Customer has opted out of marketing messages'}
                      </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Important preferences, notes, or additional information about this customer..."
                    rows={4}
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assign Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No tags available. Create tags first to start segmenting customers.
                      </span>
                    ) : (
                      tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={formState.tags.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          style={{
                            backgroundColor: formState.tags.includes(tag.id) ? tag.color : undefined,
                          }}
                          onClick={() => toggleFormTag(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
