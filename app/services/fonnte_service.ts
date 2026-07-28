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
