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

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.login(formData)
      if (response.data.success) {
        toast.success('Logged in successfully!')
        Cookies.set('auth-token', response.data.data.token, { expires: 7 })
        router.push('/dashboard')
      }
    } catch (error: any) {
      const data = error.response?.data
      let message = data?.error || 'Invalid email or password'
      
      // Prevent raw database errors from showing up in the UI
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Reachly workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
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
              placeholder="••••••••" 
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Forgot password?</span>
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
