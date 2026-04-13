import type { HttpContext } from '@adonisjs/core/http'

export default class DownloadController {
  async handle({ params, response, session, logger }: HttpContext) {
    try {
      const qrUrl = `https://merchants-app.sbx.midtrans.com/v4/qris/gopay/${params.qr}/qr-code`

      const res = await fetch(qrUrl)

      if (!res.ok) {
        logger.warn(`Failed fetching QRIS (${res.status}) for ${params.number}`)
        session.flash('general_errors', 'Gagal mengambil QR dari Midtrans')
        return response.redirect().back()
      }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.startsWith('image')) {
        logger.warn(`Unexpected content-type "${contentType}" for QRIS ${params.number}`)
        session.flash('general_errors', 'Format QR tidak valid')
        return response.redirect().back()
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      response.header('Content-Type', 'image/png')
      response.header('Content-Disposition', `attachment; filename="qris-${params.number}.png"`)
      response.header('Cache-Control', 'no-store')
      return response.send(buffer)
    } catch (error) {
      logger.error('Error downloading QRIS:', error)
      session.flash('general_errors', 'Gagal mengunduh QRIS')
      return response.redirect().back()
    }
  }
}
