# Cleaning & Collection — TL;DR

The back half of the workflow: washing the goods, telling the customer they are
ready, and handing them over. Plus the printable tag.

![Printable tag attached to the physical goods](../../../assets/staff-cleaning-collection-tag-mobile.png)

## The five things to know

1. **Neither is claimed.** Several people work the wash area at once, so
   cleaning and collection are shared, not locked.
2. **Finishing cleaning branches on deliverability.** Order has an address →
   `in_delivery`. No address → `cleaning_done` (collect at shop).
3. **Cleaning needs a photo. Collection does not.**
4. **Nobody sends the ready-notice by hand.** A daily command messages every
   order waiting to be collected; a `ready_notice_sent` action stops anyone
   being told twice.
5. **A WhatsApp failure blocks nothing.** The failed order simply stays due and
   is retried on the next day's run.

## Routes at a glance

| Method | URL                               | Purpose                      |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/staff/tasks/:number/cleaning`   | Mark washed (photo required) |
| POST   | `/staff/tasks/:number/collection` | Mark handed over             |
| GET    | `/staff/tasks/:number/tag`        | Printable tag for the goods  |

The ready-for-pickup WhatsApp has no route — `node ace send:daily-notices` sends
it once a day.

## The branch

```ts
nextStatuses(order) {
  if (order.status !== IN_CLEANING) return ORDER_TRANSITIONS[order.status]
  return this.isDeliverable(order) ? [IN_DELIVERY] : [CLEANING_DONE]
}
```

## The gotcha

**Collection completes an order without a photo or a claim.** It is the lightest
action in the app — anyone on shift can mark goods handed over. If you are
looking for an audit trail of who released the goods, it is the `collected`
action record, not a claim.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
