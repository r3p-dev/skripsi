import ExcelJS from 'exceljs'

export type SheetColumn<T> = {
  header: string
  width?: number
  value: (row: T) => string | number | null
}

export async function toWorkbook<T>(
  sheetName: string,
  columns: SheetColumn<T>[],
  rows: T[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)

  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width ?? 20,
  }))

  sheet.getRow(1).font = { bold: true }

  for (const row of rows) {
    sheet.addRow(columns.map((column) => column.value(row)))
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export const SPREADSHEET_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
