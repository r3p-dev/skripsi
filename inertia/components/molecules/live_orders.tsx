import {
  EmptyState,
  Panel,
  PanelBody,
  PanelHeader,
  SectionLabel,
  StatusBadge,
  type BadgeTone,
} from '@/components/atoms/editorial'
import { neutralTone, orderStatusTones } from '@/lib/constants'
import { Transmit } from '@adonisjs/transmit-client'
import { IconAntennaBars5 } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

type AdminOrderEvent = {
  event: 'order:created' | 'order:updated' | 'order:paid'
  reason: 'created' | 'status-change' | 'price-correction' | 'payment'
  orderNumber: string
  customerName: string
  status: string
  statusLabel: string
  typeLabel: string
  totalPriceLabel: string | null
}

const REASON_LABEL: Record<AdminOrderEvent['reason'], string> = {
  'created': 'Pesanan Masuk',
  'status-change': 'Status Diperbarui',
  'price-correction': 'Harga Diperbarui',
  'payment': 'Pesanan Terbayar',
}

const EVENT_TONE: Record<AdminOrderEvent['event'], BadgeTone> = {
  'order:created': 'outline',
  'order:updated': 'muted',
  'order:paid': 'solid',
}

const FEED_LENGTH = 8

export function LiveOrders() {
  const [events, setEvents] = useState<AdminOrderEvent[]>([])

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription('admin/orders')

    subscription.create().then(() => {
      subscription.onMessage<AdminOrderEvent>((message) => {
        setEvents((current) => [message, ...current].slice(0, FEED_LENGTH))
      })
    })

    return () => {
      subscription.delete()
      transmit.close()
    }
  }, [])

  return (
    <Panel>
      <PanelHeader>
        <SectionLabel>Aktivitas Langsung</SectionLabel>
        <span className="flex items-center gap-1.5 text-meta text-ink-subtle">
          <IconAntennaBars5 className="size-4" />
          Terhubung
        </span>
      </PanelHeader>

      {events.length === 0 ? (
        <EmptyState>Belum ada aktivitas sejak halaman dibuka</EmptyState>
      ) : (
        <PanelBody className="py-0">
          <ul className="m-0 flex list-none flex-col p-0">
            {events.map((entry, index) => (
              <li
                key={`${entry.orderNumber}-${index}`}
                className="flex flex-col gap-1.5 border-b border-rule py-3.5 last:border-b-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-body leading-[1.4] font-semibold text-ink">
                    {entry.orderNumber}
                  </span>
                  <StatusBadge tone={EVENT_TONE[entry.event]}>
                    {REASON_LABEL[entry.reason]}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-meta leading-normal">
                  <span className="text-ink-soft">
                    {entry.customerName} · {entry.typeLabel}
                  </span>
                  <span className="text-ink-body">{entry.totalPriceLabel ?? '—'}</span>
                </div>
                <StatusBadge tone={orderStatusTones[entry.status] ?? neutralTone} className="w-fit">
                  {entry.statusLabel}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </PanelBody>
      )}
    </Panel>
  )
}
