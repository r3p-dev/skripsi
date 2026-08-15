import StaffLayout from '@/components/layouts/staff_layout'
import {
  Eyebrow,
  OutlineButton,
  PageTitle,
  Panel,
  SectionLabel,
  StatusBadge,
  boxField,
} from '@/components/atoms/editorial'
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { ActionName } from '@/enums/order_action_enum'
import { OrderTypeLabel } from '@/enums/order_enum'
import { neutralTone, orderTypeTones } from '@/lib/constants'
import { formatShortDate } from '@/lib/format'
import { Form, Link } from '@adonisjs/inertia/react'
import {
  IconBell,
  IconMapPin,
  IconPackage,
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

const dialogAction =
  'flex min-h-11 items-center justify-center gap-2 bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90'

const dialogOutline =
  'flex min-h-11 flex-1 items-center justify-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint'

function TaskCard({ children }: { children: React.ReactNode }) {
  return (
    <Panel tone="tint" className="flex flex-col gap-3.5 px-5 py-4.5">
      {children}
    </Panel>
  )
}

function TaskHeading({ orderNumber, badge }: { orderNumber: string; badge: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="m-0 text-body leading-[1.4] font-semibold text-ink">{orderNumber}</p>
      {badge}
    </div>
  )
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
              {formatShortDate(item.pickupDate)}
            </span>
            <span className="font-semibold text-ink">{item.distanceKm} km</span>
          </div>
        </TaskCard>
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
          Batal
        </AlertDialogCancel>
        <Link
          route="staff.trip.show"
          routeParams={{ number: item.orderNumber, type: item.type }}
          className={dialogAction}
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
      }
    >
      <AlertDialogFooter>
        <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
          Batal
        </AlertDialogCancel>
        <Link
          route="staff.inspection.show"
          routeParams={{ number: order.orderNumber }}
          className={dialogAction}
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
    <TaskCard>
      <TaskHeading
        orderNumber={order.orderNumber}
        badge={
          <StatusBadge tone={orderTypeTones[order.type] ?? neutralTone}>
            <IconWashMachine className="size-3" />
            {OrderTypeLabel[order.type as keyof typeof OrderTypeLabel]}
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

function CollectionCard({ order }: { order: Data.Order.Variants['toDetail'] }) {
  const alreadyNotified = order.actions?.some(
    (action) => action.name === ActionName.READY_NOTICE_SENT
  )

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
        <Form
          route="staff.notification.store"
          routeParams={{ number: order.orderNumber }}
          className="flex-1"
        >
          {({ processing }) => (
            <>
              <input type="hidden" name="notice" value="ready" />
              <OutlineButton
                type="submit"
                disabled={processing || alreadyNotified}
                className="gap-2 py-3 text-meta disabled:opacity-50"
              >
                <IconBell className="size-4" />
                {alreadyNotified ? 'Sudah Dikabari' : 'Kabari via WhatsApp'}
              </OutlineButton>
            </>
          )}
        </Form>

        <ConfirmDialog
          triggerClassName={cn(dialogAction, 'flex-1')}
          label="Sudah Diambil"
          title="Sudah diambil pelanggan?"
          description={`Pesanan ${order.orderNumber} akan ditandai selesai. Tindakan ini tidak dapat dibatalkan.`}
        >
          <Form route="staff.collection.update" routeParams={{ number: order.orderNumber }}>
            {({ processing }) => <ConfirmFooter label="Konfirmasi" processing={processing} />}
          </Form>
        </ConfirmDialog>
      </div>
    </TaskCard>
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
      <div className="gutter flex items-start justify-between gap-3 pt-7 pb-5">
        <div>
          <Eyebrow className="mb-1.5">Tugas</Eyebrow>
          <PageTitle>Antrean Tugas</PageTitle>
        </div>
      </div>

      <div
        className="gutter -mx-px flex gap-2 overflow-x-auto pb-1 tablet:flex-wrap tablet:overflow-visible"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-1.5 border px-4 text-meta font-medium transition-colors',
                isActive
                  ? 'border-ink bg-ink font-semibold text-white'
                  : 'border-rule-field text-ink-soft hover:bg-paper-tint'
              )}
            >
              {tab.label}
              <span className={isActive ? 'text-white/70' : 'text-ink-faint'}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      <div className="gutter flex flex-1 flex-col gap-3 pt-5 pb-nav">
        {activeCount === 0 ? (
          <Panel tone="tint" className="border-dashed px-6 py-16 text-center">
            <p className="m-0 text-lead leading-[1.4] font-semibold text-ink">Tidak ada tugas</p>
            <p className="m-0 mt-1.5 text-small leading-[1.6] text-ink-soft">
              {EMPTY_MESSAGE[activeTab]}
            </p>
          </Panel>
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
