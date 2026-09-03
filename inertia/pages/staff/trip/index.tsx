import StaffLayout from '@/components/layouts/staff_layout'
import { Eyebrow, PageTitle, Panel } from '@/components/atoms/editorial'
import {
  CleaningCard,
  CollectionCard,
  InspectionCard,
  TripCard,
} from '@/components/organisms/task_cards'
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { IconPlus } from '@tabler/icons-react'
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

        <Link
          route="staff.order.create"
          aria-label="Buat pesanan offline"
          className="flex size-11 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-ink/90"
        >
          <IconPlus className="size-5" />
        </Link>
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
