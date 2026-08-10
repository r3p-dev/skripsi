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
import { CatalogueCategoryLabel, CatalogueTypeLabel } from '@/enums/catalogue_enum'
import { formatRupiah } from '@/lib/format'

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
                className: 'rounded-none bg-ink text-white hover:bg-ink/90 active:scale-95',
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
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              type="text"
              name="search"
              aria-label="Cari layanan"
              defaultValue={filters.search}
              placeholder="Cari layanan..."
              className="h-11 rounded-none border-rule-field bg-paper-tint pl-10 focus-visible:border-ink focus-visible:ring-black/10"
            />
          </div>
        )}
      </Form>

      <Card className="rounded-none border border-rule bg-white">
        <CardContent>
          {services.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-subtle">Belum ada layanan</p>
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
                      <p className="font-semibold text-ink">{service.name}</p>
                      <p className="text-xs text-ink-subtle">{service.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-paper-tint text-ink-body">
                        {
                          CatalogueCategoryLabel[
                            service.category as keyof typeof CatalogueCategoryLabel
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-soft">
                      {CatalogueTypeLabel[service.type as keyof typeof CatalogueTypeLabel]}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatRupiah(service.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          route="admin.service.edit"
                          routeParams={{ id: service.id }}
                          aria-label={`Ubah ${service.name}`}
                          className="rounded-full p-2 text-ink-faint transition-colors hover:bg-paper-tint hover:text-ink active:scale-95"
                        >
                          <IconPencil size={18} />
                        </Link>

                        {inUse.has(service.id) ? (
                          <button
                            type="button"
                            disabled
                            aria-label={`Hapus ${service.name}`}
                            title="Layanan ini sudah dipakai pada pesanan"
                            className="cursor-not-allowed rounded-full p-2 text-ink-faint"
                          >
                            <IconTrash size={18} />
                          </button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger
                              aria-label={`Hapus ${service.name}`}
                              className="rounded-full p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-destructive active:scale-95"
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
