'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.register(formData)
      if (response.data.success) {
        toast.success('Account created successfully!')
        Cookies.set('auth-token', response.data.data.token, { expires: 7 })
        router.push('/dashboard')
      }
    } catch (error: any) {
      const data = error.response?.data
      let message = data?.error || 'Failed to create account'
      
      // If it's a validation error with details from Zod, show the first detail message
      if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
        message = data.details[0].message
      }
      
      // Prevent raw database errors from showing up in the UI (e.g., Prisma connection errors which are 500s)
      if (error.response?.status >= 500) {
        message = 'A server error occurred. Please make sure your database is connected.'
      } else if (!error.response) {
        message = 'Could not connect to the server.'
      }
      
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create your workspace</CardTitle>
        <CardDescription>Start managing WhatsApp campaigns in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="Riya" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Kapoor" 
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Work email</Label>
            <Input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="you@company.com" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Create a strong password" 
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label>Company name (Optional)</Label>
            <Input placeholder="Reachly Labs" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
