/**
 * Where the shop physically stands.
 *
 * Every distance the product measures starts here: the service-area check a
 * customer's address is tested against, and the route staff drive when they
 * collect and deliver. Both used to carry their own copy of these numbers,
 * which meant moving the shop was two edits in two unrelated files and a
 * silent bug if only one of them happened.
 */
export const shop = {
  latitude: -6.9555305,
  longitude: 107.6540353,
} as const
