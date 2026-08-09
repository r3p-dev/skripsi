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
      <AlertDialogCancel className="h-11 rounded-xl text-sm font-semibold">Batal</AlertDialogCancel>
      <Button
        type="submit"
        form={formId}
        disabled={processing}
        className={
          destructive
            ? 'h-11 rounded-xl bg-destructive text-sm font-semibold text-white hover:bg-destructive/90'
            : 'h-11 rounded-xl bg-black text-sm font-semibold tracking-wide text-white hover:bg-black/90'
        }
      >
        {label}
      </Button>
    </AlertDialogFooter>
  )
}
