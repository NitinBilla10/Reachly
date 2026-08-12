'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Search, UserCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { messagesAPI } from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const res = await messagesAPI.getConversations()
      if (res.data.data && Array.isArray(res.data.data)) {
        setConversations(res.data.data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (id: string) => {
    try {
      const res = await messagesAPI.getConversationMessages(id, { limit: 50 })
      if (res.data.data && Array.isArray(res.data.data)) {
        setMessages(res.data.data.reverse()) // Reverse so oldest is top, newest is bottom
      }
      // Also mark conversation as read
      // messagesAPI.markAsRead(...) could be called here if implemented for conversations
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeConversationId) return

    try {
      setIsSending(true)
      const res = await messagesAPI.send({
        conversationId: activeConversationId,
        content: replyText.trim(),
        messageType: 'text'
      })

      // Add new message instantly to UI
      setMessages([...messages, res.data.data])
      setReplyText('')
      
      // Update last message in conversation list
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            lastMessage: res.data.data,
            updatedAt: new Date().toISOString()
          }
        }
        return c
      }))
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error.response?.data?.error || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Conversations List */}
      <Card className="flex h-[calc(100vh-160px)] flex-col">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search conversations" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer ${activeConversationId === chat.id ? 'bg-muted/50' : ''}`}
                  onClick={() => setActiveConversationId(chat.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                    {chat.customer?.name
                      ? chat.customer.name.split(' ').map((part: string) => part[0]).join('')
                      : <UserCircle2 className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate">{chat.customer?.name || chat.customer?.phone || 'Unknown'}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {chat.updatedAt ? format(new Date(chat.updatedAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && <Badge variant="success" className="shrink-0">{chat.unreadCount}</Badge>}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No active conversations
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Message Thread */}
      <Card className="flex h-[calc(100vh-160px)] flex-col">
        {activeConversation ? (
          <>
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{activeConversation.customer?.name || activeConversation.customer?.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeConversation.customer?.phone}
                  </p>
                </div>
                {activeConversation.customer?.tags?.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined, color: tag.color }}>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => {
                    // Outbound = Agent, Inbound = Customer
                    const isAgent = message.direction === 'outbound'
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isAgent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <span className="mt-1 block text-[10px] opacity-70">
                            {format(new Date(message.createdAt), 'hh:mm a')}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground py-10">
                    No messages in this conversation yet.
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form 
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              >
                <Input 
                  placeholder="Type a message..." 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSending}
                />
                <Button size="icon" type="submit" disabled={isSending || !replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </Card>
    </div>
  )
}
