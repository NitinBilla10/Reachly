'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user already dismissed or installed
    if (localStorage.getItem('pwaPromptDismissed') === 'true') {
      return
    }
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwaPromptDismissed', 'true')
    setShowPrompt(false)
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt')
    } else {
      console.log('User dismissed the A2HS prompt')
    }
    
    // We no longer need the prompt. Clear it up.
    localStorage.setItem('pwaPromptDismissed', 'true')
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-primary text-primary-foreground p-4 rounded-xl shadow-2xl z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-1">
            <img src="/icons/icon-192x192.png" alt="Reachly Icon" className="w-full h-full rounded-md object-contain" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Install Reachly App</h3>
            <p className="text-xs text-primary-foreground/80">Add to homescreen for the best experience.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-6 w-6 rounded-full hover:bg-white/20 text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Button onClick={handleInstallClick} className="w-full bg-white text-primary hover:bg-gray-100 flex items-center gap-2">
        <Download className="h-4 w-4" />
        Install Now
      </Button>
    </div>
  )
}
