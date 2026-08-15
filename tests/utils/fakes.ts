import FonnteService from '#services/fonnte_service'
import { core } from '#config/midtrans'
import GeocodingService, { type GeocodeResult } from '#services/geocoding_service'
import NearbyService, { type NearbyPlace } from '#services/nearby_service'

export type SentMessage = { target: string; body: string }

export class FakeFonnteService extends FonnteService {
  messages: SentMessage[] = []

  get lastMessage(): SentMessage | undefined {
    return this.messages.at(-1)
  }

  async sendPasswordResetLink(target: string, resetUrl: string): Promise<void> {
    this.messages.push({ target, body: resetUrl })
  }

  async sendVerificationLink(target: string, verificationUrl: string): Promise<void> {
    this.messages.push({ target, body: verificationUrl })
  }

  async sendPaymentReminder(target: string, orderNumber: string, amount: string): Promise<void> {
    this.messages.push({ target, body: `${orderNumber} ${amount}` })
  }

  async sendReadyForCollection(target: string, orderNumber: string): Promise<void> {
    this.messages.push({ target, body: orderNumber })
  }
}

export class BrokenFonnteService extends FonnteService {
  async sendPasswordResetLink(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }

  async sendVerificationLink(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }
}

export class FakeGeocodingService extends GeocodingService {
  constructor(private results: GeocodeResult[] = []) {
    super()
  }

  async search(): Promise<GeocodeResult[]> {
    return this.results
  }
}

export class BrokenGeocodingService extends GeocodingService {
  async search(): Promise<GeocodeResult[]> {
    throw new Error('Layanan pencarian lokasi sedang tidak tersedia.')
  }
}

export class FakeNearbyService extends NearbyService {
  constructor(private places: NearbyPlace[] = []) {
    super()
  }

  async search(): Promise<NearbyPlace[]> {
    return this.places
  }
}

export class BrokenNearbyService extends NearbyService {
  async search(): Promise<NearbyPlace[]> {
    throw new Error('Layanan lokasi terdekat sedang tidak tersedia.')
  }
}

/**
 * Replaces the Midtrans charge call for the duration of a test and hands back
 * the restore function. `core` is a module-level singleton, so there is nothing
 * to swap in the container.
 */
export function stubMidtransCharge(
  handler: (parameter: Record<string, unknown>) => unknown
): () => void {
  const client = core as { charge: (parameter: Record<string, unknown>) => Promise<unknown> }
  const original = client.charge

  client.charge = async (parameter) => handler(parameter)

  return () => {
    client.charge = original
  }
}

export function midtransQrResponse(overrides: Record<string, unknown> = {}) {
  return {
    transaction_id: 'mt-test-1',
    order_id: 'ORDTEST-1',
    actions: [
      { name: 'generate-qr-code', url: 'https://api.sandbox.midtrans.com/v2/qris/test/qr-code' },
    ],
    ...overrides,
  }
}
