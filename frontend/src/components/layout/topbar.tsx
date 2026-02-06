'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'

export function Topbar() {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="text-sm font-medium text-muted-foreground">
        Welcome back
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Avatar>
          <AvatarFallback>RJ</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
