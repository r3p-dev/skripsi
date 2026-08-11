import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import type { ComponentProps, ReactNode } from 'react'

export function Shell({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto min-h-dvh w-full max-w-107.5 bg-white text-ink', className)}
      {...props}
    />
  )
}

export function Eyebrow({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('eyebrow m-0', className)} {...props} />
}

export function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('m-0 text-title leading-[1.4] font-semibold text-ink', className)}
      {...props}
    />
  )
}

export function Lede({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('m-0 text-small leading-[1.6] text-ink-muted', className)} {...props} />
}

export function Rule({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('h-px bg-rule', className)} {...props} />
}

export function BackLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      className={cn('text-meta tracking-[0.04em] text-ink-subtle hover:text-ink', className)}
      {...props}
    >
      {children}
    </Link>
  )
}

export function SolidButton({ className, render, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      render={render}
      nativeButton={render ? false : undefined}
      className={cn(
        'h-auto w-full justify-center rounded-none border-none bg-ink px-4 py-4.25 text-small font-medium tracking-[0.08em] text-white uppercase hover:bg-ink/90',
        className
      )}
      {...props}
    />
  )
}

export function OutlineButton({ className, render, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      render={render}
      nativeButton={render ? false : undefined}
      className={cn(
        'h-auto w-full justify-center rounded-none border border-ink bg-transparent px-4 py-4 text-small font-medium tracking-[0.08em] text-ink uppercase hover:bg-ink/5',
        className
      )}
      {...props}
    />
  )
}

export const underlineField =
  'h-auto w-full rounded-none border-0 border-b border-rule-field bg-transparent px-0 py-2.5 text-[15px] text-ink shadow-none placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0'

export function UnderlineInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn(underlineField, className)} {...props} />
}

export function UnderlineTextarea({ className, ...props }: ComponentProps<typeof Textarea>) {
  return <Textarea className={cn(underlineField, 'resize-none', className)} {...props} />
}

export function StatusBadge({
  emphasis = false,
  className,
  ...props
}: ComponentProps<'span'> & { emphasis?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block rounded-xs px-2.25 py-1 text-badge font-medium tracking-[0.06em] whitespace-nowrap uppercase',
        emphasis ? 'bg-ink text-white' : 'border border-black/30 text-ink',
        className
      )}
      {...props}
    />
  )
}

export function StickyBar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-107.5 border-t border-rule-strong bg-white px-5 py-3.5 pb-safe',
        className
      )}
      {...props}
    />
  )
}
