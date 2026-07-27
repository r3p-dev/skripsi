import { registry } from '@/generated/registry'
import { createTuyau } from '@tuyau/core/client'

export const client = createTuyau({
  baseUrl: window.location.origin,
  registry,
})

export const urlFor = client.urlFor
