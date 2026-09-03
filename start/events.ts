import emitter from '@adonisjs/core/services/emitter'
import OrderCreated from '#events/order_created'
import OrderPaid from '#events/order_paid'
import OrderPriceCorrected from '#events/order_price_corrected'
import OrderStatusChanged from '#events/order_status_changed'

const BroadcastOrderToAdmin = () => import('#listeners/broadcast_order_to_admin')

emitter.on(OrderCreated, [BroadcastOrderToAdmin, 'onCreated'])
emitter.on(OrderStatusChanged, [BroadcastOrderToAdmin, 'onStatusChanged'])
emitter.on(OrderPriceCorrected, [BroadcastOrderToAdmin, 'onPriceCorrected'])
emitter.on(OrderPaid, [BroadcastOrderToAdmin, 'onPaid'])
