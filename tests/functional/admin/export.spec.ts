import { OrderFactory } from '#database/factories/order_factory'
import { UserFactory } from '#database/factories/user_factory'
import { OrderStatus } from '#enums/order_status_enum'
import { PaymentMethod, TransactionStatus } from '#enums/transaction_enum'
import { ServiceCategory, ServiceType } from '#enums/service_enum'
import type Order from '#models/order'
import Service from '#models/service'
import Transaction from '#models/transaction'
import { ApiRequest, type ApiResponse } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import ExcelJS from 'exceljs'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Superagent parses text and JSON out of the box and hands everything else
 * back empty, so without this the body of every export would assert as `{}`.
 * Collecting the chunks is what lets these tests open the workbook and check
 * what is actually inside it rather than trusting the status code.
 */
ApiRequest.addParser(XLSX_MIME, (response, callback) => {
  const chunks: Buffer[] = []

  response.on('data', (chunk: Buffer) => chunks.push(chunk))
  response.on('end', () => callback(null, Buffer.concat(chunks)))
})

/**
 * The rows of one sheet, headers excluded, as plain values.
 */
async function readSheet(response: ApiResponse, name: string): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(response.body())

  const worksheet = workbook.getWorksheet(name)
  if (!worksheet) {
    throw new Error(`The workbook has no "${name}" sheet`)
  }

  const rows: unknown[][] = []

  worksheet.eachRow((row, index) => {
    if (index === 1) return

    rows.push((row.values as unknown[]).slice(1))
  })

  return rows
}

function payFor(order: Order, status: TransactionStatus = TransactionStatus.PAID) {
  return Transaction.create({
    orderId: order.id,
    paymentMethod: PaymentMethod.CASH,
    midtransOrderId: null,
    midtransTransactionId: null,
    status,
    qrCode: null,
  })
}

test.group('Admin Export', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('every admin export answers with a downloadable spreadsheet', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350000001' }).create()

    const paths = [
      '/admin/dashboard/export',
      '/admin/orders/export',
      '/admin/reconciliations/export',
      '/admin/services/export',
      '/admin/users/export',
      '/admin/reports/export',
    ]

    for (const path of paths) {
      const response = await client.get(path).loginAs(admin)

      response.assertStatus(200)
      assert.include(String(response.header('content-type')), XLSX_MIME)
      assert.include(String(response.header('content-disposition')), 'attachment')
    }
  })

  test('the filename says what the file is and when it was taken', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350000002' }).create()

    const response = await client.get('/admin/orders/export').loginAs(admin)

    assert.match(
      String(response.header('content-disposition')),
      /^attachment; filename="umimaclean-pesanan-\d{8}-\d{4}\.xlsx"$/
    )
  })

  test('the order export carries every order, not just the first page', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350001001' }).create()
    await OrderFactory.createMany(12)

    const response = await client.get('/admin/orders/export').loginAs(admin)

    assert.lengthOf(await readSheet(response, 'Pesanan'), 12)
  })

  /**
   * The whole point of building the export on the same query as the screen: a
   * file that quietly widened the list would be a different answer to the one
   * the admin asked for.
   */
  test('the order export honours the filters the monitor is showing', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350002001' }).create()

    const walkIn = await OrderFactory.apply('offline')
      .merge({ customerName: 'Siti Rahayu' })
      .create()
    await OrderFactory.merge({ customerName: 'Budi Santoso' }).create()

    const response = await client
      .get('/admin/orders/export')
      .qs({ type: 'offline', search: 'Siti' })
      .loginAs(admin)

    const rows = await readSheet(response, 'Pesanan')

    assert.lengthOf(rows, 1)
    assert.equal(rows[0][0], walkIn.orderNumber)
    assert.equal(rows[0][3], 'Siti Rahayu')
  })

  /**
   * `page` is the one filter the export ignores — a file of the ten rows that
   * happened to be on screen is not an export.
   */
  test('a page number in the query string does not shorten the export', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350002002' }).create()
    await OrderFactory.createMany(12)

    const response = await client.get('/admin/orders/export').qs({ page: 2 }).loginAs(admin)

    assert.lengthOf(await readSheet(response, 'Pesanan'), 12)
  })

  test('the order export writes money as a number and the status in Indonesian', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350003001' }).create()

    await OrderFactory.merge({ status: OrderStatus.COMPLETED, totalPrice: 85000 }).create()

    const [row] = await readSheet(
      await client.get('/admin/orders/export').loginAs(admin),
      'Pesanan'
    )

    assert.equal(row[2], 'Selesai')
    assert.strictEqual(row[10], 85000)
  })

  test('the reconciliation export lists only the orders awaiting payment', async ({
    client,
    assert,
  }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350004001' }).create()

    const stuck = await OrderFactory.apply('waitingPayment').create()
    await payFor(stuck, TransactionStatus.PENDING)
    await OrderFactory.apply('completed').create()

    const rows = await readSheet(
      await client.get('/admin/reconciliations/export').loginAs(admin),
      'Rekonsiliasi'
    )

    assert.lengthOf(rows, 1)
    assert.equal(rows[0][0], stuck.orderNumber)
    assert.equal(rows[0][4], 'Tertunda')
  })

  test('the service export is the price list', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350005001' }).create()

    await Service.create({
      name: 'Cuci Sepatu Reguler',
      description: 'Cuci sepatu standar',
      category: ServiceCategory.SHOE_WASH,
      type: ServiceType.REGULAR,
      price: 30000,
    })

    const [row] = await readSheet(
      await client.get('/admin/services/export').loginAs(admin),
      'Layanan'
    )

    assert.equal(row[0], 'Cuci Sepatu Reguler')
    assert.equal(row[2], 'Cuci Sepatu')
    assert.strictEqual(row[4], 30000)
  })

  test('the user export follows the role tab', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350006001' }).create()
    await UserFactory.apply('staff').merge({ phone: '081350006002' }).create()
    await UserFactory.merge({ phone: '081350006003' }).create()

    const rows = await readSheet(
      await client.get('/admin/users/export').qs({ role: 'staff' }).loginAs(admin),
      'Pengguna'
    )

    assert.lengthOf(rows, 1)
    assert.equal(rows[0][1], '081350006002')
    assert.equal(rows[0][2], 'Petugas')
  })

  /**
   * An export is a file that leaves the server and lands in a downloads
   * folder. A password hash must never be one of its columns.
   */
  test('the user export never carries a password', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350006004' }).create()

    const response = await client.get('/admin/users/export').loginAs(admin)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(response.body())

    const headers = workbook.getWorksheet('Pengguna')!.getRow(1).values as string[]

    assert.deepEqual(headers.slice(1), ['Nama', 'Telepon', 'Peran', 'Bergabung'])
  })

  test('the report export splits each section onto its own sheet', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350007001' }).create()

    const paid = await OrderFactory.merge({
      status: OrderStatus.COMPLETED,
      totalPrice: 80000,
    }).create()
    await payFor(paid)

    const response = await client.get('/admin/reports/export').loginAs(admin)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(response.body())

    assert.deepEqual(
      workbook.worksheets.map((worksheet) => worksheet.name),
      ['Ringkasan', 'Pendapatan Harian', 'Metode Pembayaran', 'Tipe Pesanan', 'Layanan Terlaris']
    )

    const mix = await readSheet(response, 'Metode Pembayaran')
    const cash = mix.find((row) => row[0] === 'Tunai')

    assert.strictEqual(cash![2], 80000)
  })

  test('the report export covers the range in the query string', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350007002' }).create()

    const response = await client
      .get('/admin/reports/export')
      .qs({ from: '2026-07-01', to: '2026-07-10' })
      .loginAs(admin)

    assert.lengthOf(await readSheet(response, 'Pendapatan Harian'), 10)
  })

  test('the dashboard export holds one sheet per panel', async ({ client, assert }) => {
    const admin = await UserFactory.apply('admin').merge({ phone: '081350008001' }).create()
    await OrderFactory.createMany(3)

    const response = await client.get('/admin/dashboard/export').loginAs(admin)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(response.body())

    assert.deepEqual(
      workbook.worksheets.map((worksheet) => worksheet.name),
      [
        'Ringkasan',
        'Pesanan per Status',
        'Online vs Offline',
        'Tren Pendapatan',
        'Beban Penjemputan',
        'Pesanan Terbaru',
      ]
    )

    const summary = await readSheet(response, 'Ringkasan')
    assert.strictEqual(summary.find((row) => row[0] === 'Total Pesanan')![1], 3)
  })

  test('staff cannot download an admin export', async ({ client }) => {
    const staff = await UserFactory.apply('staff').merge({ phone: '081350009001' }).create()

    const response = await client.get('/admin/orders/export').withInertia().loginAs(staff)

    response.assertRedirectsTo('/staff/trips')
  })

  test('a guest cannot download an admin export', async ({ client }) => {
    const response = await client.get('/admin/orders/export').withInertia()

    response.assertRedirectsTo('/login')
  })
})
