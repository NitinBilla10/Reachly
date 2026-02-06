'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create your workspace</CardTitle>
        <CardDescription>Start managing WhatsApp campaigns in minutes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input placeholder="Riya" />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input placeholder="Kapoor" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Work email</Label>
          <Input type="email" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" placeholder="Create a strong password" />
        </div>
        <div className="space-y-2">
          <Label>Company name</Label>
          <Input placeholder="Reachly Labs" />
        </div>
        <Button className="w-full">Create account</Button>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
