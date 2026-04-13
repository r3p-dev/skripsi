import { IconCircleCheck, IconPackage, IconSparkles, IconTruck } from '@tabler/icons-react'

export const services = [
  {
    name: 'Premium For Suede',
    description:
      'Perawatan khusus untuk sepatu suede agar kembali memiliki dua side gelap dan terang serta lembut kembali.',
    price: 120000,
    type: 'Mulai dari',
  },
  {
    name: 'Mild',
    description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu tetap bersih.',
    price: 60000,
    type: undefined,
  },
  {
    name: 'Medium',
    description: 'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda cenderung ringan.',
    price: 65000,
    type: undefined,
  },
  {
    name: 'Hard',
    description:
      'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda berat atau cenderung berat.',
    price: 70000,
    type: undefined,
  },
  {
    name: 'Kids Shoes',
    description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu anak tetap bersih.',
    price: 40000,
    type: 'Mulai dari',
  },
  {
    name: 'Just For Her',
    description:
      'Pencucian bagian luar dan dalam untuk menjaga sepatu wanita tetap bersih. (Flat shoes, heels, wedges, dan flip flops)',
    price: 45000,
    type: 'Mulai dari',
  },
  {
    name: 'Unyellowing',
    description: 'Pencucian untuk menghilangkan warna kuning.',
    price: 30000,
    type: 'Mulai dari',
  },
  {
    name: 'White Shoes / Mummy',
    description: 'Tambahan jasa perawatan khusus sepatu putih',
    price: 10000,
    type: 'Tambahan',
  },
  {
    name: 'Nubuck Suede',
    description: 'Perawatan khusus sepatu nubuck suede',
    price: 10000,
    type: 'Tambahan',
  },
  {
    name: 'One Day Service',
    description: 'Pencucian sepatu dalam satu hari',
    price: 10000,
    type: 'Tambahan',
  },
]

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
