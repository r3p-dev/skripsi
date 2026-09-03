import type Order from '#models/order'

export default class OrderPriceCorrected {
  constructor(readonly order: Order) {}
}
