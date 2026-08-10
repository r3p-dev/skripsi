import StaffLayout from '@/components/layouts/staff_layout'
import { ConfirmDialog, ConfirmFooter } from '@/components/molecules/confirm_action'
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
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { ActionName } from '@/enums/order_action_enum'
import { OrderTypeLabel } from '@/enums/order_enum'
import { neutralBadgeStyle, orderTypeStyles } from '@/lib/constants'
import { formatShortDate } from '@/lib/format'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconBell,
  IconMapPin,
  IconPackage,
  IconPlus,
  IconPrinter,
  IconSearch,
  IconShoppingBag,
  IconTruckDelivery,
  IconWashMachine,
} from '@tabler/icons-react'
import { useState } from 'react'

type PageProps = InertiaProps<{
  trips: Data.RouteItem[]
  inspections: Data.Order.Variants['toQueue'][]
  cleanings: Data.Order.Variants['toDetail'][]
  collections: Data.Order.Variants['toDetail'][]
}>

type TabKey = 'trips' | 'inspections' | 'cleanings' | 'collections'

const EMPTY_MESSAGE: Record<TabKey, string> = {
  trips: 'Belum ada penjemputan atau pengantaran',
  inspections: 'Belum ada barang yang menunggu inspeksi',
  cleanings: 'Belum ada barang yang sedang dicuci',
  collections: 'Belum ada barang yang menunggu diambil',
}

function TripCard({ item }: { item: Data.RouteItem }) {
  const isDelivery = item.type === 'delivery'
  const kind = isDelivery ? 'Pengantaran' : 'Penjemputan'

  return (
    <ConfirmDialog
      triggerClassName="block w-full text-left"
      title={`Ambil tugas ${kind.toLowerCase()}?`}
      description={`Pesanan ${item.orderNumber} akan menjadi tugas Anda selama 3 jam dan hilang dari antrean petugas lain. Alamat pelanggan baru terlihat setelah tugas diambil.`}
      label={
        <Card className="w-full rounded-none border border-rule-field bg-paper-tint p-5 transition-colors hover:bg-paper-tint active:scale-95">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-wide text-ink">{item.orderNumber}</p>
            <Badge
              className={isDelivery ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
            >
              {isDelivery ? (
                <IconTruckDelivery className="size-3" />
              ) : (
                <IconPackage className="size-3" />
              )}
              {isDelivery ? 'Antar' : 'Jemput'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-ink-soft">
              <IconMapPin className="size-4" />
              {formatShortDate(item.pickupDate)}
            </span>
            <span className="font-semibold text-ink">{item.distanceKm} km</span>
          </div>
        </Card>
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-none text-sm font-semibold">
          Batal
        </AlertDialogCancel>
        <Link
          route="staff.trip.show"
          routeParams={{ number: item.orderNumber, type: item.type }}
          className={buttonVariants({
            className:
              'h-11 rounded-none bg-ink text-sm font-semibold tracking-wide text-white hover:bg-ink/90',
          })}
        >
          Ambil Tugas
        </Link>
      </AlertDialogFooter>
    </ConfirmDialog>
  )
}

function InspectionCard({ order }: { order: Data.Order.Variants['toQueue'] }) {
  return (
    <ConfirmDialog
      triggerClassName="block w-full text-left"
      title="Ambil tugas inspeksi?"
      description={`Pesanan ${order.orderNumber} akan menjadi tugas Anda selama 3 jam dan hilang dari antrean petugas lain.`}
      label={
        <Card className="w-full rounded-none border border-rule-field bg-paper-tint p-5 transition-colors hover:bg-paper-tint active:scale-95">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-wide text-ink">{order.orderNumber}</p>
            <Badge className="bg-purple-100 text-purple-700">
              <IconSearch className="size-3" />
              Inspeksi
            </Badge>
          </div>
        </Card>
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-none text-sm font-semibold">
          Batal
        </AlertDialogCancel>
        <Link
          route="staff.inspection.show"
          routeParams={{ number: order.orderNumber }}
          className={buttonVariants({
            className:
              'h-11 rounded-none bg-ink text-sm font-semibold tracking-wide text-white hover:bg-ink/90',
          })}
        >
          Ambil Tugas
        </Link>
      </AlertDialogFooter>
    </ConfirmDialog>
  )
}

function CleaningCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  const inspectionPhoto = order.actions?.find(
    (action) => action.name === ActionName.INSPECTION
  )?.photoPath

  const intakePhoto = order.actions?.find(
    (action) => action.name === ActionName.OFFLINE_ORDER
  )?.photoPath

  const beforePhoto = inspectionPhoto ?? intakePhoto

  return (
    <Card className="rounded-none border border-rule-field bg-paper-tint p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-ink">{order.orderNumber}</p>
        <Badge className={orderTypeStyles[order.type] ?? neutralBadgeStyle}>
          <IconWashMachine className="size-3" />
          {OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">{order.items?.length ?? 0} item</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          route="staff.tag.show"
          routeParams={{ number: order.orderNumber }}
          className={buttonVariants({
            variant: 'outline',
            className: 'h-11 flex-1 rounded-none text-sm font-semibold text-ink active:scale-95',
          })}
        >
          <IconPrinter className="size-4" />
          Cetak Label
        </Link>

        <AlertDialog>
          <AlertDialogTrigger className="h-11 flex-1 rounded-none bg-ink text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink/90 active:scale-95">
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
              <div className="space-y-1.5">
                <p className="text-xs tracking-widest text-ink-soft uppercase">Foto Sebelum</p>
                <img
                  src={beforePhoto}
                  alt="Foto sebelum dicuci"
                  className="aspect-video w-full rounded-none border border-rule object-cover"
                />
              </div>
            )}

            <Form route="staff.cleaning.update" routeParams={{ number: order.orderNumber }}>
              {({ errors, processing }) => (
                <div className="space-y-3">
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor={`cleaning-photo-${order.id}`}
                      className="text-xs tracking-widest text-ink-body uppercase"
                    >
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
                      className="h-12 rounded-none border-rule-field bg-white px-3 focus-visible:border-ink focus-visible:ring-black/10"
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
    </Card>
  )
}

function CollectionCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  const alreadyNotified = order.actions?.some(
    (action) => action.name === ActionName.READY_NOTICE_SENT
  )

  return (
    <Card className="rounded-none border border-rule-field bg-paper-tint p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-ink">{order.orderNumber}</p>
        <Badge className="bg-teal-100 text-teal-700">
          <IconShoppingBag className="size-3" />
          Siap Diambil
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-body">{order.customerName}</span>
        <span className="text-ink-soft">{order.items?.length ?? 0} item</span>
      </div>

      <div className="flex items-center gap-2">
        <Form route="staff.notification.store" routeParams={{ number: order.orderNumber }}>
          {({ processing }) => (
            <>
              <input type="hidden" name="notice" value="ready" />
              <Button
                type="submit"
                variant="outline"
                disabled={processing || alreadyNotified}
                className="h-11 w-full rounded-none text-sm font-semibold text-ink active:scale-95 disabled:opacity-50"
              >
                <IconBell className="size-4" />
                {alreadyNotified ? 'Sudah Dikabari' : 'Kabari via WhatsApp'}
              </Button>
            </>
          )}
        </Form>

        <ConfirmDialog
          triggerClassName="h-11 w-full flex-1 rounded-none bg-ink text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink/90 active:scale-95"
          label="Sudah Diambil"
          title="Sudah diambil pelanggan?"
          description={`Pesanan ${order.orderNumber} akan ditandai selesai. Tindakan ini tidak dapat dibatalkan.`}
        >
          <Form route="staff.collection.update" routeParams={{ number: order.orderNumber }}>
            {({ processing }) => <ConfirmFooter label="Konfirmasi" processing={processing} />}
          </Form>
        </ConfirmDialog>
      </div>
    </Card>
  )
}

export default function Index({ trips, inspections, cleanings, collections }: PageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('trips')

  const tabs = [
    { key: 'trips', label: 'Antar Jemput', count: trips.length },
    { key: 'inspections', label: 'Inspeksi', count: inspections.length },
    { key: 'cleanings', label: 'Pencucian', count: cleanings.length },
    { key: 'collections', label: 'Siap Diambil', count: collections.length },
  ] as const

  const activeCount = tabs.find((tab) => tab.key === activeTab)!.count

  return (
    <StaffLayout title="Tugas" description="Daftar tugas penjemputan, inspeksi, dan pencucian">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <p className="text-xs tracking-[0.3em] text-ink-soft uppercase font-medium">Tugas</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Antrean Tugas</h1>
        </div>

        <Link
          route="staff.order.create"
          aria-label="Buat pesanan offline"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all hover:bg-ink/90 active:scale-95"
        >
          <IconPlus className="size-5" />
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto scroll-px-6 px-6 pb-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors active:scale-95 ${
                isActive ? 'bg-ink text-white' : 'bg-paper-tint text-ink-soft hover:bg-paper-tint'
              }`}
            >
              {tab.label}
              <span
                className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-ink-body'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 space-y-4 px-6 pt-4 pb-nav">
        {activeCount === 0 ? (
          <Card className="flex flex-col items-center gap-2 rounded-none border border-dashed border-rule-field bg-paper-tint px-6 py-16 text-center">
            <p className="text-base font-semibold text-ink">Tidak ada tugas</p>
            <p className="text-sm text-ink-soft">{EMPTY_MESSAGE[activeTab]}</p>
          </Card>
        ) : (
          <>
            {activeTab === 'trips' && trips.map((item) => <TripCard key={item.id} item={item} />)}

            {activeTab === 'inspections' &&
              inspections.map((order) => <InspectionCard key={order.id} order={order} />)}

            {activeTab === 'cleanings' &&
              cleanings.map((order) => <CleaningCard key={order.id} order={order} />)}

            {activeTab === 'collections' &&
              collections.map((order) => <CollectionCard key={order.id} order={order} />)}
          </>
        )}
      </div>
    </StaffLayout>
  )
}
