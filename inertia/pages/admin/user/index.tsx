import AdminLayout from '@/components/layouts/admin_layout'
import {
  IconAction,
  SearchField,
  SolidButton,
  StatusBadge,
  iconActionLink,
  type BadgeTone,
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
import { Role, RoleLabel } from '@/enums/role_enum'
import { neutralTone } from '@/lib/constants'
import { formatShortDate } from '@/lib/format'

type PageProps = InertiaProps<{
  users: { data: Data.User[]; metadata: Metadata }
  filters: Filters
  role: string
  roleCounts: Record<string, number>
  roleOptions: { value: string; label: string }[]
  undeletableIds: number[]
}>

const ROLE_TONES: Record<string, BadgeTone> = {
  [Role.CUSTOMER]: 'muted',
  [Role.STAFF]: 'outline',
  [Role.ADMIN]: 'solid',
}

function buildColumns(undeletable: Set<number>): Column<Data.User>[] {
  return [
    {
      key: 'name',
      header: 'Nama',
      role: 'primary',
      cell: (account) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className={account.isActive ? '' : 'text-ink-faint line-through'}>
            {account.name}
          </span>
          {!account.isActive && <StatusBadge tone="muted">Nonaktif</StatusBadge>}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Telepon',
      role: 'meta',
      cell: (account) => account.phone,
    },
    {
      key: 'role',
      header: 'Peran',
      role: 'trailing',
      cell: (account) => (
        <StatusBadge tone={ROLE_TONES[account.role] ?? neutralTone}>
          {RoleLabel[account.role as keyof typeof RoleLabel]}
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Bergabung',
      cellClassName: 'text-ink-soft',
      cell: (account) => formatShortDate(account.createdAt),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      role: 'actions',
      cell: (account) => (
        <div className="flex items-center gap-1 tablet:justify-end">
          <Link
            route="admin.user.edit"
            routeParams={{ id: account.id }}
            aria-label={`Ubah ${account.name}`}
            className={iconActionLink}
          >
            <IconPencil size={18} />
          </Link>

          {undeletable.has(account.id) ? (
            <IconAction
              disabled
              aria-label={`Hapus ${account.name}`}
              title="Akun ini sudah memiliki riwayat pesanan"
            >
              <IconTrash size={18} />
            </IconAction>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger
                aria-label={`Hapus ${account.name}`}
                className={cn(iconActionLink, 'hover:border-destructive/30 hover:text-destructive')}
              >
                <IconTrash size={18} />
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus akun?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Akun {account.name} akan dihapus permanen beserta alamatnya.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-none border-rule-field text-meta font-medium text-ink">
                    Batal
                  </AlertDialogCancel>
                  <Form route="admin.user.destroy" routeParams={{ id: account.id }}>
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

export default function Index({
  users,
  filters,
  role,
  roleCounts,
  roleOptions,
  undeletableIds,
}: PageProps) {
  const undeletable = new Set(undeletableIds)
  const totalAccounts = Object.values(roleCounts).reduce((total, count) => total + count, 0)

  const tabs = [
    { value: '', label: 'Semua', total: totalAccounts },
    ...roleOptions.map((option) => ({
      value: option.value,
      label: option.label,
      total: roleCounts[option.value] ?? 0,
    })),
  ]

  return (
    <AdminLayout title="Pengguna" description="Kelola akun pelanggan, petugas, dan admin">
      <PageHeader
        eyebrow="Admin"
        title="Manajemen Pengguna"
        description="Akun petugas dan admin hanya bisa dibuat dari sini"
        action={
          <>
            <ExportButton />
            <Link
              route="admin.user.create"
              className="flex min-h-11 items-center gap-2 bg-ink px-4 text-meta font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink/90"
            >
              <IconPlus className="size-4" />
              Akun Baru
            </Link>
          </>
        }
      />

      <div
        className="mb-4 -mx-[clamp(20px,4vw,40px)] flex gap-2 overflow-x-auto px-[clamp(20px,4vw,40px)] pb-1"
        role="tablist"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.value || 'all'}
            route="admin.user.index"
            data={tab.value ? { role: tab.value } : {}}
            aria-current={role === tab.value ? 'page' : undefined}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-1.5 border px-4 text-meta transition-colors',
              role === tab.value
                ? 'border-ink bg-ink font-semibold text-white'
                : 'border-rule-field font-medium text-ink-soft hover:bg-paper-tint'
            )}
          >
            {tab.label}
            <span className={role === tab.value ? 'text-white/70' : 'text-ink-faint'}>
              {tab.total}
            </span>
          </Link>
        ))}
      </div>

      <Form route="admin.user.index" className="mb-5">
        {() => (
          <div className="flex flex-col gap-2.5 tablet:flex-row tablet:items-center">
            <input type="hidden" name="role" value={role} />

            <SearchField
              name="search"
              aria-label="Cari pengguna"
              defaultValue={filters.search}
              placeholder="Cari nama atau nomor telepon..."
              wrapperClassName="tablet:min-w-64 tablet:max-w-md tablet:flex-1"
            />

            <SolidButton type="submit" className="py-3 tablet:w-auto tablet:px-8">
              Cari
            </SolidButton>
          </div>
        )}
      </Form>

      <DataTable
        columns={buildColumns(undeletable)}
        rows={users.data}
        getKey={(account) => account.id}
        empty="Tidak ada akun yang cocok"
      />

      <Pagination metadata={users.metadata} />
    </AdminLayout>
  )
}
