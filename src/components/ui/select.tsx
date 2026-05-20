import * as React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-[14px] border border-input bg-card px-4 py-2 text-[15px] shadow-[var(--shadow-sm)] focus:outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(109,139,116,0.15)] hover:border-primary/50 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 transition-all duration-200 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236B7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E")] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'

export { Select }
