import env from '#start/env'

type FonnteResponse = {
  status: boolean
  reason: string
  detail: unknown
}

export default class FonnteService {
  async sendPasswordResetLink(target: string, resetUrl: string): Promise<void> {
    await this.#sendMessage(
      target,
      [
        'Umima.Clean menerima permintaan reset password untuk akun Anda.',
        'Klik link berikut untuk membuat password baru:',
        resetUrl,
        'Abaikan pesan ini jika Anda tidak meminta reset password.',
      ].join('\n\n')
    )
  }

  async sendVerificationLink(target: string, verificationUrl: string): Promise<void> {
    await this.#sendMessage(
      target,
      [
        'Umima.Clean menerima permintaan perubahan nomor telepon untuk akun Anda.',
        'Klik link berikut untuk verifikasi nomor telepon:',
        verificationUrl,
        'Abaikan pesan ini jika Anda tidak meminta perubahan nomor telepon.',
      ].join('\n\n')
    )
  }

  async sendPaymentReminder(target: string, orderNumber: string, amount: string): Promise<void> {
    await this.#sendMessage(
      target,
      [
        `Halo! Pesanan ${orderNumber} di Umima.Clean masih menunggu pembayaran sebesar ${amount}.`,
        'Silakan selesaikan pembayaran agar pesanan Anda dapat segera kami proses.',
        'Abaikan pesan ini jika Anda sudah membayar.',
      ].join('\n\n')
    )
  }

  async sendReadyForCollection(target: string, orderNumber: string): Promise<void> {
    await this.#sendMessage(
      target,
      [
        `Kabar baik! Pesanan ${orderNumber} sudah selesai dicuci.`,
        'Barang Anda sudah siap diambil di toko Umima.Clean pada jam operasional.',
        'Terima kasih sudah mempercayakan perawatan barang Anda kepada kami.',
      ].join('\n\n')
    )
  }

  async #sendMessage(target: string, message: string): Promise<void> {
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
