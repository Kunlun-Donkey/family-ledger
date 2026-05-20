import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[15px] shadow-[var(--shadow-sm)] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(109,139,116,0.15)] hover:border-primary/50 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
