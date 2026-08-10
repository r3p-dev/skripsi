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
import { IconCircleOff, IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { Role, RoleLabel } from '@/enums/role_enum'
import { neutralBadgeStyle } from '@/lib/constants'
import { formatShortDate } from '@/lib/format'

type PageProps = InertiaProps<{
  users: { data: Data.User[]; metadata: Metadata }
  filters: Filters
  role: string
  roleCounts: Record<string, number>
  roleOptions: { value: string; label: string }[]
  undeletableIds: number[]
}>

const ROLE_STYLES: Record<string, string> = {
  [Role.CUSTOMER]: 'bg-paper-tint text-ink-body',
  [Role.STAFF]: 'bg-blue-100 text-blue-700',
  [Role.ADMIN]: 'bg-purple-100 text-purple-700',
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
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton />
            <Link
              route="admin.user.create"
              className={buttonVariants({
                className: 'rounded-none bg-ink text-white hover:bg-ink/90 active:scale-95',
              })}
            >
              <IconPlus className="size-4" />
              Akun Baru
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value || 'all'}
            route="admin.user.index"
            data={tab.value ? { role: tab.value } : {}}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              role === tab.value
                ? 'bg-ink font-semibold text-white'
                : 'border border-rule-field font-medium text-ink-soft hover:bg-paper-tint'
            }`}
          >
            {tab.label} {tab.total}
          </Link>
        ))}
      </div>

      <Form route="admin.user.index" className="mb-6">
        {() => (
          <div className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="role" value={role} />

            <div className="relative min-w-56 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                type="text"
                name="search"
                aria-label="Cari pengguna"
                defaultValue={filters.search}
                placeholder="Cari nama atau nomor telepon..."
                className="h-11 rounded-none border-rule-field bg-paper-tint pl-10 focus-visible:border-ink focus-visible:ring-black/10"
              />
            </div>
          </div>
        )}
      </Form>

      <Card className="rounded-none border border-rule bg-white">
        <CardContent>
          {users.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-ink-subtle">Tidak ada akun yang cocok</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-semibold text-ink">
                      <span className={account.isActive ? '' : 'text-ink-faint line-through'}>
                        {account.name}
                      </span>
                      {!account.isActive && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-paper-tint px-2 py-0.5 text-xs font-medium text-ink-soft">
                          <IconCircleOff className="size-3" />
                          Nonaktif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-ink-soft">{account.phone}</TableCell>
                    <TableCell>
                      <Badge className={ROLE_STYLES[account.role] ?? neutralBadgeStyle}>
                        {RoleLabel[account.role as keyof typeof RoleLabel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-ink-soft">
                      {formatShortDate(account.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          route="admin.user.edit"
                          routeParams={{ id: account.id }}
                          aria-label={`Ubah ${account.name}`}
                          className="rounded-full p-2 text-ink-faint transition-colors hover:bg-paper-tint hover:text-ink active:scale-95"
                        >
                          <IconPencil size={18} />
                        </Link>

                        {undeletable.has(account.id) ? (
                          <button
                            type="button"
                            disabled
                            aria-label={`Hapus ${account.name}`}
                            title="Akun ini sudah memiliki riwayat pesanan"
                            className="cursor-not-allowed rounded-full p-2 text-ink-faint"
                          >
                            <IconTrash size={18} />
                          </button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger
                              aria-label={`Hapus ${account.name}`}
                              className="rounded-full p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-destructive active:scale-95"
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
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <Form route="admin.user.destroy" routeParams={{ id: account.id }}>
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

      <Pagination metadata={users.metadata} />
    </AdminLayout>
  )
}
