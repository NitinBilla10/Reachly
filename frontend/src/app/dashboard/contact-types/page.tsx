'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Filter,
} from 'lucide-react'
import { contactTypesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ContactType {
  id: string
  name: string
  color: string
  description?: string
  _count?: {
    customers: number
  }
}

export default function ContactTypesPage() {
  const [contactTypes, setContactTypes] = useState<ContactType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContactType, setEditingContactType] = useState<ContactType | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: ''
  })

  useEffect(() => {
    fetchContactTypes()
  }, [])

  const fetchContactTypes = async () => {
    try {
      setLoading(true)
      const response = await contactTypesAPI.getAll()
      if (response.data.success) {
        setContactTypes(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch contact types:', error)
      toast.error('Failed to load contact types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingContactType) {
        const response = await contactTypesAPI.update(editingContactType.id, formData)
        if (response.data.success) {
          toast.success('Contact type updated successfully')
          setContactTypes(types =>
            types.map(t =>
              t.id === editingContactType.id ? response.data.data : t
            )
          )
        }
      } else {
        const response = await contactTypesAPI.create(formData)
        if (response.data.success) {
          toast.success('Contact type created successfully')
          setContactTypes([...contactTypes, response.data.data])
        }
      }
      closeDialog()
    } catch (error: any) {
      console.error('Failed to save contact type:', error)
      toast.error(error.response?.data?.error || 'Failed to save contact type')
    }
  }

  const handleEdit = (contactType: ContactType) => {
    setEditingContactType(contactType)
    setFormData({
      name: contactType.name,
      color: contactType.color,
      description: contactType.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact type?')) {
      return
    }

    try {
      await contactTypesAPI.delete(id)
      toast.success('Contact type deleted successfully')
      setContactTypes(types => types.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete contact type:', error)
      toast.error('Failed to delete contact type')
    }
  }

  const openDialog = () => {
    setEditingContactType(null)
    setFormData({
      name: '',
      color: '#6B7280',
      description: ''
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingContactType(null)
  }

  const filteredContactTypes = contactTypes.filter(ct =>
    ct.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contact Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage contact categories and classifications
          </p>
        </div>
        <Button onClick={openDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contactTypes.reduce((sum, ct) => sum + (ct._count?.customers || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contact types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" disabled>
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Contact Types Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading contact types...
        </div>
      ) : filteredContactTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No contact types found matching your search' : 'No contact types yet'}
            </p>
            {!searchTerm && (
              <Button onClick={openDialog} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Contact Type
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContactTypes.map((contactType) => (
            <Card key={contactType.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: contactType.color }}
                    />
                    <div className="flex-1">
                      <CardTitle>{contactType.name}</CardTitle>
                      {contactType.description && (
                        <CardDescription className="mt-1">
                          {contactType.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(contactType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(contactType.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{contactType._count?.customers || 0} contacts</span>
                  </div>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${contactType.color}20`, color: contactType.color }}
                  >
                    {contactType.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingContactType ? 'Edit Contact Type' : 'Create Contact Type'}
              </CardTitle>
              <CardDescription>
                {editingContactType
                  ? 'Update the contact type details'
                  : 'Add a new contact type for categorization'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., VIP, Lead, Customer"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-3">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <div className="flex-1 h-10 rounded-md border" style={{ backgroundColor: formData.color }}>
                      <span className="flex items-center justify-center h-full text-white font-medium">
                        {formData.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this contact type"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContactType ? 'Update' : 'Create'}
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
