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
import { OrderTypeLabel } from '@/enums/order_type_enum'
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

/**
 * A stop on the route.
 *
 * The order number, what kind of stop it is, and how far away it is —
 * deliberately nothing else. This board is on the screen of everyone on shift
 * whether or not they take the job, and a queue is not a place to browse
 * customers' names, phone numbers and front doors. All of that arrives with
 * the task once it is claimed, at which point the claim is on the record under
 * the name of whoever made it. That is the whole reason claiming exists.
 */
function TripCard({ item }: { item: Data.RouteItem }) {
  const isDelivery = item.type === 'delivery'
  const kind = isDelivery ? 'Pengantaran' : 'Penjemputan'

  return (
    <ConfirmDialog
      triggerClassName="block w-full text-left"
      title={`Ambil tugas ${kind.toLowerCase()}?`}
      description={`Pesanan ${item.orderNumber} akan menjadi tugas Anda selama 3 jam dan hilang dari antrean petugas lain. Alamat pelanggan baru terlihat setelah tugas diambil.`}
      label={
        <Card className="w-full rounded-2xl border border-gray-300 bg-gray-50 p-5 transition-colors hover:bg-gray-100 active:scale-95">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-wide text-black">{item.orderNumber}</p>
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
            <span className="flex items-center gap-1.5 text-gray-600">
              <IconMapPin className="size-4" />
              {formatShortDate(item.pickupDate)}
            </span>
            <span className="font-semibold text-black">{item.distanceKm} km</span>
          </div>
        </Card>
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-xl text-sm font-semibold">
          Batal
        </AlertDialogCancel>
        {/*
          Opening the task is the claim, so the confirmation leads to a plain
          navigation rather than a form submit.
        */}
        <Link
          route="staff.trip.show"
          routeParams={{ number: item.orderNumber, type: item.type }}
          className={buttonVariants({
            className:
              'h-11 rounded-xl bg-black text-sm font-semibold tracking-wide text-white hover:bg-black/90',
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
        <Card className="w-full rounded-2xl border border-gray-300 bg-gray-50 p-5 transition-colors hover:bg-gray-100 active:scale-95">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-wide text-black">{order.orderNumber}</p>
            <Badge className="bg-purple-100 text-purple-700">
              <IconSearch className="size-3" />
              Inspeksi
            </Badge>
          </div>
        </Card>
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-xl text-sm font-semibold">
          Batal
        </AlertDialogCancel>
        <Link
          route="staff.inspection.show"
          routeParams={{ number: order.orderNumber }}
          className={buttonVariants({
            className:
              'h-11 rounded-xl bg-black text-sm font-semibold tracking-wide text-white hover:bg-black/90',
          })}
        >
          Ambil Tugas
        </Link>
      </AlertDialogFooter>
    </ConfirmDialog>
  )
}

function CleaningCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  /**
   * The photo taken at inspection, shown as the "before" the washer compares
   * their work against. Matched on the stored action name rather than its
   * caption, so rewording the caption cannot silently empty this.
   */
  const inspectionPhoto = order.actions?.find(
    (action) => action.name === ActionName.INSPECTION
  )?.photoPath

  /**
   * A counter order has no inspection, but it does have the intake photo staff
   * took when the shoes came over the counter, which serves the same purpose.
   */
  const intakePhoto = order.actions?.find(
    (action) => action.name === ActionName.OFFLINE_ORDER
  )?.photoPath

  const beforePhoto = inspectionPhoto ?? intakePhoto

  return (
    <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-black">{order.orderNumber}</p>
        <Badge className={orderTypeStyles[order.type] ?? neutralBadgeStyle}>
          <IconWashMachine className="size-3" />
          {OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{order.items?.length ?? 0} item</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          route="staff.tag.show"
          routeParams={{ number: order.orderNumber }}
          className={buttonVariants({
            variant: 'outline',
            className: 'h-11 flex-1 rounded-xl text-sm font-semibold text-black active:scale-95',
          })}
        >
          <IconPrinter className="size-4" />
          Cetak Label
        </Link>

        {/*
          Behind a confirmation dialog on purpose: marking a batch washed cannot
          be undone, and the button sits on a list of cards that are easy to
          mis-tap. The "after" photo is collected in the same step.
        */}
        <AlertDialog>
          <AlertDialogTrigger className="h-11 flex-1 rounded-xl bg-black text-sm font-semibold tracking-wide text-white transition-colors hover:bg-black/90 active:scale-95">
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
                <p className="text-xs tracking-widest text-gray-600 uppercase">Foto Sebelum</p>
                <img
                  src={beforePhoto}
                  alt="Foto sebelum dicuci"
                  className="aspect-video w-full rounded-xl border border-gray-200 object-cover"
                />
              </div>
            )}

            <Form route="staff.cleaning.update" routeParams={{ number: order.orderNumber }}>
              {({ errors, processing }) => (
                <div className="space-y-3">
                  <Field data-invalid={errors.photo ? 'true' : undefined}>
                    <FieldLabel
                      htmlFor={`cleaning-photo-${order.id}`}
                      className="text-xs tracking-widest text-gray-700 uppercase"
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
                      className="h-12 rounded-xl border-gray-300 bg-white px-3 focus-visible:border-black focus-visible:ring-black/10"
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

/**
 * A washed walk-in order sitting on the shelf, waiting for its owner.
 *
 * The name is here because somebody at the counter has to hand the right shoes
 * to the right person. The phone number is not: the message telling them their
 * shoes are ready goes out on the shop's number through the system, so nobody
 * needs to read the number, let alone copy it. The send is recorded against
 * the order, so "have we told them yet?" is a question the record answers
 * rather than one two staff members disagree about.
 */
function CollectionCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  const alreadyNotified = order.actions?.some(
    (action) => action.name === ActionName.READY_NOTICE_SENT
  )

  return (
    <Card className="rounded-2xl border border-gray-300 bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold tracking-wide text-black">{order.orderNumber}</p>
        <Badge className="bg-teal-100 text-teal-700">
          <IconShoppingBag className="size-3" />
          Siap Diambil
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{order.customerName}</span>
        <span className="text-gray-600">{order.items?.length ?? 0} item</span>
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
                className="h-11 w-full rounded-xl text-sm font-semibold text-black active:scale-95 disabled:opacity-50"
              >
                <IconBell className="size-4" />
                {alreadyNotified ? 'Sudah Dikabari' : 'Kabari via WhatsApp'}
              </Button>
            </>
          )}
        </Form>

        {/*
          The form lives inside the dialog rather than around it: the popup is
          portalled to the end of the document, so a submit button rendered
          inside it would sit outside any surrounding <form> element.
        */}
        <ConfirmDialog
          triggerClassName="h-11 w-full flex-1 rounded-xl bg-black text-sm font-semibold tracking-wide text-white transition-colors hover:bg-black/90 active:scale-95"
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
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Tugas</p>
          <h1 className="text-3xl font-bold tracking-tight text-black">Antrean Tugas</h1>
        </div>

        <Link
          route="staff.order.create"
          aria-label="Buat pesanan offline"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all hover:bg-black/90 active:scale-95"
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
                isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
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
          <Card className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-base font-semibold text-black">Tidak ada tugas</p>
            <p className="text-sm text-gray-600">{EMPTY_MESSAGE[activeTab]}</p>
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
