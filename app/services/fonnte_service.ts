import env from '#start/env'

type FonnteResponse = {
  status: boolean
  reason: string
  detail: unknown
}

/**
 * Sends WhatsApp messages through the Fonnte API.
 */
export default class FonnteService {
  /**
   * Sends a password reset link to a customer's WhatsApp number.
   */
  async sendPasswordResetLink(target: string, resetUrl: string): Promise<void> {
    await this.sendMessage(
      target,
      [
        'Umima.Clean menerima permintaan reset password untuk akun Anda.',
        'Klik link berikut untuk membuat password baru:',
        resetUrl,
        'Abaikan pesan ini jika Anda tidak meminta reset password.',
      ].join('\n\n')
    )
  }

  /**
   * Sends a link that verifies ownership of a new phone number.
   */
  async sendVerificationLink(target: string, verificationUrl: string): Promise<void> {
    await this.sendMessage(
      target,
      [
        'Umima.Clean menerima permintaan perubahan nomor telepon untuk akun Anda.',
        'Klik link berikut untuk verifikasi nomor telepon:',
        verificationUrl,
        'Abaikan pesan ini jika Anda tidak meminta perubahan nomor telepon.',
      ].join('\n\n')
    )
  }

  /**
   * Reminds a customer that an order is still waiting to be paid for.
   *
   * Sent by hand from the counter rather than on a timer: staff are the ones
   * who can see that a customer simply forgot, as opposed to one who is
   * deciding, and an automatic nag to the second group costs goodwill.
   */
  async sendPaymentReminder(target: string, orderNumber: string, amount: string): Promise<void> {
    await this.sendMessage(
      target,
      [
        `Halo! Pesanan ${orderNumber} di Umima.Clean masih menunggu pembayaran sebesar ${amount}.`,
        'Silakan selesaikan pembayaran agar pesanan Anda dapat segera kami proses.',
        'Abaikan pesan ini jika Anda sudah membayar.',
      ].join('\n\n')
    )
  }

  /**
   * Tells a walk-in customer their shoes are washed and waiting at the shop.
   *
   * Only counter orders get this. An order that is being delivered needs no
   * message — it turns up at the door on its own.
   */
  async sendReadyForCollection(target: string, orderNumber: string): Promise<void> {
    await this.sendMessage(
      target,
      [
        `Kabar baik! Pesanan ${orderNumber} sudah selesai dicuci.`,
        'Barang Anda sudah siap diambil di toko Umima.Clean pada jam operasional.',
        'Terima kasih sudah mempercayakan perawatan barang Anda kepada kami.',
      ].join('\n\n')
    )
  }

  /**
   * Delivers a message and fails loudly when it is not accepted.
   *
   * Fonnte answers with HTTP 200 even when it rejects a message, so the
   * response payload's own `status` flag has to be checked as well.
   *
   * @throws {Error} When the API is unreachable or rejects the message.
   */
  private async sendMessage(target: string, message: string): Promise<void> {
    let response: Response

    try {
      response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': env.get('FONNTE_API_KEY').release(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, message, preview: false }),
      })
    } catch {
      throw new Error('Tidak dapat terhubung ke layanan WhatsApp.')
    }

    const payload = (await response.json()) as FonnteResponse

    if (!response.ok || !payload.status) {
      throw new Error('Gagal mengirim pesan WhatsApp.')
    }
  }
}
