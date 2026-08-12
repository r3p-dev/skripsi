import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert_dialog'
import { Button } from '@/components/ui/button'
import { type ReactNode } from 'react'

export function ConfirmDialog({
  label,
  triggerClassName,
  title,
  description,
  children,
}: {
  label: ReactNode
  triggerClassName: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={triggerClassName}>{label}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ConfirmFooter({
  label,
  processing,
  destructive,
  formId,
}: {
  label: string
  processing?: boolean
  destructive?: boolean
  formId?: string
}) {
  return (
    <AlertDialogFooter>
      <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium tracking-[0.04em] text-ink">
        Batal
      </AlertDialogCancel>
      <Button
        type="submit"
        form={formId}
        disabled={processing}
        className={
          destructive
            ? 'h-11 rounded-none bg-destructive text-meta font-medium tracking-[0.08em] text-white uppercase hover:bg-destructive/90'
            : 'h-11 rounded-none bg-ink text-meta font-medium tracking-[0.08em] text-white uppercase hover:bg-ink/90'
        }
      >
        {label}
      </Button>
    </AlertDialogFooter>
  )
}
