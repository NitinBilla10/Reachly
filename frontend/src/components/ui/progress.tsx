'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  color?: 'default' | 'success' | 'warning' | 'danger'
  showPercentage?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, color = 'default', showPercentage = true, ...props }, ref) => {
    const percentage = Math.round((value / max) * 100)

    return (
      <div
        ref={ref}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            color === 'default' && 'bg-primary',
            color === 'success' && 'bg-green-500',
            color === 'warning' && 'bg-yellow-500',
            color === 'danger' && 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
        {showPercentage && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium">
            {percentage}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
