import AdminLayout from '@/components/layouts/admin_layout'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { neutralBadgeStyle, transactionStatusStyles } from '@/lib/constants'
import { PaymentMethodLabel, TransactionStatusLabel } from '@/enums/transaction_enum'
import { formatShortDate, formatRupiah } from '@/lib/format'
import type { Data } from '@/generated/data'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconAlertTriangle, IconSearch } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  orders: { data: Data.Order.Variants['toListItem'][]; metadata: Metadata }
  filters: Filters
  paymentMethodOptions: { value: string; label: string }[]
}>

export default function Index({ orders, filters, paymentMethodOptions }: PageProps) {
  return (
    <AdminLayout title="Rekonsiliasi" description="Konfirmasi pembayaran yang tertahan">
      <PageHeader
        eyebrow="Admin"
        title="Rekonsiliasi Pembayaran"
        description="Pesanan yang masih menunggu pelunasan"
        action={<ExportButton />}
      />

      <div className="mb-6 flex items-start gap-2 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <p className="text-sm text-amber-800">
          Konfirmasi manual memaksa pesanan lanjut ke pencucian tanpa konfirmasi Midtrans. Pastikan
          uangnya benar-benar sudah diterima — setiap konfirmasi dicatat atas nama Anda.
        </p>
      </div>

      <Form route="admin.reconciliation.index" className="mb-6">
        {() => (
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              type="text"
              name="search"
              aria-label="Cari pesanan tertahan"
              defaultValue={filters.search}
              placeholder="Cari nomor pesanan atau nama..."
              className="h-11 rounded-none border-rule-field bg-paper-tint pl-10 focus-visible:border-ink focus-visible:ring-black/10"
            />
          </div>
        )}
      </Form>

      <Card className="rounded-none border border-rule bg-white">
        <CardContent>
          {orders.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-subtle">
              Tidak ada pesanan yang menunggu pelunasan
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Menunggu Sejak</TableHead>
                  <TableHead>Transaksi Terakhir</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.map((order) => {
                  const latest = order.transactions?.[0]

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold">
                        <Link
                          route="admin.order.show"
                          routeParams={{ number: order.orderNumber }}
                          className="underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-ink">{order.customerName}</p>
                        <p className="text-xs text-ink-subtle">{order.customerPhone}</p>
                      </TableCell>
                      <TableCell className="text-ink-soft">
                        {formatShortDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        {latest ? (
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={
                                transactionStatusStyles[latest.status] ?? neutralBadgeStyle
                              }
                            >
                              {
                                TransactionStatusLabel[
                                  latest.status as keyof typeof TransactionStatusLabel
                                ]
                              }
                            </Badge>
                            <span className="text-xs text-ink-subtle">
                              {
                                PaymentMethodLabel[
                                  latest.paymentMethod as keyof typeof PaymentMethodLabel
                                ]
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-subtle">Belum pernah ditagih</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.totalPrice === null ? '-' : formatRupiah(order.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            aria-label={`Konfirmasi pembayaran ${order.orderNumber}`}
                            className="rounded-none bg-ink px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink/90 active:scale-95"
                          >
                            Konfirmasi
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Konfirmasi pembayaran manual?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Pesanan {order.orderNumber} akan ditandai lunas dan langsung masuk
                                pencucian. Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <Form
                              route="admin.reconciliation.update"
                              routeParams={{ number: order.orderNumber }}
                            >
                              {({ errors, processing }) => (
                                <div className="space-y-3">
                                  <Field data-invalid={errors.paymentMethod ? 'true' : undefined}>
                                    <FieldLabel
                                      htmlFor={`method-${order.id}`}
                                      className="text-xs tracking-widest text-ink-body uppercase"
                                    >
                                      Metode Pembayaran
                                    </FieldLabel>
                                    <select
                                      id={`method-${order.id}`}
                                      name="paymentMethod"
                                      required
                                      defaultValue=""
                                      className="h-11 w-full rounded-none border border-rule-field bg-white px-3 text-sm focus-visible:border-ink focus-visible:outline-none"
                                    >
                                      <option value="" disabled>
                                        Pilih metode
                                      </option>
                                      {paymentMethodOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                    <FieldError>{errors.paymentMethod}</FieldError>
                                  </Field>

                                  <Field data-invalid={errors.note ? 'true' : undefined}>
                                    <FieldLabel
                                      htmlFor={`note-${order.id}`}
                                      className="text-xs tracking-widest text-ink-body uppercase"
                                    >
                                      Alasan
                                    </FieldLabel>
                                    <Textarea
                                      id={`note-${order.id}`}
                                      name="note"
                                      required
                                      placeholder="Contoh: bukti transfer diterima, callback Midtrans tidak masuk"
                                      aria-invalid={!!errors.note}
                                      className="rounded-none bg-white"
                                    />
                                    <FieldError>{errors.note}</FieldError>
                                  </Field>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <Button
                                      type="submit"
                                      disabled={processing}
                                      className="bg-ink text-white hover:bg-ink/90"
                                    >
                                      Tandai Lunas
                                    </Button>
                                  </AlertDialogFooter>
                                </div>
                              )}
                            </Form>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination metadata={orders.metadata} />
    </AdminLayout>
  )
}
