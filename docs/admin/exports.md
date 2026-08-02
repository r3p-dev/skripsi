# Admin — Excel Exports

Every admin screen has an export button. They all go through one service, and the
interesting parts are the two coercion helpers that stop the file being subtly
wrong.

**Code:** [`excel_service.ts`](../../app/services/excel_service.ts) ·
[`export_button.tsx`](../../inertia/components/molecules/export_button.tsx) ·
the `*_COLUMNS` definitions in each admin controller

---

## 1. The two promises an export makes

**The file matches the screen.** Every export reads its filters with the *same*
`filtersFrom(query)` method the list page uses and builds on the *same* private
query builder, so a file can never quietly widen or narrow the list. The only
thing ignored is `page`:

> A file of the ten rows that happened to be on screen is not what anyone means
> by an export.

**The numbers are numbers.** Amounts are written as real currency values and
dates as real dates, so a column can be summed, sorted, filtered and charted.
Nothing arrives as text that only looks like a figure.

Keeping both promises is what §3 and §4 are about.

---

## 2. The building blocks

`ExcelService` knows nothing about orders, users or services. Callers flatten
their own data first:

```ts
export type Column<T> = {
  header: string
  width?: number          // in characters, default 18
  format?: string         // an Excel number format, e.g. RUPIAH_FORMAT
  value: (row: T) => CellValue
}

export type CellValue = string | number | Date | null
```

```ts
export function sheet<T>(definition: { name: string; columns: Column<T>[]; rows: T[] }): Sheet {
  return {
    name:    sheetName(definition.name),
    headers: definition.columns.map((c) => c.header),
    widths:  definition.columns.map((c) => c.width ?? DEFAULT_WIDTH),
    formats: definition.columns.map((c) => c.format),
    rows:    definition.rows.map((row) => definition.columns.map((c) => c.value(row))),
  }
}
```

> **This is where the generic disappears.** Each caller declares its columns
> against its own record type and gets back a plain `Sheet`. That is what lets one
> workbook — the dashboard's — hold six sheets built from six unrelated shapes.

Formats:

```ts
export const RUPIAH_FORMAT   = '"Rp"#,##0'
export const DATE_FORMAT     = 'dd/mm/yyyy'
export const DATETIME_FORMAT = 'dd/mm/yyyy hh:mm'
```

`RUPIAH_FORMAT` keeps the cell a **number** that merely *displays* as currency.
A pre-formatted `"Rp 30.000"` string cannot be added up.

Sheet names are sanitised, because Excel rejects names over 31 characters or
containing `[]:*?/\` and fails the **whole download** rather than the one sheet:

```ts
function sheetName(name: string) { return name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) }
```

---

## 3. `excelNumber()` — the Postgres decimal trap

```ts
export function excelNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
```

> **Why this exists:** Postgres hands `numeric` columns back as **strings**.
> `order.totalPrice` reads `'85000.00'` at runtime however it is typed in
> TypeScript. A price written straight from a model lands in the file as text —
> no currency format, no sorting by value, and a column that cannot be summed.
>
> The *screens* never notice, because transformers run every amount through
> `formatRupiah`, which coerces on the way past. The export has no such step, so
> it coerces here.

`null` is returned for missing values so the cell is **empty** rather than
printing `"null"` — an unpriced order shows a blank Total, which is the truth.

Use it on every money column: `totalPrice`, `service.price`, `subtotal`.

---

## 4. `excelDate()` — the timezone trap

```ts
export function excelDate(value: DateTime | null | undefined): Date | null {
  if (!value) return null

  return new Date(Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second))
}
```

> **Why this exists:** ExcelJS writes a `Date` from its **UTC components**.
> Handing it the real instant makes a Jakarta midnight land in the file as 17:00
> the day before — every date in the export off by one for anyone east of
> Greenwich. Rebuilding the value from the local wall clock *as if it were UTC*
> makes the cell read back the date the admin saw on screen. A spreadsheet cell
> carries no timezone of its own, so nothing is lost by dropping it here.

This is the same class of bug as `toLocalDateString` on the customer booking
form — see [customer/order.md §1](../customer/order.md#1-booking-a-pickup).

---

## 5. Download

```ts
async download(response, name: string, sheets: Sheet[]): Promise<void> {
  const buffer = await this.build(sheets)

  response.header('Content-Type', XLSX_MIME)
  response.header('Content-Disposition', `attachment; filename="${this.filename(name)}"`)
  response.header('Cache-Control', 'no-store')

  response.send(buffer)
}
```

`Cache-Control: no-store` because the file is generated fresh on every request
and is often the same URL with the same filters — a cached copy would quietly
hand an admin yesterday's numbers.

Filenames are timestamped:

```ts
filename(name) { return `umimaclean-${name}-${DateTime.now().toFormat('yyyyLLdd-HHmm')}.xlsx` }
// umimaclean-pesanan-20260728-1432.xlsx
```

so two exports of the same screen never overwrite each other in the downloads
folder.

Each sheet gets a dark header row in bold white, a **frozen top row**, and an
autofilter across the used range:

```ts
worksheet.views      = [{ state: 'frozen', ySplit: 1 }]
worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: headers.length } }
```

> **Why bother with presentation:** the header staying put while scrolling, and
> carrying the dropdowns, is what makes a file of a few hundred orders something
> an admin can work *through* rather than just look at.

The autofilter is only applied when there are rows — an empty range is invalid.

### The one architectural exception

`ExcelService` touches the HTTP response, which no other service does.

> **Why it is allowed:** producing a file download *is* the whole job. Splitting
> the buffer out from the three headers that make a browser save it would spread
> the same three lines across six controllers.

---

## 6. `EXPORT_ROW_LIMIT`

```ts
export const EXPORT_ROW_LIMIT = 5000
```

Applied by every `getXForExport` method.

> **Why:** an admin asking for "all orders" wants a file they can open, not the
> whole table streamed into memory and then into a browser download. The cap is
> far above what this shop produces in a year, so in practice it only ever bites
> on a runaway query.

⚠️ Truncation is **silent** — there is no warning in the file or on screen. If
the shop ever grows past this, that is the first thing to add.

---

## 7. The exports, in one table

| Screen         | Sheets | Notes                                                                    |
| -------------- | ------ | ------------------------------------------------------------------------ |
| Dashboard      | 6      | Summary, status, type split, revenue trend, pickup load (+ a computed "Sisa" column), recent orders |
| Orders         | 1      | Wider than the screen: adds address and payment state                     |
| Reconciliation | 1      | The whole backlog; leads with waiting time and last charge status         |
| Services       | 1      | The price list — the export people actually ask for                       |
| Users          | 1      | **Never** add the password hash                                           |
| Report         | 5      | Summary (formatted strings) + four data sheets (raw numbers)              |

Details of each are in that screen's own document.

---

## 8. Adding an export to a new screen

1. Add `getXForExport(filters)` to the service, built on the **same private query
   builder** as the paginated method, ending in `.limit(EXPORT_ROW_LIMIT)`.
2. Define `const X_COLUMNS: Column<T>[]` at the top of the controller. Use
   `excelNumber()` for money, `excelDate()` for dates, and enum label maps for
   codes.
3. Add an `export` action that calls the **same `filtersFrom(request.qs())`** as
   `index`, then `this.excelService.download(response, 'slug', [sheet({ ... })])`.
4. Register the route **before** any conflicting `:param` route.
5. Drop an `<ExportButton>` on the page.

Then check the file: sums work on money columns, dates show the right day, and
the row count matches the filtered list.
