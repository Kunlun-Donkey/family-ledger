import { cn } from '@/lib/utils'

interface PageTitleProps {
  children: React.ReactNode
  className?: string
  extra?: React.ReactNode
}

export function PageTitle({ children, className, extra }: PageTitleProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-5 -mx-4 lg:-mx-6 bg-card rounded-[20px] shadow-[var(--shadow-sm)] border border-[var(--divider)]',
      className
    )}>
      <h2 className="text-[20px] font-semibold text-title">{children}</h2>
      {extra && <div>{extra}</div>}
    </div>
  )
}

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h3 className={cn('text-[15px] font-semibold text-title mb-3', className)}>
      {children}
    </h3>
  )
}
