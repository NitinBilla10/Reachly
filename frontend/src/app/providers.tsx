'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

type ProvidersProps = {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              iconTheme: {
                primary: 'hsl(142, 76%, 36%)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(0, 84%, 60%)',
                secondary: 'white',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
