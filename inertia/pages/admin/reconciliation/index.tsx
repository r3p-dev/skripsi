import AdminLayout from '@/components/layouts/admin_layout'
import {
  BoxSelect,
  BoxTextarea,
  Notice,
  SearchField,
  SolidButton,
  StatusBadge,
} from '@/components/atoms/editorial'
import { DataTable, type Column } from '@/components/molecules/data_table'
import { ExportButton } from '@/components/molecules/export_button'
import { PageHeader } from '@/components/molecules/page_header'
import { Pagination } from '@/components/molecules/pagination'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert_dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { neutralTone, transactionStatusTones } from '@/lib/constants'
import type { Data } from '@/generated/data'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconAlertTriangle } from '@tabler/icons-react'

type OrderRow = Data.Order.Variants['toListItem']

type Option = { value: string; label: string }

type PageProps = InertiaProps<{
  orders: { data: OrderRow[]; metadata: Metadata }
  filters: Filters
  paymentMethodOptions: Option[]
}>

function buildColumns(paymentMethodOptions: Option[]): Column<OrderRow>[] {
  return [
    {
      key: 'orderNumber',
      header: 'Nomor',
      role: 'primary',
      cell: (order) => (
        <Link
          route="admin.order.show"
          routeParams={{ number: order.orderNumber }}
          className="font-semibold text-ink underline underline-offset-4"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Pelanggan',
      role: 'meta',
      cell: (order) => (
        <span className="text-ink-body">
          {order.customerName}
          <span className="text-ink-subtle"> · {order.customerPhone}</span>
        </span>
      ),
    },
    {
      key: 'totalPrice',
      header: 'Total',
      align: 'right',
      role: 'trailing',
      cell: (order) => (
        <span className="text-body font-semibold text-ink tablet:text-small">
          {order.totalPriceLabel ?? '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Menunggu Sejak',
      cellClassName: 'text-ink-soft',
      cell: (order) => order.createdAtLabel,
    },
    {
      key: 'transaction',
      header: 'Transaksi Terakhir',
      cell: (order) => {
        const latest = order.transactions?.[0]

        if (!latest) {
          return <span className="text-meta text-ink-subtle">Belum pernah ditagih</span>
        }

        return (
          <span className="flex flex-wrap items-center justify-end gap-1.5 tablet:flex-col tablet:items-start">
            <StatusBadge tone={transactionStatusTones[latest.status] ?? neutralTone}>
              {latest.statusLabel}
            </StatusBadge>
            <span className="text-meta text-ink-subtle">{latest.paymentMethodLabel}</span>
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      role: 'actions',
      cell: (order) => (
        <AlertDialog>
          <AlertDialogTrigger
            aria-label={`Konfirmasi pembayaran ${order.orderNumber}`}
            className="flex min-h-11 w-full items-center justify-center bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90 tablet:w-auto"
          >
            Konfirmasi
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi pembayaran manual?</AlertDialogTitle>
              <AlertDialogDescription>
                Pesanan {order.orderNumber} akan ditandai lunas dan langsung masuk pencucian.
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Form route="admin.reconciliation.update" routeParams={{ number: order.orderNumber }}>
              {({ errors, processing }) => (
                <div className="flex flex-col gap-4">
                  <Field data-invalid={errors.paymentMethod ? 'true' : undefined}>
                    <FieldLabel htmlFor={`method-${order.id}`} className="field-label mb-2">
                      Metode Pembayaran
                    </FieldLabel>
                    <BoxSelect
                      id={`method-${order.id}`}
                      name="paymentMethod"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Pilih metode
                      </option>
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </BoxSelect>
                    <FieldError>{errors.paymentMethod}</FieldError>
                  </Field>

                  <Field data-invalid={errors.note ? 'true' : undefined}>
                    <FieldLabel htmlFor={`note-${order.id}`} className="field-label mb-2">
                      Alasan
                    </FieldLabel>
                    <BoxTextarea
                      id={`note-${order.id}`}
                      name="note"
                      required
                      placeholder="Contoh: bukti transfer diterima, callback Midtrans tidak masuk"
                      aria-invalid={!!errors.note}
                    />
                    <FieldError>{errors.note}</FieldError>
                  </Field>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
                      Batal
                    </AlertDialogCancel>
                    <Button
                      type="submit"
                      disabled={processing}
                      className="h-11 rounded-none bg-ink text-meta font-medium tracking-[0.08em] text-white uppercase hover:bg-ink/90"
                    >
                      Tandai Lunas
                    </Button>
                  </AlertDialogFooter>
                </div>
              )}
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      ),
    },
  ]
}

export default function Index({ orders, filters, paymentMethodOptions }: PageProps) {
  return (
    <AdminLayout title="Rekonsiliasi" description="Konfirmasi pembayaran yang tertahan">
      <PageHeader
        eyebrow="Admin"
        title="Rekonsiliasi Pembayaran"
        description="Pesanan yang masih menunggu pelunasan"
        action={<ExportButton />}
      />

      <Notice className="mb-5">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-ink" />
        <span>
          Konfirmasi manual memaksa pesanan lanjut ke pencucian tanpa konfirmasi Midtrans. Pastikan
          uangnya benar-benar sudah diterima — setiap konfirmasi dicatat atas nama Anda.
        </span>
      </Notice>

      <Form route="admin.reconciliation.index" className="mb-5">
        {() => (
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center">
            <SearchField
              name="search"
              aria-label="Cari pesanan tertahan"
              defaultValue={filters.search}
              placeholder="Cari nomor pesanan atau nama..."
              wrapperClassName="tablet:min-w-64 tablet:max-w-md tablet:flex-1"
            />

            <SolidButton type="submit" className="py-3 tablet:w-auto tablet:px-8">
              Cari
            </SolidButton>
          </div>
        )}
      </Form>

      <DataTable
        columns={buildColumns(paymentMethodOptions)}
        rows={orders.data}
        getKey={(order) => order.id}
        empty="Tidak ada pesanan yang menunggu pelunasan"
      />

      <Pagination metadata={orders.metadata} />
    </AdminLayout>
  )
}
