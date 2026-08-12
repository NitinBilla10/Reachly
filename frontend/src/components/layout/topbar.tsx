'use client'

import { useEffect, useState } from 'react'
import { Bell, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { settingsAPI } from '@/lib/api'
import { MobileNav } from './mobile-nav'

export function Topbar() {
  const [profile, setProfile] = useState<{
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await settingsAPI.getProfile()
        if (response.data?.data?.user) {
          setProfile(response.data.data.user)
        }
      } catch (error) {
        console.error('Failed to load profile in topbar:', error)
      }
    }
    loadProfile()
  }, [])

  const getInitials = () => {
    if (!profile) return ''
    const first = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : ''
    const last = profile.lastName ? profile.lastName.charAt(0).toUpperCase() : ''
    return `${first}${last}` || 'U'
  }

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center">
        <MobileNav />
        <div className="text-sm font-medium text-muted-foreground hidden md:block">
          Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Avatar>
          {profile?.profileImage && <AvatarImage src={profile.profileImage} alt="Profile" />}
          <AvatarFallback>
            {profile ? getInitials() : <UserCircle className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
