import { IconCircleCheck, IconPackage, IconSparkles, IconTruck } from '@tabler/icons-react'
import { OrderStatus, OrderType } from '@/enums/order_enum'
import { TransactionStatus } from '@/enums/transaction_enum'

export const steps = [
  {
    icon: IconPackage,
    title: 'Pesan Layanan',
    description: 'Pesan lewat WhatsApp atau situs kami',
  },
  {
    icon: IconTruck,
    title: 'Kami Jemput',
    description: 'Tim kami jemput barang Anda',
  },
  {
    icon: IconSparkles,
    title: 'Proses Cleaning',
    description: 'Proses perawatan berlangsung 2–3 hari',
  },
  {
    icon: IconCircleCheck,
    title: 'Antar Kembali',
    description: 'Barang diantar kembali ke lokasi Anda',
  },
]

export const orderStatusStyles: Record<string, string> = {
  [OrderStatus.PICKUP_SCHEDULED]: 'bg-paper-tint text-ink-body',
  [OrderStatus.IN_PICKUP]: 'bg-blue-100 text-blue-700',
  [OrderStatus.IN_INSPECTION]: 'bg-blue-100 text-blue-700',
  [OrderStatus.AWAITING_PAYMENT]: 'bg-amber-100 text-amber-700',
  [OrderStatus.IN_CLEANING]: 'bg-blue-100 text-blue-700',
  [OrderStatus.CLEANING_DONE]: 'bg-teal-100 text-teal-700',
  [OrderStatus.IN_DELIVERY]: 'bg-blue-100 text-blue-700',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
}

export const transactionStatusStyles: Record<string, string> = {
  [TransactionStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [TransactionStatus.PAID]: 'bg-green-100 text-green-700',
  [TransactionStatus.EXPIRED]: 'bg-paper-tint text-ink-body',
  [TransactionStatus.CANCELLED]: 'bg-paper-tint text-ink-body',
  [TransactionStatus.FAILED]: 'bg-red-100 text-red-700',
}

export const orderTypeStyles: Record<string, string> = {
  [OrderType.ONLINE]: 'bg-indigo-100 text-indigo-700',
  [OrderType.OFFLINE]: 'bg-orange-100 text-orange-700',
  [OrderType.WALK_IN_DELIVERY]: 'bg-purple-100 text-purple-700',
}

export const neutralBadgeStyle = 'bg-paper-tint text-ink-body'

export const areas = [
  'Margacinta',
  'Buah Batu',
  'Kordon',
  'Dayeuh Kolot',
  'Bandung Kidul',
  'Kiaracondong',
]

export const benefits = [
  {
    title: 'Cuci Profesional',
    description:
      'Teknik pembersihan khusus untuk setiap jenis material — kulit, kanvas, suede, hingga cangkang helm.',
  },
  {
    title: 'Perbaikan Detail',
    description:
      'Jahitan, sol, dan bagian yang rusak diperbaiki dengan presisi oleh pengrajin berpengalaman.',
  },
  {
    title: 'Antar-Jemput',
    description: 'Kami jemput dan antar kembali barang Anda, langsung ke lokasi di area Bandung.',
  },
  {
    title: 'Garansi Hasil',
    description: 'Tidak puas dengan hasil? Kami kerjakan ulang tanpa biaya tambahan.',
  },
]

export const rituals = [
  { name: 'Deep cleaning', detail: 'Sabun & sikat khusus' },
  { name: 'Disinfeksi', detail: 'Bebas bakteri & bau' },
  { name: 'Repair', detail: 'Jahitan & sol' },
  { name: 'Protection', detail: 'Lapisan anti air' },
]

export const faqs = [
  {
    question: 'Berapa lama proses perawatan?',
    answer: 'Umumnya 2–3 hari kerja, tergantung jenis dan tingkat kerusakan barang.',
  },
  {
    question: 'Apakah tersedia layanan antar-jemput?',
    answer: 'Ya, kami menjemput dan mengantar kembali untuk area Bandung dan sekitarnya.',
  },
  {
    question: 'Material apa saja yang bisa dirawat?',
    answer: 'Kulit, suede, kanvas, hingga cangkang helm dan bahan sintetis lainnya.',
  },
  {
    question: 'Bagaimana cara memesan?',
    answer: 'Hubungi kami melalui WhatsApp atau tekan tombol "Pesan Sekarang" di halaman ini.',
  },
]

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
