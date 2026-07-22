import env from '#start/env'

/**
 * Response payload returned by the Fonnte message delivery API.
 *
 * The API indicates request success through both the HTTP status code and
 * the `status` field contained within the response body.
 */
type FonnteResponse = {
  status: boolean
  reason: string
  detail: unknown
}

/**
 * Provides integration with the Fonnte WhatsApp messaging platform.
 *
 * Responsibilities:
 * - Deliver transactional WhatsApp messages.
 * - Handle communication with the Fonnte API.
 * - Surface delivery failures as application-level exceptions.
 */
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
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': env.get('FONNTE_API_KEY').release(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message: [
          'Umima.Clean menerima permintaan reset password untuk akun Anda.',
          'Klik link berikut untuk membuat password baru:',
          `${token}`,
          'Abaikan pesan ini jika Anda tidak meminta reset password.',
        ].join('\n\n'),
        preview: false,
      }),
    })

    const payload = (await response.json()) as FonnteResponse

    if (!response.ok || payload.status === false) {
      throw new Error(payload.reason ?? `Fonnte request failed with HTTP ${response.status}`)
    }
  }
}
