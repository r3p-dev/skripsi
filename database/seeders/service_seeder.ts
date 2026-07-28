import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import Service from '#models/service'

/**
 * The catalogue an order is priced from.
 *
 * Nothing works without it: the booking form, the inspection screen and the
 * walk-in form all read this table, and until now its rows had to be inserted
 * by hand on every fresh database.
 *
 * `START_FROM` marks a price that depends on how bad the damage turns out to
 * be, so the page prints "Mulai dari" instead of a firm figure.
 */
const SERVICES = [
  {
    name: 'Deep Clean Sepatu',
    description: 'Pembersihan menyeluruh bagian luar, dalam, midsole, dan tali sepatu.',
    price: 35000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
  },
  {
    name: 'Fast Clean Sepatu',
    description: 'Pembersihan cepat bagian luar sepatu, selesai di hari yang sama.',
    price: 25000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
  },
  {
    name: 'Deep Clean Sepatu Premium',
    description: 'Penanganan khusus untuk bahan suede, nubuck, dan kulit asli.',
    price: 60000,
    category: ServiceCategory.SHOE_WASH,
    type: ServiceType.REGULAR,
  },
  {
    name: 'Cuci Tas',
    description: 'Pembersihan tas kain maupun kulit beserta bagian dalamnya.',
    price: 45000,
    category: ServiceCategory.BAG_WASH,
    type: ServiceType.REGULAR,
  },
  {
    name: 'Cuci Helm',
    description: 'Pembersihan batok, busa dalam, dan visor helm.',
    price: 40000,
    category: ServiceCategory.HELMET_WASH,
    type: ServiceType.REGULAR,
  },
  {
    name: 'Repaint Sepatu',
    description: 'Pengecatan ulang sepatu yang warnanya sudah pudar.',
    price: 90000,
    category: ServiceCategory.SHOE_REPAIR,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Lem Sol Sepatu',
    description: 'Perekatan ulang sol sepatu yang terlepas.',
    price: 30000,
    category: ServiceCategory.SHOE_REPAIR,
    type: ServiceType.START_FROM,
  },
  {
    name: 'Unyellowing',
    description: 'Menghilangkan noda menguning pada midsole karet.',
    price: 25000,
    category: ServiceCategory.ADDITIONAL,
    type: ServiceType.ADDITIONAL,
  },
  {
    name: 'Anti Bau',
    description: 'Perawatan tambahan untuk menghilangkan bau pada bagian dalam.',
    price: 15000,
    category: ServiceCategory.ADDITIONAL,
    type: ServiceType.ADDITIONAL,
  },
  {
    name: 'Water Repellent',
    description: 'Pelapis anti air untuk menjaga sepatu tetap bersih lebih lama.',
    price: 20000,
    category: ServiceCategory.ADDITIONAL,
    type: ServiceType.ADDITIONAL,
  },
]

export default class extends BaseSeeder {
  async run() {
    /**
     * Matched on the name so re-running the seeder tops up anything missing
     * without duplicating what is already there — and without overwriting a
     * price the admin has since changed in the catalogue screen.
     */
    const existing = await Service.query().select('name')
    const names = new Set(existing.map((service) => service.name))

    const missing = SERVICES.filter((service) => !names.has(service.name))

    if (missing.length > 0) {
      await Service.createMany(missing)
    }
  }
}
