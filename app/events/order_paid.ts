import type Order from '#models/order'

export default class OrderPaid {
  constructor(readonly order: Order) {}
}
