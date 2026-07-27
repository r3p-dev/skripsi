import env from '#start/env'

type FonnteResponse = {
  status: boolean
  reason: string
  detail: unknown
}

export default class FonnteService {
  /**
   * Send a password reset message to a customer's WhatsApp number.
   *
   * The message contains a password reset link that allows the customer to
   * create a new password. Delivery success is determined using both the
   * HTTP response status and the API-specific response payload.
   *
   * @param target - Recipient WhatsApp phone number.
   * @param token - Signed password reset URL included in the message.
   * @returns A promise that resolves when the message has been accepted by
   * the Fonnte API.
   * @throws {Error}
   * Thrown when the Fonnte API request fails or the message is rejected by
   * the provider.
   */
  async sendPasswordResetLink(target: string, token: string): Promise<void> {
    let response: Response

    try {
      response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': env.get('FONNTE_API_KEY').release(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message: [
            'Umima.Clean menerima permintaan reset password untuk akun Anda.',
            'Klik link berikut untuk membuat password baru:',
            token,
            'Abaikan pesan ini jika Anda tidak meminta reset password.',
          ].join('\n\n'),
          preview: false,
        }),
      })
    } catch {
      throw new Error('Tidak dapat terhubung ke layanan WhatsApp.')
    }

    const payload = (await response.json()) as FonnteResponse

    if (!response.ok || !payload.status) {
      throw new Error('Gagal mengirim pesan WhatsApp.')
    }
  }

  /**
   * Send a password reset message to a customer's WhatsApp number.
   *
   * The message contains a verification link that allows the customer to
   * verify their new phone number. Delivery success is determined using
   * both the HTTP response status and the API-specific response payload.
   *
   * @param target - Recipient WhatsApp phone number.
   * @param token - Signed password reset URL included in the message.
   * @returns A promise that resolves when the message has been accepted by
   * the Fonnte API.
   * @throws {Error}
   * Thrown when the Fonnte API request fails or the message is rejected by
   * the provider.
   */
  async sendVerificationLink(target: string, token: string): Promise<void> {
    let response: Response

    try {
      response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': env.get('FONNTE_API_KEY').release(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message: [
            'Umima.Clean menerima permintaan perubahan nomor telepon untuk akun Anda.',
            'Klik link berikut untuk verifikasi nomor telepon:',
            token,
            'Abaikan pesan ini jika Anda tidak meminta perubahan nomor telepon.',
          ].join('\n\n'),
          preview: false,
        }),
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
