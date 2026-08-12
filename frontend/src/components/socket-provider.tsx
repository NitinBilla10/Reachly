'use client'

import { useEffect } from 'react'
import { useSocket } from '@/lib/socket'

export function SocketProvider() {
  const socketClient = useSocket()

  useEffect(() => {
    socketClient.connect()
    
    return () => {
      socketClient.disconnect()
    }
  }, [socketClient])

  return null
}
