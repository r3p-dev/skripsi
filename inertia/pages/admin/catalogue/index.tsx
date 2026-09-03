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
import { CatalogueCategoryLabel } from '@/enums/catalogue_enum'

type PageProps = InertiaProps<{
  catalogues: { data: Data.Catalogue[]; metadata: Metadata }
  filters: Filters
  inUseIds: number[]
}>

function buildColumns(inUse: Set<number>): Column<Data.Catalogue>[] {
  return [
    {
      key: 'name',
      header: 'Nama',
      role: 'primary',
      cell: (catalogue) => catalogue.name,
    },
    {
      key: 'description',
      header: 'Deskripsi',
      role: 'meta',
      cell: (catalogue) => catalogue.description,
    },
    {
      key: 'price',
      header: 'Harga',
      align: 'right',
      role: 'trailing',
      cellClassName: 'font-semibold text-ink',
      cell: (catalogue) => (
        <span className="text-body font-semibold text-ink tablet:text-small">
          {catalogue.priceLabel}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      cell: (catalogue) => (
        <StatusBadge tone="muted">
          {CatalogueCategoryLabel[catalogue.category as keyof typeof CatalogueCategoryLabel]}
        </StatusBadge>
      ),
    },
    {
      key: 'type',
      header: 'Tipe',
      cellClassName: 'text-ink-soft',
      cell: (catalogue) => catalogue.typeLabel,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      role: 'actions',
      cell: (catalogue) => (
        <div className="flex items-center gap-1 tablet:justify-end">
          <Link
            route="admin.catalogue.edit"
            routeParams={{ id: catalogue.id }}
            aria-label={`Ubah ${catalogue.name}`}
            className={iconActionLink}
          >
            <IconPencil size={18} />
          </Link>

          {inUse.has(catalogue.id) ? (
            <IconAction
              disabled
              aria-label={`Hapus ${catalogue.name}`}
              title="Layanan ini sudah dipakai pada pesanan"
            >
              <IconTrash size={18} />
            </IconAction>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                aria-label={`Hapus ${catalogue.name}`}
                className={cn(iconActionLink, 'hover:border-destructive/30 hover:text-destructive')}
              >
                <IconTrash size={18} />
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus layanan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {catalogue.name} akan dihapus dari katalog dan tidak lagi bisa dipilih saat
                    inspeksi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
                    Batal
                  </AlertDialogCancel>
                  <Form route="admin.catalogue.destroy" routeParams={{ id: catalogue.id }}>
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

export default function Index({ catalogues, filters, inUseIds }: PageProps) {
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
              route="admin.catalogue.create"
              className="flex min-h-11 items-center gap-2 bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
            >
              <IconPlus className="size-4" />
              Layanan Baru
            </Link>
          </>
        }
      />

      <Form route="admin.catalogue.index" className="mb-5">
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
        rows={catalogues.data}
        getKey={(catalogue) => catalogue.id}
        empty="Belum ada layanan"
      />

      <Pagination metadata={catalogues.metadata} />
    </AdminLayout>
  )
}
