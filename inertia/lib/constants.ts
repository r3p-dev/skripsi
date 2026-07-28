import { IconCircleCheck, IconPackage, IconSparkles, IconTruck } from '@tabler/icons-react'

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
 * Badge colour per order status, keyed by the raw enum value the transformer
 * sends as `statusValue` rather than by the Indonesian label. Matching on the
 * label works until someone rewords one — see "labels are the wire format"
 * in the docs.
 */
export const orderStatusStyles: Record<string, string> = {
  pickup_scheduled: 'bg-gray-200 text-gray-700',
  in_pickup: 'bg-blue-100 text-blue-700',
  in_inspection: 'bg-blue-100 text-blue-700',
  awaiting_payment: 'bg-amber-100 text-amber-700',
  in_cleaning: 'bg-blue-100 text-blue-700',
  in_delivery: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

/**
 * Badge colour per transaction status, keyed the same way.
 */
export const transactionStatusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  expired: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-gray-200 text-gray-700',
  failed: 'bg-red-100 text-red-700',
}

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
