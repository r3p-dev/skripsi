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

      {/*
        Midtrans confirms a payment by calling the webhook. When that call is
        lost the order sits here forever: the customer cannot mark their own
        order paid and staff have no tool for it. This screen is the only way
        out, which is why every override is recorded against the admin who
        made it.
      */}
      <div className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
        <p className="text-sm text-amber-800">
          Konfirmasi manual memaksa pesanan lanjut ke pencucian tanpa konfirmasi Midtrans. Pastikan
          uangnya benar-benar sudah diterima — setiap konfirmasi dicatat atas nama Anda.
        </p>
      </div>

      <Form route="admin.reconciliation.index" className="mb-6">
        {() => (
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              name="search"
              aria-label="Cari pesanan tertahan"
              defaultValue={filters.search}
              placeholder="Cari nomor pesanan atau nama..."
              className="h-11 rounded-xl border-gray-300 bg-gray-50 pl-10 focus-visible:border-black focus-visible:ring-black/10"
            />
          </div>
        )}
      </Form>

      <Card className="rounded-2xl border border-gray-200 bg-white">
        <CardContent>
          {orders.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
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
                        <p className="text-black">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerPhone}</p>
                      </TableCell>
                      <TableCell className="text-gray-600">
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
                            <span className="text-xs text-gray-500">
                              {
                                PaymentMethodLabel[
                                  latest.paymentMethod as keyof typeof PaymentMethodLabel
                                ]
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Belum pernah ditagih</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.totalPrice === null ? '-' : formatRupiah(order.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger
                            aria-label={`Konfirmasi pembayaran ${order.orderNumber}`}
                            className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90 active:scale-95"
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
                                      className="text-xs tracking-widest text-gray-700 uppercase"
                                    >
                                      Metode Pembayaran
                                    </FieldLabel>
                                    <select
                                      id={`method-${order.id}`}
                                      name="paymentMethod"
                                      required
                                      defaultValue=""
                                      className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus-visible:border-black focus-visible:outline-none"
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
                                      className="text-xs tracking-widest text-gray-700 uppercase"
                                    >
                                      Alasan
                                    </FieldLabel>
                                    <Textarea
                                      id={`note-${order.id}`}
                                      name="note"
                                      required
                                      placeholder="Contoh: bukti transfer diterima, callback Midtrans tidak masuk"
                                      aria-invalid={!!errors.note}
                                      className="rounded-xl bg-white"
                                    />
                                    <FieldError>{errors.note}</FieldError>
                                  </Field>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <Button
                                      type="submit"
                                      disabled={processing}
                                      className="bg-black text-white hover:bg-black/90"
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
