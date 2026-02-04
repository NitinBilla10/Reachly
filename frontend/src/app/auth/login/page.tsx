'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Reachly workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <Button className="w-full">Sign in</Button>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Forgot password?</span>
          <Link href="/auth/signup" className="text-primary hover:underline">
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
