import type { HttpContext } from '@adonisjs/core/http'
import ExcelJS from 'exceljs'
import { DateTime } from 'luxon'

/**
 * How many rows any single export may carry.
 *
 * An admin asking for "all orders" wants a file they can open, not the whole
 * table streamed into memory and then into a browser download. The cap is far
 * above what this shop produces in a year, so in practice it only ever bites
 * on a runaway query.
 */
export const EXPORT_ROW_LIMIT = 5000

/**
 * The MIME type Excel, LibreOffice and Google Sheets all recognise for `.xlsx`.
 */
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Number format for money. The cell stays a number so an admin can sum a
 * column in Excel — a pre-formatted `"Rp 30.000"` string cannot be added up.
 */
export const RUPIAH_FORMAT = '"Rp"#,##0'

export const DATE_FORMAT = 'dd/mm/yyyy'
export const DATETIME_FORMAT = 'dd/mm/yyyy hh:mm'

/**
 * What may land in a cell. `Date` and `number` are passed through as real
 * Excel values rather than text so that sorting and arithmetic work in the
 * spreadsheet; `null` leaves the cell empty rather than printing "null".
 */
export type CellValue = string | number | Date | null

export type Column<T> = {
  header: string
  /** Width in characters. Left off for a sensible default. */
  width?: number
  /** An Excel number format, e.g. `RUPIAH_FORMAT`. Omit for plain text. */
  format?: string
  value: (row: T) => CellValue
}

/**
 * A sheet whose column callbacks have already been applied, so the workbook
 * builder never has to know what kind of record produced it.
 */
export type Sheet = {
  name: string
  headers: string[]
  widths: number[]
  formats: (string | undefined)[]
  rows: CellValue[][]
}

/** Default column width, wide enough for a name or an order number. */
const DEFAULT_WIDTH = 18

/**
 * Turns a stored amount into the number a spreadsheet cell should hold.
 *
 * Postgres hands `numeric` columns back as strings — `order.totalPrice` reads
 * `'85000.00'` at runtime however it is typed — so a price written straight
 * from a model lands in the file as text: no currency format, no sorting by
 * value, and a column that cannot be summed. The screens never notice because
 * their transformers run every amount through `formatRupiah`, which coerces on
 * the way past; the export has no such step, so it coerces here.
 */
export function excelNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Turns a stored timestamp into the `Date` a spreadsheet cell should hold.
 *
 * ExcelJS writes a `Date` from its UTC components, so handing it the real
 * instant makes a Jakarta midnight land in the file as 17:00 the day before —
 * every date in the export off by one for anyone east of Greenwich. Rebuilding
 * the value from the local wall clock as if it were UTC is what makes the cell
 * read back the date the admin saw on screen. A spreadsheet cell carries no
 * timezone of its own, so nothing is lost by dropping it here.
 */
export function excelDate(value: DateTime | null | undefined): Date | null {
  if (!value) {
    return null
  }

  return new Date(
    Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second)
  )
}

/**
 * Excel rejects sheet names over 31 characters or containing `[]:*?/\`, and
 * fails the whole download rather than the one sheet, so names are cleaned
 * here instead of trusted from the caller.
 */
function sheetName(name: string): string {
  return name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)
}

/**
 * Flattens a typed list into a sheet.
 *
 * This is where the generic disappears: every caller declares its columns
 * against its own record type and gets back a plain `Sheet`, which is what
 * lets one workbook hold sheets built from six unrelated shapes.
 */
export function sheet<T>(definition: { name: string; columns: Column<T>[]; rows: T[] }): Sheet {
  return {
    name: sheetName(definition.name),
    headers: definition.columns.map((column) => column.header),
    widths: definition.columns.map((column) => column.width ?? DEFAULT_WIDTH),
    formats: definition.columns.map((column) => column.format),
    rows: definition.rows.map((row) => definition.columns.map((column) => column.value(row))),
  }
}

/**
 * Turns admin screens into spreadsheets.
 *
 * Deliberately knows nothing about orders, users or services: a caller hands
 * over sheets it has already flattened with `sheet()`, and gets back a
 * download. Everything about what a column means stays with the screen that
 * shows it.
 *
 * This is the one service that touches the HTTP response, because producing a
 * file download is the whole job — splitting the buffer out from the headers
 * that make a browser save it would only spread three lines across six
 * controllers.
 */
export default class ExcelService {
  /**
   * Builds the workbook and sends it as an attachment.
   */
  async download(response: HttpContext['response'], name: string, sheets: Sheet[]): Promise<void> {
    const buffer = await this.build(sheets)

    response.header('Content-Type', XLSX_MIME)
    response.header('Content-Disposition', `attachment; filename="${this.filename(name)}"`)
    /**
     * The file is generated fresh on every request and is often the same URL
     * with the same filters, so a cached copy would quietly hand an admin
     * yesterday's numbers.
     */
    response.header('Cache-Control', 'no-store')

    response.send(buffer)
  }

  async build(sheets: Sheet[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()

    workbook.creator = 'UmimaClean'
    workbook.created = new Date()

    for (const definition of sheets) {
      this.addSheet(workbook, definition)
    }

    return Buffer.from(await workbook.xlsx.writeBuffer())
  }

  /**
   * The name the browser saves the file under, stamped with the moment it was
   * taken so that two exports of the same screen never overwrite each other in
   * the downloads folder.
   */
  filename(name: string): string {
    const stamp = DateTime.now().toFormat('yyyyLLdd-HHmm')

    return `umimaclean-${name}-${stamp}.xlsx`
  }

  private addSheet(workbook: ExcelJS.Workbook, definition: Sheet): void {
    const worksheet = workbook.addWorksheet(definition.name)

    worksheet.columns = definition.headers.map((header, index) => ({
      header,
      width: definition.widths[index],
      style: definition.formats[index] ? { numFmt: definition.formats[index] } : undefined,
    }))

    for (const row of definition.rows) {
      worksheet.addRow(row)
    }

    const header = worksheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } }
    header.alignment = { vertical: 'middle' }
    header.height = 22

    /**
     * The header stays put while scrolling and carries the dropdowns, so a
     * file of a few hundred orders is something an admin can actually work
     * through rather than just look at.
     */
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    if (definition.rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: definition.rows.length + 1, column: definition.headers.length },
      }
    }
  }
}
