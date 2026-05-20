import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97] transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-[var(--primary-hover)] hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 hover:shadow-md',
        success: 'bg-success text-success-foreground shadow-sm hover:opacity-90 hover:shadow-md',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:opacity-90 hover:shadow-md',
        outline: 'border border-border bg-card text-foreground shadow-sm hover:border-primary hover:text-primary hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-[10px] px-4 text-xs',
        lg: 'h-12 rounded-[16px] px-8 text-base',
        icon: 'h-9 w-9 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
