import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { IconSearch } from '@tabler/icons-react'
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

// Monochrome status vocabulary: weight, not hue, carries the meaning.
// solid = terminal/settled · outline = active/in-flight · muted = inert/parked.
export type BadgeTone = 'solid' | 'outline' | 'muted'

const badgeTones: Record<BadgeTone, string> = {
  solid: 'bg-ink text-white',
  outline: 'border border-black/30 text-ink',
  muted: 'bg-paper-tint text-ink-soft',
}

export function StatusBadge({
  emphasis = false,
  tone,
  className,
  ...props
}: ComponentProps<'span'> & { emphasis?: boolean; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-xs px-2.25 py-1 text-badge font-medium tracking-[0.06em] whitespace-nowrap uppercase',
        badgeTones[tone ?? (emphasis ? 'solid' : 'outline')],
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

/* ------------------------------------------------------------------ *
 * Console surfaces — shared by the admin and staff screens.
 * Same ink/paper vocabulary as the marketing and customer pages:
 * hairline rules instead of shadows, square corners, fluid type.
 * ------------------------------------------------------------------ */

export function SectionLabel({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'm-0 text-micro leading-[1.4] font-medium tracking-[0.2em] text-ink-soft uppercase',
        className
      )}
      {...props}
    />
  )
}

export function Panel({
  tone = 'paper',
  className,
  ...props
}: ComponentProps<'div'> & { tone?: 'paper' | 'tint' }) {
  return (
    <div
      className={cn(
        'border border-rule',
        tone === 'tint' ? 'bg-paper-tint' : 'bg-white',
        className
      )}
      {...props}
    />
  )
}

export function PanelHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-rule px-5 py-3.5',
        className
      )}
      {...props}
    />
  )
}

export function PanelBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}

export function EmptyState({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('py-10 text-center text-small leading-[1.6] text-ink-subtle', className)}
      {...props}
    />
  )
}

/** Boxed field — the console counterpart to `underlineField`. */
export const boxField =
  'h-11 w-full rounded-none border border-rule-field bg-white px-3.5 text-small text-ink shadow-none placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-none'

export function BoxInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn(boxField, className)} {...props} />
}

export function BoxTextarea({ className, ...props }: ComponentProps<typeof Textarea>) {
  return <Textarea className={cn(boxField, 'h-auto min-h-22 py-2.5', className)} {...props} />
}

export function BoxSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(boxField, 'disabled:bg-paper-tint disabled:text-ink-subtle', className)}
      {...props}
    />
  )
}

export function SearchField({
  className,
  wrapperClassName,
  ...props
}: ComponentProps<typeof Input> & { wrapperClassName?: string }) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint" />
      <Input type="text" className={cn(boxField, 'pl-10', className)} {...props} />
    </div>
  )
}

export function Toolbar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-2.5 tablet:flex-row tablet:items-end', className)}
      {...props}
    />
  )
}

/** Compact square action, sized to stay tappable on touch screens. */
export function IconAction({
  destructive = false,
  className,
  ...props
}: ComponentProps<'button'> & { destructive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex size-9 items-center justify-center rounded-xs border border-transparent text-ink-faint transition-colors',
        destructive
          ? 'hover:border-destructive/30 hover:text-destructive'
          : 'hover:border-rule-field hover:text-ink',
        'disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:text-ink-faint',
        className
      )}
      {...props}
    />
  )
}

export const iconActionLink =
  'flex size-9 items-center justify-center rounded-xs border border-transparent text-ink-faint transition-colors hover:border-rule-field hover:text-ink'

export function Notice({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 border-l-2 border-ink bg-paper-tint px-4 py-3 text-small leading-[1.6] text-ink-body',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
