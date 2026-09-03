# Reports — Guide

Where an admin answers "how much did we make, and from what?"

## Choosing a period

The report covers a date range. If none is given, it shows the **last 30 days**
up to today.

If the dates are entered backwards — an end date before the start date — the app
quietly swaps them rather than complaining. You get the range you obviously
meant.

## The headline figures

**Total revenue** — money actually settled in the period. Orders that were
priced but never paid contribute nothing.

**Paid orders** — how many distinct orders that money came from.

**Average order value** — revenue divided by orders, rounded to a whole number.
When nothing was paid, it shows zero rather than an error.

## Daily revenue

A day-by-day series across the range.

Days with no revenue appear as zero rather than being skipped, so the shape of
the chart is honest — a quiet stretch looks quiet instead of being squeezed out.

## By payment method

Revenue and order count for cash, QRIS, and debit.

Every method is listed even if it was never used, showing zero. This keeps the
breakdown stable between periods.

Two things affect how you read this. Payments confirmed by hand through
[reconciliation](../reconciliation/) appear under whichever method the admin
selected — so the accuracy of this breakdown depends on admins choosing
correctly. And counter orders record their method directly at the till.

## By order type

The same split across online, offline, and walk-in-with-delivery orders. Useful
for seeing how much of the business comes through the app versus over the
counter.

## Top services

The ten catalogue services that earned the most in the period, with their
category and revenue.

**One caveat worth knowing.** Alongside revenue there is a count, and that count
is the number of _service lines_, not orders. An order with three services on it
adds three. So this number will not line up with the paid-orders figure at the
top, and it is not meant to — it answers "how often was this service applied",
which is the useful question for a service.

## Exporting

The export produces a spreadsheet with the **daily revenue series** — one row per
day, with the date and the amount. The filename carries the date range.

Note that the export contains only that series. The payment-method split, the
type split, and the top-services table are on screen but not in the file. If you
need those in a spreadsheet, they would have to be added.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**Report over the default 30-day range**

| Desktop                                                                                            | Tablet                                                                                           | Mobile                                                                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| ![Report over the default 30-day range — desktop](../../../assets/admin-reports-index-desktop.png) | ![Report over the default 30-day range — tablet](../../../assets/admin-reports-index-tablet.png) | ![Report over the default 30-day range — mobile](../../../assets/admin-reports-index-mobile.png) |

**Report over an explicit range**

| Desktop                                                                                     | Tablet                                                                                    | Mobile                                                                                    |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ![Report over an explicit range — desktop](../../../assets/admin-reports-range-desktop.png) | ![Report over an explicit range — tablet](../../../assets/admin-reports-range-tablet.png) | ![Report over an explicit range — mobile](../../../assets/admin-reports-range-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
