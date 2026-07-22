import { ServiceCategory, ServiceType } from '#enums/service_type_enum'

export interface HomeService {
  name: string
  description: string
  price: number
  category: ServiceCategory
  type: ServiceType | null
}

export const services: HomeService[] = [
  {
    name: 'Premium For Suede',
    description:
      'Perawatan khusus untuk sepatu suede agar kembali memiliki dua side gelap dan terang serta lembut kembali.',
    price: 120000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Mild',
    description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu tetap bersih.',
    price: 60000,
    category: ServiceCategory.SHOE_WASH,
    type: null,
  },
  {
    name: 'Medium',
    description: 'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda cenderung ringan.',
    price: 65000,
    category: ServiceCategory.SHOE_WASH,
    type: null,
  },
  {
    name: 'Hard',
    description:
      'Pencucian bagian luar dan dalam pada sepatu yang terdapat noda berat atau cenderung berat.',
    price: 70000,
    category: ServiceCategory.SHOE_WASH,
    type: null,
  },
  {
    name: 'Kids Shoes',
    description: 'Pencucian bagian luar dan dalam untuk menjaga sepatu anak tetap bersih.',
    price: 40000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Just For Her',
    description:
      'Pencucian bagian luar dan dalam untuk menjaga sepatu wanita tetap bersih. (Flat shoes, heels, wedges, dan flip flops)',
    price: 45000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Unyellowing',
    description: 'Pencucian untuk menghilangkan warna kuning.',
    price: 30000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.START_FROM,
  },
  {
    name: 'White Shoes / Mummy',
    description: 'Tambahan jasa perawatan khusus sepatu putih',
    price: 10000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.ADDITIONAL,
  },
  {
    name: 'Nubuck Suede',
    description: 'Perawatan khusus sepatu nubuck suede',
    price: 10000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.ADDITIONAL,
  },
  {
    name: 'Small Canvas/Fabric',
    description: 'Cuci tas kecil berbahan Canvas/Fabric',
    price: 40000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Medium Canvas/Fabric',
    description: 'Cuci tas sedang berbahan Canvas/Fabric',
    price: 55000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Large Canvas/Fabric',
    description: 'Cuci tas besar berbahan Canvas/Fabric',
    price: 70000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Extra Large Canvas/Fabric',
    description: 'Cuci tas extra besar berbahan Canvas/Fabric',
    price: 85000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Small Leather/Nubuck',
    description: 'Cuci tas kecil berbahan Leather/Nubuck',
    price: 60000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Medium Leather/Nubuck',
    description: 'Cuci tas sedang berbahan Leather/Nubuck',
    price: 75000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Large Leather/Nubuck',
    description: 'Cuci tas besar berbahan Leather/Nubuck',
    price: 85000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Extra Large Leather/Nubuck',
    description: 'Cuci tas extra besar berbahan Leather/Nubuck',
    price: 100000,
    category: ServiceCategory.BAG_WASH,
    type: null,
  },
  {
    name: 'Helmet SPA Reguler',
    description: 'Cuci helm SPA reguler',
    price: 35000,
    category: ServiceCategory.HELMET_WASH,
    type: null,
  },
  {
    name: 'Helmet SPA Premium',
    description: 'Cuci helm SPA premium',
    price: 70000,
    category: ServiceCategory.HELMET_WASH,
    type: null,
  },
  {
    name: 'Premium Repaint',
    description: 'Pewarnaan sepatu di bagian upper sepatu',
    price: 150000,
    category: ServiceCategory.SHOE_REPAIR,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Midsole Repaint / Recolour',
    description: 'Pewarnaan sepatu di bagian midsole sepatu',
    price: 180000,
    category: ServiceCategory.SHOE_REPAIR,
    type: null,
  },
  {
    name: 'One Day Service',
    description: 'Pencucian sepatu dalam satu hari',
    price: 10000,
    category: ServiceCategory.ADDITIONAL,
    type: ServiceType.ADDITIONAL,
  },
]
