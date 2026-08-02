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

/**
 * A confirmation step in front of a task action that cannot be taken back.
 *
 * Claiming, finishing and releasing a task all belong behind one. Each is a
 * full-width button under a thumb, on a phone being used one-handed in a van,
 * and each is visible to the whole team the moment it lands: a mis-tapped
 * claim pulls a stop out of everybody else's queue for three hours, a
 * mis-tapped finish tells a customer their shoes are on the way, and a
 * mis-tapped release hands back a job somebody is halfway through.
 */
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

/**
 * The footer every confirmation ends with: a way out on the left, the thing
 * that was actually asked for on the right.
 *
 * `formId` is how the button reaches a form it is not inside. The dialog is
 * portalled to the end of the document, so when the fields being confirmed
 * live on the page — a proof photo staff need to pick, look at, and re-pick
 * before they commit — the submit button ends up outside that `<form>`
 * entirely. HTML's `form` attribute exists for exactly this: the button names
 * the form it belongs to and submits it from wherever it happens to be.
 *
 * Confirmations with no fields of their own put the form inside the dialog
 * instead and leave this unset.
 */
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
