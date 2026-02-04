'use client'

import { Send, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

const conversations = [
  {
    name: 'Ava Thompson',
    lastMessage: 'Sure, I would love the new catalog.',
    time: '2m',
    unread: 2,
  },
  {
    name: 'Liam Patel',
    lastMessage: 'Can you share delivery details?',
    time: '45m',
    unread: 0,
  },
  {
    name: 'Sofia Gomez',
    lastMessage: 'Thank you! The order arrived today.',
    time: '1h',
    unread: 0,
  },
  {
    name: 'Noah Lee',
    lastMessage: 'I am interested in the VIP program.',
    time: '3h',
    unread: 1,
  },
]

const messages = [
  {
    id: 1,
    sender: 'customer',
    content: 'Hi! I saw your new launch on WhatsApp.',
    time: '09:12 AM',
  },
  {
    id: 2,
    sender: 'agent',
    content: 'Hi Ava! Thanks for reaching out. Would you like the catalog?',
    time: '09:13 AM',
  },
  {
    id: 3,
    sender: 'customer',
    content: 'Yes please, I am interested in wholesale pricing.',
    time: '09:14 AM',
  },
]

export default function InboxPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex h-[calc(100vh-160px)] flex-col">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search conversations" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {conversations.map((chat) => (
              <div key={chat.name} className="flex items-start gap-3 p-4 hover:bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                  {chat.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{chat.name}</p>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && <Badge variant="success">{chat.unread}</Badge>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex h-[calc(100vh-160px)] flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Ava Thompson</p>
              <p className="text-xs text-muted-foreground">Last seen 5 minutes ago</p>
            </div>
            <Badge variant="secondary">VIP</Badge>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    message.sender === 'agent'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="mt-1 block text-[10px] opacity-70">{message.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Type a message" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
