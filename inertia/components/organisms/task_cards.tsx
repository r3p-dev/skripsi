import { SectionLabel, StatusBadge, boxField } from '@/components/atoms/editorial'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
import { TaskCard, TaskHeading } from '@/components/molecules/staff_task'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert_dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import { ActionName } from '@/enums/order_action_enum'
import { neutralTone, orderTypeTones } from '@/lib/constants'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconMapPin,
  IconPackage,
  IconPrinter,
  IconSearch,
  IconShoppingBag,
  IconTruckDelivery,
  IconWashMachine,
} from '@tabler/icons-react'

const dialogAction =
  'flex min-h-11 items-center justify-center gap-2 bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90'

const dialogOutline =
  'flex min-h-11 flex-1 items-center justify-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint'

export function TripCard({ item }: { item: Data.RouteItem }) {
  const isDelivery = item.type === 'delivery'

  return (
    <Link
      route="staff.trip.show"
      routeParams={{ number: item.orderNumber, type: item.type }}
      className="block w-full text-left"
    >
      <TaskCard>
        <TaskHeading
          orderNumber={item.orderNumber}
          badge={
            <StatusBadge tone={isDelivery ? 'solid' : 'outline'}>
              {isDelivery ? (
                <IconTruckDelivery className="size-3" />
              ) : (
                <IconPackage className="size-3" />
              )}
              {isDelivery ? 'Antar' : 'Jemput'}
            </StatusBadge>
          }
        />

        <div className="flex items-center justify-between gap-3 text-small leading-normal">
          <span className="flex items-center gap-1.5 text-ink-soft">
            <IconMapPin className="size-4" />
            {item.pickupDateLabel}
          </span>
          <span className="font-semibold text-ink">{item.distanceKm} km</span>
        </div>
      </TaskCard>
    </Link>
  )
}

export function InspectionCard({ order }: { order: Data.Order.Variants['toQueue'] }) {
  return (
    <Link
      route="staff.inspection.show"
      routeParams={{ number: order.orderNumber }}
      className="block w-full text-left"
    >
      <TaskCard>
        <TaskHeading
          orderNumber={order.orderNumber}
          badge={
            <StatusBadge tone="outline">
              <IconSearch className="size-3" />
              Inspeksi
            </StatusBadge>
          }
        />
      </TaskCard>
    </Link>
  )
}

export function CleaningCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  const inspectionPhoto = order.actions?.find(
    (action) => action.name === ActionName.INSPECTION
  )?.photoPath

  const intakePhoto = order.actions?.find(
    (action) => action.name === ActionName.OFFLINE_ORDER
  )?.photoPath

  const beforePhoto = inspectionPhoto ?? intakePhoto

  return (
    <TaskCard>
      <TaskHeading
        orderNumber={order.orderNumber}
        badge={
          <StatusBadge tone={orderTypeTones[order.type] ?? neutralTone}>
            <IconWashMachine className="size-3" />
            {order.typeLabel}
          </StatusBadge>
        }
      />

      <div className="text-small leading-normal text-ink-soft">{order.items?.length ?? 0} item</div>

      <div className="flex items-center gap-2">
        <Link
          route="staff.tag.show"
          routeParams={{ number: order.orderNumber }}
          className={dialogOutline}
        >
          <IconPrinter className="size-4" />
          Cetak Label
        </Link>

        <AlertDialog>
          <AlertDialogTrigger className={cn(dialogAction, 'flex-1')}>
            Selesai Dicuci
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Selesai dicuci?</AlertDialogTitle>
              <AlertDialogDescription>
                Pesanan {order.orderNumber} akan lanjut ke pengantaran atau menunggu diambil di
                toko, dan tidak dapat dikembalikan ke pencucian.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {beforePhoto && (
              <div className="flex flex-col gap-2">
                <SectionLabel>Foto Sebelum</SectionLabel>
                <img
                  src={beforePhoto}
                  alt="Foto sebelum dicuci"
                  className="aspect-video w-full border border-rule object-cover"
                />
              </div>
            )}

            <Form route="staff.cleaning.update" routeParams={{ number: order.orderNumber }}>
              {({ errors, processing }) => (
                <div className="flex flex-col gap-4">
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel htmlFor={`cleaning-photo-${order.id}`} className="field-label mb-2">
                      Foto Sesudah Dicuci
                    </FieldLabel>
                    <Input
                      id={`cleaning-photo-${order.id}`}
                      name="photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      required
                      aria-invalid={!!errors.photo}
                      className={cn(boxField, 'h-12 py-2.5')}
                    />
                    <FieldError>{errors.photo}</FieldError>
                  </Field>

                  <ConfirmFooter label="Konfirmasi Selesai" processing={processing} />
                </div>
              )}
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TaskCard>
  )
}

export function CollectionCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  return (
    <TaskCard>
      <TaskHeading
        orderNumber={order.orderNumber}
        badge={
          <StatusBadge tone="outline">
            <IconShoppingBag className="size-3" />
            Siap Diambil
          </StatusBadge>
        }
      />

      <div className="flex items-center justify-between gap-3 text-small leading-normal">
        <span className="text-ink-body">{order.customerName}</span>
        <span className="text-ink-soft">{order.items?.length ?? 0} item</span>
      </div>

      <div className="flex flex-col gap-2 tablet:flex-row">
        <ConfirmDialog
          triggerClassName={cn(dialogAction, 'flex-1')}
          label="Sudah Diambil"
          title="Sudah diambil pelanggan?"
          description={`Pesanan ${order.orderNumber} akan ditandai selesai. Tindakan ini tidak dapat dibatalkan.`}
        >
          <Form route="staff.collection.update" routeParams={{ number: order.orderNumber }}>
            {({ errors, processing }) => (
              <div className="flex flex-col gap-4">
                <Field data-invalid={errors.photo ? 'true' : undefined}>
                  <FieldLabel htmlFor={`collection-photo-${order.id}`} className="field-label mb-2">
                    Foto Bukti Serah Terima
                  </FieldLabel>
                  <Input
                    id={`collection-photo-${order.id}`}
                    name="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    required
                    aria-invalid={!!errors.photo}
                    className={cn(boxField, 'h-12 py-2.5')}
                  />
                  <FieldError>{errors.photo}</FieldError>
                </Field>

                <ConfirmFooter label="Konfirmasi" processing={processing} />
              </div>
            )}
          </Form>
        </ConfirmDialog>
      </div>
    </TaskCard>
  )
}
