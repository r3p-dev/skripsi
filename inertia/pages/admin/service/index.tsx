import AdminLayout from '@/components/layouts/admin_layout'
import {
  IconAction,
  SearchField,
  SolidButton,
  StatusBadge,
  iconActionLink,
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
import { cn } from '@/lib/utils'
import type { Data } from '@/generated/data'
import type { Filters, InertiaProps, Metadata } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { CatalogueCategoryLabel, CatalogueTypeLabel } from '@/enums/catalogue_enum'
import { formatRupiah } from '@/lib/format'

type PageProps = InertiaProps<{
  services: { data: Data.Service[]; metadata: Metadata }
  filters: Filters
  inUseIds: number[]
}>

function buildColumns(inUse: Set<number>): Column<Data.Service>[] {
  return [
    {
      key: 'name',
      header: 'Nama',
      role: 'primary',
      cell: (service) => service.name,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      role: 'meta',
      cell: (service) => service.description,
    },
    {
      key: 'price',
      header: 'Harga',
      align: 'right',
      role: 'trailing',
      cellClassName: 'font-semibold text-ink',
      cell: (service) => (
        <span className="text-body font-semibold text-ink tablet:text-small">
          {formatRupiah(service.price)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (service) => (
        <StatusBadge tone="muted">
          {CatalogueCategoryLabel[service.category as keyof typeof CatalogueCategoryLabel]}
        </StatusBadge>
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      cellClassName: 'text-ink-soft',
      cell: (service) => CatalogueTypeLabel[service.type as keyof typeof CatalogueTypeLabel],
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      role: 'actions',
      cell: (service) => (
        <div className="flex items-center gap-1 tablet:justify-end">
          <Link
            route="admin.service.edit"
            routeParams={{ id: service.id }}
            aria-label={`Ubah ${service.name}`}
            className={iconActionLink}
          >
            <IconPencil size={18} />
          </Link>

          {inUse.has(service.id) ? (
            <IconAction
              disabled
              aria-label={`Hapus ${service.name}`}
              title="Layanan ini sudah dipakai pada pesanan"
            >
              <IconTrash size={18} />
            </IconAction>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                aria-label={`Hapus ${service.name}`}
                className={cn(iconActionLink, 'hover:border-destructive/30 hover:text-destructive')}
              >
                <IconTrash size={18} />
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus layanan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {service.name} akan dihapus dari katalog dan tidak lagi bisa dipilih saat
                    inspeksi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
                    Batal
                  </AlertDialogCancel>
                  <Form route="admin.service.destroy" routeParams={{ id: service.id }}>
                    {({ processing }) => (
                      <Button
                        type="submit"
                        disabled={processing}
                        className="h-11 rounded-none bg-destructive text-meta font-medium tracking-[0.08em] text-white uppercase hover:bg-destructive/90"
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
      ),
    },
  ]
}

export default function Index({ services, filters, inUseIds }: PageProps) {
  const inUse = new Set(inUseIds)

  return (
    <AdminLayout title="Layanan" description="Kelola katalog layanan UmimaClean">
      <PageHeader
        eyebrow="Admin"
        title="Katalog Layanan"
        description="Harga yang dipakai saat inspeksi dan pesanan offline"
        action={
          <>
            <ExportButton />
            <Link
              route="admin.service.create"
              className="flex min-h-11 items-center gap-2 bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
            >
              <IconPlus className="size-4" />
              Layanan Baru
            </Link>
          </>
        }
      />

      <Form route="admin.service.index" className="mb-5">
        {() => (
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center">
            <SearchField
              name="search"
              aria-label="Cari layanan"
              defaultValue={filters.search}
              placeholder="Cari layanan..."
              wrapperClassName="tablet:min-w-64 tablet:max-w-md tablet:flex-1"
            />

            <SolidButton type="submit" className="py-3 tablet:w-auto tablet:px-8">
              Cari
            </SolidButton>
          </div>
        )}
      </Form>

      <DataTable
        columns={buildColumns(inUse)}
        rows={services.data}
        getKey={(service) => service.id}
        empty="Belum ada layanan"
      />

      <Pagination metadata={services.metadata} />
    </AdminLayout>
  )
}
