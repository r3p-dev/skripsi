import { IconCircleCheck, IconPackage, IconSparkles, IconTruck } from '@tabler/icons-react'
import type { BadgeTone } from '@/components/atoms/editorial'
import { OrderStatus, OrderType } from '@/enums/order_enum'
import { TransactionStatus } from '@/enums/transaction_enum'

export const steps = [
  {
    icon: IconPackage,
    title: 'Pesan Layanan',
    description: 'Pesan lewat situs kami',
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

// The console screens share the monochrome badge vocabulary used on the
// customer pages: `solid` reads as settled, `outline` as in-flight, and
// `muted` as parked. Weight replaces hue so the ink/paper palette holds.
export const orderStatusTones: Record<string, BadgeTone> = {
  [OrderStatus.PICKUP_SCHEDULED]: 'muted',
  [OrderStatus.IN_PICKUP]: 'outline',
  [OrderStatus.IN_INSPECTION]: 'outline',
  [OrderStatus.AWAITING_PAYMENT]: 'outline',
  [OrderStatus.IN_CLEANING]: 'outline',
  [OrderStatus.CLEANING_DONE]: 'outline',
  [OrderStatus.IN_DELIVERY]: 'outline',
  [OrderStatus.COMPLETED]: 'solid',
  [OrderStatus.CANCELLED]: 'muted',
}

export const transactionStatusTones: Record<string, BadgeTone> = {
  [TransactionStatus.PENDING]: 'outline',
  [TransactionStatus.PAID]: 'solid',
  [TransactionStatus.EXPIRED]: 'muted',
  [TransactionStatus.CANCELLED]: 'muted',
  [TransactionStatus.FAILED]: 'muted',
}

export const orderTypeTones: Record<string, BadgeTone> = {
  [OrderType.ONLINE]: 'outline',
  [OrderType.OFFLINE]: 'muted',
  [OrderType.WALK_IN_DELIVERY]: 'muted',
}

export const neutralTone: BadgeTone = 'muted'

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

export const contact = {
  operationalHours: '09.00 – 20.00',
  phone: '0851-5790-0974',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=umima+clean+bandung',
}

export const terms = [
  'Pelanggan wajib mengisi format order yang disediakan dengan detail lokasi agar tim pick-up dapat menemukan titik penjemputan dengan mudah.',
  'Waktu penjemputan disesuaikan dengan rute pick-up & delivery pada hari itu. Jika tidak dapat bertemu langsung dengan tim pick-up, sepatu dapat dititipkan dan dikonfirmasi kepada tim yang menghubungi atau melalui admin.',
  'Treatment akan disesuaikan dengan jenis dan tingkat kekotoran sepatu. Jika ada tambahan treatment, harap konfirmasi paling lambat saat invoice dikirim.',
  'Sepatu akan diproses setelah pembayaran diterima.',
]

export const faqs = [
  {
    question: 'Sepatu apa saja yang bisa dicuci di Umima Clean?',
    answer:
      'Kami menerima berbagai jenis sepatu, termasuk sneakers, leather, suede, canvas, boots, dan lainnya.',
  },
  {
    question: 'Berapa lama proses pencuciannya?',
    answer:
      'Tergantung jenis sepatu dan treatment yang dibutuhkan. Rata-rata 2–4 hari kerja, tetapi bisa lebih cepat untuk layanan one day service.',
  },
  {
    question: 'Apakah bisa cuci sepatu yang berbahan suede atau kulit?',
    answer:
      'Tentu. Kami bahkan menyediakan layanan premium untuk perawatan ekstra pada sepatu berbahan kulit, termasuk Mirror Shine Treatment. Untuk sepatu suede, Anda bisa memilih Premium Treatment yang membuat suede lebih lembut dengan warna yang lebih tajam.',
  },
  {
    question: 'Apakah Umima Clean menerima layanan antar-jemput?',
    answer: 'Ya. Kami menyediakan layanan pick-up & delivery agar lebih praktis buat Anda.',
  },
  {
    question: 'Apakah Umima Clean menyediakan garansi?',
    answer:
      'Ya, kami memberikan garansi. Jika hasil kurang maksimal, Anda bisa mengajukan pencucian ulang. Untuk kerusakan, klaim garansi dengan menunjukkan foto kondisi sepatu sehari sebelum treatment.',
  },
  {
    question: 'Berapa harga layanan cuci sepatu di Umima Clean?',
    answer:
      'Harga bervariasi tergantung jenis sepatu dan treatment yang dibutuhkan. Lihat daftar lengkapnya pada bagian Harga di halaman ini.',
  },
  {
    question: 'Bagaimana cara order layanan Umima Clean?',
    answer:
      'Mudah. Anda bisa memesan langsung lewat tombol "Pesan Sekarang" di halaman ini, menghubungi kami via WhatsApp, atau datang ke store kami.',
  },
  {
    question: 'Apakah bisa mencuci lebih dari satu pasang sepatu sekaligus?',
    answer: 'Tentu. Kami bahkan punya diskon khusus untuk cuci banyak pasang.',
  },
  {
    question: 'Apakah tersedia layanan repair atau repaint sepatu?',
    answer:
      'Ya. Kami juga menawarkan layanan repaint dan minor repair agar sepatu Anda kembali segar seperti baru.',
  },
  {
    question: 'Di mana lokasi Umima Clean?',
    answer:
      'Basecamp kami berada di Margacinta, Bandung. Hubungi kami untuk alamat lengkap dan info lebih lanjut.',
  },
]

export const reviews = [
  {
    name: 'Adryan Aulia P',
    rating: 5,
    comment:
      'langganan dari 2021 dulu masih di baleendah , walaupun sekarang ngedrop sepatu jadi jauh , tapi bisa di pickup and delivery',
  },
  {
    name: 'rheinna tasya',
    rating: 5,
    comment:
      'rekomendasi buat yang mau sepatu atau tas nya kinclong lagii, pelayanannya juga ramah pooll',
  },
  {
    name: 'sendi Maulana',
    rating: 5,
    comment:
      'Tempat nya nyaman pelayanan nya ramah buat yang mau reglue jangan ragu terbaik pokonya',
  },
  {
    name: 'Ria Belinda',
    rating: 5,
    comment:
      'Good service. Masnya edukatif. Ngasih tw bagian mana aja yg sulit dibersihkan dan yg riskan klo dipaksakan. Resultnya ttp maksimal. Trims umima',
  },
]
