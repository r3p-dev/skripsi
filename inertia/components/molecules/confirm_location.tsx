import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert_dialog'
import { Button } from '@/components/ui/button'
import StaticMap from '@/components/organisms/static_map'

type ConfirmLocationProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  latitude: number
  longitude: number
  street: string
  matchedLabel?: string | null
  formId: string
  processing?: boolean
}

export default function ConfirmLocation({
  open,
  onOpenChange,
  latitude,
  longitude,
  street,
  matchedLabel,
  formId,
  processing,
}: ConfirmLocationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sudah benar lokasinya?</AlertDialogTitle>
          <AlertDialogDescription>
            Kurir kami akan menjemput di titik ini. Pastikan sudah sesuai dengan alamat Anda.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {open && (
          <div className="overflow-hidden rounded-none border border-rule-field">
            <StaticMap latitude={latitude} longitude={longitude} height={220} />
          </div>
        )}

        {street && <p className="m-0 text-small leading-[1.6] text-ink-body">{street}</p>}

        {matchedLabel && (
          <p className="m-0 text-meta leading-[1.6] text-ink-soft">Titik peta: {matchedLabel}</p>
        )}

        <p className="m-0 text-meta tracking-[0.04em] text-ink-subtle">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium tracking-[0.04em] text-ink">
            Periksa Lagi
          </AlertDialogCancel>
          <Button
            type="submit"
            form={formId}
            disabled={processing}
            className="h-11 rounded-none bg-ink text-meta font-medium tracking-[0.08em] text-white uppercase hover:bg-ink/90"
          >
            Ya, Simpan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
