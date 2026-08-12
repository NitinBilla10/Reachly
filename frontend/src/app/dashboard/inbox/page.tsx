'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Search, UserCircle2, ArrowLeft, MessageSquarePlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { messagesAPI, customersAPI, templatesAPI } from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useSocket, SocketMessage } from '@/lib/socket'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [customers, setCustomers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [newMessageCustomerId, setNewMessageCustomerId] = useState('')
  const [newMessageTemplateId, setNewMessageTemplateId] = useState('')
  const [isStartingChat, setIsStartingChat] = useState(false)

  const socketClient = useSocket()

  useEffect(() => {
    fetchConversations()
    fetchCustomersAndTemplates()
  }, [])

  useEffect(() => {
    if (activeConversationId) {
      setMessages([]) // Clear messages when switching conversations
      fetchMessages(activeConversationId)
      // Tell socket we joined this conversation
      socketClient.joinConversation(activeConversationId)
    }

    return () => {
      if (activeConversationId) {
        socketClient.leaveConversation(activeConversationId)
      }
    }
  }, [activeConversationId])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Real-time Socket Event Listeners
  useEffect(() => {
    const handleNewMessage = (newMessage: SocketMessage) => {
      // If message belongs to active chat, append it to view
      if (newMessage.conversationId === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      }
      
      // Always update conversation list
      setConversations((prev) => 
        prev.map(c => {
          if (c.id === newMessage.conversationId) {
            return {
              ...c,
              lastMessage: newMessage,
              updatedAt: new Date().toISOString(),
              unreadCount: newMessage.conversationId === activeConversationId ? 0 : (c.unreadCount + 1)
            }
          }
          return c
        })
      )
    }

    const handleMessageStatus = (data: { messageId: string, status: string }) => {
      setMessages((prev) => 
        prev.map(m => m.id === data.messageId ? { ...m, status: data.status } : m)
      )
    }

    socketClient.on('message_received', handleNewMessage)
    socketClient.on('message_status_updated', handleMessageStatus)

    return () => {
      socketClient.off('message_received', handleNewMessage)
      socketClient.off('message_status_updated', handleMessageStatus)
    }
  }, [socketClient, activeConversationId])

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

  const fetchCustomersAndTemplates = async () => {
    try {
      const [custRes, tempRes] = await Promise.all([
        customersAPI.getAll({ limit: 1000 }),
        templatesAPI.getAll()
      ])
      if (custRes.data.data?.customers) setCustomers(custRes.data.data.customers)
      if (tempRes.data.data) setTemplates(tempRes.data.data)
    } catch (error) {
      console.error('Failed to load customers or templates:', error)
    }
  }

  const fetchMessages = async (id: string) => {
    try {
      const res = await messagesAPI.getConversationMessages(id, { limit: 50 })
      if (res.data.data && Array.isArray(res.data.data.messages)) {
        // The backend already reverses it to chronological order
        setMessages(res.data.data.messages)
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

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessageCustomerId || !newMessageTemplateId) return

    try {
      setIsStartingChat(true)
      const selectedTemplate = templates.find(t => t.id === newMessageTemplateId)
      
      const res = await messagesAPI.send({
        customerId: newMessageCustomerId,
        content: selectedTemplate?.content || '',
        messageType: 'template',
        templateId: newMessageTemplateId
      })

      // Refresh conversations to get the new or updated conversation
      await fetchConversations()
      
      // Set the active conversation to the newly created/updated one
      setActiveConversationId(res.data.data.conversationId)
      setIsNewMessageDialogOpen(false)
      setNewMessageCustomerId('')
      setNewMessageTemplateId('')
      toast.success('Conversation started successfully')
    } catch (error: any) {
      console.error('Failed to start chat:', error)
      toast.error(error.response?.data?.error || 'Failed to start chat')
    } finally {
      setIsStartingChat(false)
    }
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Conversations List */}
      <Card className={`flex h-[calc(100vh-160px)] lg:h-[calc(100vh-160px)] flex-col ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="border-b p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search conversations" />
            </div>
            <Button size="icon" variant="outline" onClick={() => setIsNewMessageDialogOpen(true)}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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
      <Card className={`flex h-[calc(100vh-160px)] flex-col ${!activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setActiveConversationId(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold truncate">{activeConversation.customer?.name || activeConversation.customer?.phone}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activeConversation.customer?.phone}
                      </p>
                    </div>
                    {activeConversation.customer?.tags?.map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="hidden sm:inline-flex" style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
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

      {/* New Message Dialog */}
      {isNewMessageDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-semibold">Start New Chat</h3>
                <p className="text-xs text-muted-foreground">Select a customer and a template</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsNewMessageDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto">
              <form id="new-chat-form" onSubmit={handleStartNewChat} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newMessageCustomerId}
                    onChange={(e) => setNewMessageCustomerId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp Template</label>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newMessageTemplateId}
                    onChange={(e) => setNewMessageTemplateId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {newMessageTemplateId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preview</label>
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {templates.find(t => t.id === newMessageTemplateId)?.content || ''}
                    </div>
                  </div>
                )}
              </form>
            </div>
            <div className="border-t p-4 flex justify-end gap-2 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setIsNewMessageDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="new-chat-form" disabled={isStartingChat || !newMessageCustomerId || !newMessageTemplateId}>
                {isStartingChat ? 'Sending...' : 'Start Chat'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
