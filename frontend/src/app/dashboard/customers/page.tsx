'use client'

import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const customers = [
  {
    name: 'Ava Thompson',
    phone: '+1 202 555 0192',
    email: 'ava@brightagency.io',
    tags: ['VIP', 'Wholesale'],
    lastContact: '2 hours ago',
  },
  {
    name: 'Liam Patel',
    phone: '+44 7700 900485',
    email: 'liam@shopkind.com',
    tags: ['Lead'],
    lastContact: 'Yesterday',
  },
  {
    name: 'Sofia Gomez',
    phone: '+52 55 1234 5678',
    email: 'sofia@glowup.mx',
    tags: ['Paid', 'Repeat'],
    lastContact: '3 days ago',
  },
  {
    name: 'Noah Lee',
    phone: '+91 98765 43210',
    email: 'noah@launchpad.in',
    tags: ['Trial'],
    lastContact: '1 week ago',
  },
]

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your CRM and segment contacts with tags.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, phone, or tag" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">All</Badge>
            <Badge variant="outline">VIP</Badge>
            <Badge variant="outline">Leads</Badge>
            <Badge variant="outline">Paid</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Last contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.email}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{customer.lastContact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
