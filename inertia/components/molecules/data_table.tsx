import { EmptyState, Panel } from '@/components/atoms/editorial'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { IconChevronDown } from '@tabler/icons-react'
import { Fragment, useId, useState, type ReactNode } from 'react'

type ColumnRole = 'primary' | 'trailing' | 'meta' | 'actions' | 'detail'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'right'
  role?: ColumnRole
  cellClassName?: string
}

function DataRecord<T>({ row, columns }: { row: T; columns: Column<T>[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  const primary = columns.find((column) => column.role === 'primary')
  const trailing = columns.find((column) => column.role === 'trailing')
  const meta = columns.filter((column) => column.role === 'meta')
  const actions = columns.filter((column) => column.role === 'actions')
  const details = columns.filter((column) => !column.role || column.role === 'detail')

  const isExpandable = details.length > 0 || actions.length > 0

  return (
    <div className="border-b border-rule last:border-b-0">
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {primary && (
            <div className="text-body leading-[1.4] font-semibold text-ink">
              {primary.cell(row)}
            </div>
          )}
          {meta.length > 0 && (
            <div className="mt-1 text-meta leading-normal text-ink-subtle">
              {meta.map((column, index) => (
                <Fragment key={column.key}>
                  {index > 0 && <span aria-hidden> · </span>}
                  {column.cell(row)}
                </Fragment>
              ))}
            </div>
          )}
        </div>
        {trailing && <div className="shrink-0 text-right">{trailing.cell(row)}</div>}
      </div>

      {isExpandable && (
        <>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="flex w-full items-center justify-between gap-2 border-t border-rule px-5 py-3 text-meta font-medium text-ink-soft transition-colors hover:text-ink"
          >
            {isOpen ? 'Tutup Detail' : 'Lihat Detail'}
            <IconChevronDown
              className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
            />
          </button>

          {isOpen && (
            <div id={panelId} className="border-t border-rule bg-paper-tint px-5 py-3">
              <dl className="flex flex-col">
                {details.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-b-0"
                  >
                    <dt className="flex-none text-micro tracking-[0.14em] text-ink-muted uppercase">
                      {column.header}
                    </dt>
                    <dd className="m-0 text-right text-meta leading-normal text-ink-body">
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>

              {actions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3">
                  {actions.map((column) => (
                    <Fragment key={column.key}>{column.cell(row)}</Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string | number
  empty: string
  className?: string
}) {
  if (rows.length === 0) {
    return (
      <Panel className={className}>
        <EmptyState>{empty}</EmptyState>
      </Panel>
    )
  }

  return (
    <Panel className={className}>
      <div className="hidden tablet:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.align === 'right' ? 'text-right' : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={getKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.align === 'right' && 'text-right', column.cellClassName)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="tablet:hidden">
        {rows.map((row) => (
          <DataRecord key={getKey(row)} row={row} columns={columns} />
        ))}
      </div>
    </Panel>
  )
}
