'use client'

import { useState, useEffect } from 'react'
import { Inbox, Loader2, Search, Send, Phone, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { messagesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { getInitials, formatRelativeTime } from '@/lib/utils'

interface Conversation {
  id: string
  customer: {
    id: string
    name: string
    phone: string
    profileImage?: string
  }
  unreadCount: number
  lastMessageAt: string
  status: string
  isPinned: boolean
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const response = await messagesAPI.getConversations()
      setConversations(response.data.data.conversations)
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Shared Inbox</h1>
          <p className="text-muted-foreground">
            Manage conversations with your customers
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto h-[calc(100%-5rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No conversations yet</h3>
                <p className="text-muted-foreground text-sm">
                  Conversations will appear here when customers message you.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      conversation.unreadCount > 0 ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.customer.profileImage} />
                      <AvatarFallback>{getInitials(conversation.customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.customer.name}</p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.customer.phone}
                      </p>
                    </div>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Select a conversation</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose a customer from the list to start chatting
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Phone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">WhatsApp Inbox</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Your WhatsApp conversations will appear here. Connect your WhatsApp Business API to start receiving messages.
              </p>
              <Button className="mt-4" variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Start New Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
