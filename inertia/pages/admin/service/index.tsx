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
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Data } from '@/generated/data'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  services: { data: Data.Service[]; metadata: Metadata }
  filters: Filters
  inUseIds: number[]
}>

export default function Index({ services, filters, inUseIds }: PageProps) {
  const inUse = new Set(inUseIds)

  return (
    <AdminLayout title="Layanan" description="Kelola katalog layanan UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Katalog Layanan"
        description="Harga yang dipakai saat inspeksi dan pesanan offline"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton />
            <Link
              route="admin.service.create"
              className={buttonVariants({
                className: 'rounded-xl bg-black text-white hover:bg-black/90 active:scale-95',
              })}
            >
              <IconPlus className="size-4" />
              Layanan Baru
            </Link>
          </div>
        }
      />

      <Form route="admin.service.index" className="mb-6">
        {() => (
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              name="search"
              aria-label="Cari layanan"
              defaultValue={filters.search}
              placeholder="Cari layanan..."
              className="h-11 rounded-xl border-gray-300 bg-gray-50 pl-10 focus-visible:border-black focus-visible:ring-black/10"
            />
          </div>
        )}
      </Form>

      <Card className="rounded-2xl border border-gray-200 bg-white">
        <CardContent>
          {services.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Belum ada layanan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.data.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <p className="font-semibold text-black">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gray-200 text-gray-700">{service.category}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{service.type}</TableCell>
                    <TableCell className="text-right font-semibold">{service.price}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          route="admin.service.edit"
                          routeParams={{ id: service.id }}
                          aria-label={`Ubah ${service.name}`}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black active:scale-95"
                        >
                          <IconPencil size={18} />
                        </Link>

                        {/*
                          A service that has priced an order is history: the
                          receipt for that order still names it, and the
                          foreign key refuses the delete anyway. The button is
                          disabled rather than hidden so the rule stays visible.
                        */}
                        {inUse.has(service.id) ? (
                          <button
                            type="button"
                            disabled
                            aria-label={`Hapus ${service.name}`}
                            title="Layanan ini sudah dipakai pada pesanan"
                            className="cursor-not-allowed rounded-full p-2 text-gray-300"
                          >
                            <IconTrash size={18} />
                          </button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger
                              aria-label={`Hapus ${service.name}`}
                              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-destructive active:scale-95"
                            >
                              <IconTrash size={18} />
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus layanan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {service.name} akan dihapus dari katalog dan tidak lagi bisa
                                  dipilih saat inspeksi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <Form
                                  route="admin.service.destroy"
                                  routeParams={{ id: service.id }}
                                >
                                  {({ processing }) => (
                                    <Button
                                      type="submit"
                                      disabled={processing}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      Hapus
                                    </Button>
                                  )}
                                </Form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination metadata={services.metadata} />
    </AdminLayout>
  )
}
