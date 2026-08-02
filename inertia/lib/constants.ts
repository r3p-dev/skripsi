import { IconCircleCheck, IconPackage, IconSparkles, IconTruck } from '@tabler/icons-react'
import { OrderStatus } from '@/enums/order_status_enum'
import { OrderType } from '@/enums/order_type_enum'
import { TransactionStatus } from '@/enums/transaction_enum'

export const steps = [
  {
    icon: IconPackage,
    title: 'Pesan Layanan',
    description: 'Hubungi kami via WhatsApp dan tentukan jadwal pickup',
  },
  {
    icon: IconTruck,
    title: 'Kami Jemput',
    description: 'Tim kami akan datang ke lokasi Anda sesuai jadwal',
  },
  {
    icon: IconSparkles,
    title: 'Proses Cleaning',
    description: 'Sepatu Anda dibersihkan dengan teknik profesional',
  },
  {
    icon: IconCircleCheck,
    title: 'Antar Kembali',
    description: 'Sepatu bersih diantar ke alamat Anda',
  },
]

/**
 * Badge colour per order status, keyed by the stored enum value.
 *
 * Everything now arrives as it is stored, so this and the label maps in
 * `app/enums` are looked up with the same key. Matching on the Indonesian
 * wording instead would work right up until somebody reworded one, at which
 * point every badge would quietly fall back to grey.
 */
export const orderStatusStyles: Record<string, string> = {
  [OrderStatus.PICKUP_SCHEDULED]: 'bg-gray-200 text-gray-700',
  [OrderStatus.IN_PICKUP]: 'bg-blue-100 text-blue-700',
  [OrderStatus.IN_INSPECTION]: 'bg-blue-100 text-blue-700',
  [OrderStatus.AWAITING_PAYMENT]: 'bg-amber-100 text-amber-700',
  [OrderStatus.IN_CLEANING]: 'bg-blue-100 text-blue-700',
  [OrderStatus.CLEANING_DONE]: 'bg-teal-100 text-teal-700',
  [OrderStatus.IN_DELIVERY]: 'bg-blue-100 text-blue-700',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
}

/**
 * Badge colour per transaction status, keyed the same way.
 */
export const transactionStatusStyles: Record<string, string> = {
  [TransactionStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [TransactionStatus.PAID]: 'bg-green-100 text-green-700',
  [TransactionStatus.EXPIRED]: 'bg-gray-200 text-gray-700',
  [TransactionStatus.CANCELLED]: 'bg-gray-200 text-gray-700',
  [TransactionStatus.FAILED]: 'bg-red-100 text-red-700',
}

/**
 * Badge colour per order type, so a counter order is distinguishable from a
 * booked one at a glance on the shop-wide monitor.
 */
export const orderTypeStyles: Record<string, string> = {
  [OrderType.ONLINE]: 'bg-indigo-100 text-indigo-700',
  [OrderType.OFFLINE]: 'bg-orange-100 text-orange-700',
  [OrderType.WALK_IN_DELIVERY]: 'bg-purple-100 text-purple-700',
}

/**
 * The fallback for a value no style has been written for yet — a new status
 * should render as a plain grey badge, not as an unstyled one.
 */
export const neutralBadgeStyle = 'bg-gray-200 text-gray-700'

export const areas = ['Kota Bandung', 'Kota Cimahi', 'Kabupaten Bandung', 'Kabupaten Bandung Barat']

export const reviews = [
  {
    name: 'Budi Santoso',
    rating: 5,
    comment: 'Pelayanan sangat profesional! Sepatu saya kembali seperti baru. Highly recommended!',
    date: '2 minggu lalu',
  },
  {
    name: 'Sarah Wijaya',
    rating: 5,
    comment:
      'Fast response dan hasilnya memuaskan. Sepatu putih saya yang tadinya kusam jadi kinclong lagi.',
    date: '1 bulan lalu',
  },
  {
    name: 'Rudi Hermawan',
    rating: 5,
    comment:
      'Layanan pickup dan delivery sangat membantu. Harga reasonable untuk kualitas yang didapat.',
    date: '3 minggu lalu',
  },
]
