import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OrderStatusLabel } from '@/enums/order_status_enum'
import { OrderTypeLabel } from '@/enums/order_type_enum'
import { neutralBadgeStyle, orderStatusStyles } from '@/lib/constants'
import { formatRupiah } from '@/lib/format'
import { Transmit } from '@adonisjs/transmit-client'
import { IconAntennaBars5 } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

/**
 * What arrives on the admin channel.
 *
 * Stored values, never their Indonesian wording: a broadcast is data landing
 * on a screen that already knows how to print it, and baking the label in
 * would mean two places decide what a status is called.
 */
type AdminOrderEvent = {
  event: 'order:created' | 'order:updated' | 'order:paid'
  orderNumber: string
  customerName: string
  status: string
  type: string
  totalPrice: number | null
}

const EVENT_LABEL: Record<AdminOrderEvent['event'], string> = {
  'order:created': 'Pesanan Masuk',
  'order:updated': 'Pesanan Diperbarui',
  'order:paid': 'Pesanan Terbayar',
}

const EVENT_STYLE: Record<AdminOrderEvent['event'], string> = {
  'order:created': 'bg-indigo-100 text-indigo-700',
  'order:updated': 'bg-blue-100 text-blue-700',
  'order:paid': 'bg-green-100 text-green-700',
}

/** How much of the feed is kept on screen before the oldest entries drop off. */
const FEED_LENGTH = 8

/**
 * The shop's activity as it happens.
 *
 * Three events and no more: work arriving, work moving, and money landing.
 * An admin needs to know about those; everything else is detail they go and
 * look at, and pushing all of it would turn the dashboard into a firehose
 * nobody can leave open.
 */
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
    <Card className="rounded-2xl border border-gray-200 bg-white">
      <CardHeader className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-widest text-gray-600 uppercase">
          Aktivitas Langsung
        </p>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <IconAntennaBars5 className="size-4" />
          Terhubung
        </span>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Belum ada aktivitas sejak halaman dibuka
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-200">
            {events.map((entry, index) => (
              <li key={`${entry.orderNumber}-${index}`} className="flex flex-col gap-1 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-black">{entry.orderNumber}</span>
                  <Badge className={EVENT_STYLE[entry.event]}>{EVENT_LABEL[entry.event]}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-600">
                    {entry.customerName} ·{' '}
                    {OrderTypeLabel[entry.type as keyof typeof OrderTypeLabel]}
                  </span>
                  <span className="text-gray-700">
                    {entry.totalPrice === null ? '—' : formatRupiah(entry.totalPrice)}
                  </span>
                </div>
                <Badge className={`w-fit ${orderStatusStyles[entry.status] ?? neutralBadgeStyle}`}>
                  {OrderStatusLabel[entry.status as keyof typeof OrderStatusLabel]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
