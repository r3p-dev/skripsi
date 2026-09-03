import type Order from '#models/order'

export default class OrderCreated {
  constructor(readonly order: Order) {}
}
