import WhatsappService from '#notifications/whatsapp_service'
import OrderAction from '#models/order_action'
import OrderItem from '#models/order_item'
import { core } from '#config/midtrans'
import GeocodingService, { type GeocodeResult } from '#services/geocoding_service'
import NearbyService, { type NearbyPlace } from '#services/nearby_service'
import transmit from '@adonisjs/transmit/services/main'

export type SentMessage = { target: string; body: string }

export class FakeWhatsappService extends WhatsappService {
  messages: SentMessage[] = []

  #refused = new Set<string>()

  get lastMessage(): SentMessage | undefined {
    return this.messages.at(-1)
  }

  messageTo(target: string): SentMessage | undefined {
    return this.messages.find((message) => message.target === target)
  }

  /**
   * Makes one number fail the way an unreachable handset would, leaving the
   * rest of a batch to go through.
   */
  refuse(target: string): void {
    this.#refused.add(target)
  }

  #record(target: string, body: string): void {
    if (this.#refused.has(target)) {
      throw new Error('Gagal mengirim pesan WhatsApp.')
    }

    this.messages.push({ target, body })
  }

  async sendPasswordResetLink(target: string, resetUrl: string): Promise<void> {
    this.#record(target, resetUrl)
  }

  async sendVerificationLink(target: string, verificationUrl: string): Promise<void> {
    this.#record(target, verificationUrl)
  }

  async sendPhoneChangeNotice(target: string, newPhone: string): Promise<void> {
    this.#record(target, newPhone)
  }

  async sendPaymentReminder(target: string, orderNumber: string, amount: string): Promise<void> {
    this.#record(target, `${orderNumber} ${amount}`)
  }

  async sendReadyForCollection(target: string, orderNumber: string): Promise<void> {
    this.#record(target, orderNumber)
  }
}

export class BrokenWhatsappService extends WhatsappService {
  async sendPasswordResetLink(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }

  async sendVerificationLink(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }

  async sendPhoneChangeNotice(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }

  async sendPaymentReminder(): Promise<void> {
    throw new Error('Gagal mengirim pesan WhatsApp.')
  }

  async sendReadyForCollection(): Promise<void> {
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

export function stubOrderActionFailure(): () => void {
  const model = OrderAction as unknown as { create: (...args: unknown[]) => Promise<unknown> }
  const original = model.create

  model.create = async () => {
    throw new Error('order action insert failed')
  }

  return () => {
    model.create = original
  }
}

export function stubOrderItemFailure(): () => void {
  const model = OrderItem as unknown as { createMany: (...args: unknown[]) => Promise<unknown> }
  const original = model.createMany

  model.createMany = async () => {
    throw new Error('order item insert failed')
  }

  return () => {
    model.createMany = original
  }
}

export type BroadcastRecorder = {
  messages: Record<string, unknown>[]
  on(channel: string): Record<string, unknown>[]
  restore(): void
}

export function recordBroadcasts(): BroadcastRecorder {
  const service = transmit as unknown as {
    broadcast: (channel: string, payload?: unknown) => void
  }

  const original = service.broadcast
  const sent: { channel: string; payload: Record<string, unknown> }[] = []

  service.broadcast = (channel, payload) => {
    sent.push({ channel, payload: (payload ?? {}) as Record<string, unknown> })
  }

  return {
    get messages() {
      return sent.map((entry) => entry.payload)
    },
    on(channel: string) {
      return sent.filter((entry) => entry.channel === channel).map((entry) => entry.payload)
    },
    restore() {
      service.broadcast = original
    },
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
