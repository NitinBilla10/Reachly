'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { settingsAPI, messagesAPI } from '@/lib/api'
import { MobileNav } from './mobile-nav'
import socketClient from '@/lib/socket'
import Link from 'next/link'

export function Topbar() {
  const [profile, setProfile] = useState<{
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  } | null>(null)
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    
    const loadNotifications = async () => {
      try {
        const [countRes, convRes] = await Promise.all([
          messagesAPI.getUnreadCount().catch(() => ({ data: { data: 0 } })),
          messagesAPI.getConversations().catch(() => ({ data: { data: [] } }))
        ])
        setUnreadCount(countRes.data?.data || 0)
        setRecentConversations((convRes.data?.data || []).slice(0, 5))
      } catch (error) {
        console.error('Failed to load notifications')
      }
    }
    loadNotifications()

    const handleNewMessage = (msg: any) => {
      if (msg.direction === 'inbound') {
        setUnreadCount(prev => prev + 1)
      }
    }

    socketClient.on('message_received', handleNewMessage)
    
    return () => {
      socketClient.off('message_received', handleNewMessage)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border bg-popover text-popover-foreground shadow-md z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentConversations.length > 0 ? (
                  recentConversations.map(conv => (
                    <Link 
                      href={`/dashboard/inbox?id=${conv.id}`} 
                      key={conv.id}
                      onClick={() => setShowNotifications(false)}
                      className="block px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">{conv.customer?.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                           {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conv.messages?.[0]?.content || 'Open to view conversation'}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No recent notifications
                  </div>
                )}
              </div>
              <div className="border-t p-2">
                <Link 
                  href="/dashboard/inbox"
                  onClick={() => setShowNotifications(false)}
                >
                  <Button variant="ghost" className="w-full text-xs h-8">
                    View all in Inbox
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
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
