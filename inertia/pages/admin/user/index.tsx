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
  users: { data: Data.User[]; metadata: Metadata }
  filters: Filters
  role: string
  roleCounts: Record<string, number>
  roleOptions: { value: string; label: string }[]
  undeletableIds: number[]
}>

const ROLE_STYLES: Record<string, string> = {
  customer: 'bg-gray-200 text-gray-700',
  staff: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
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
                className: 'rounded-xl bg-black text-white hover:bg-black/90 active:scale-95',
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
                ? 'bg-black font-semibold text-white'
                : 'border border-gray-300 font-medium text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label} {tab.total}
          </Link>
        ))}
      </div>

      <Form route="admin.user.index" className="mb-6">
        {() => (
          <div className="flex flex-wrap items-center gap-3">
            {/* Keeps the active tab when the search is submitted. */}
            <input type="hidden" name="role" value={role} />

            <div className="relative min-w-56 flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                name="search"
                aria-label="Cari pengguna"
                defaultValue={filters.search}
                placeholder="Cari nama atau nomor telepon..."
                className="h-11 rounded-xl border-gray-300 bg-gray-50 pl-10 focus-visible:border-black focus-visible:ring-black/10"
              />
            </div>
          </div>
        )}
      </Form>

      <Card className="rounded-2xl border border-gray-200 bg-white">
        <CardContent>
          {users.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Tidak ada akun yang cocok</p>
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
                    <TableCell className="font-semibold text-black">{account.name}</TableCell>
                    <TableCell className="text-gray-600">{account.phone}</TableCell>
                    <TableCell>
                      <Badge
                        className={ROLE_STYLES[account.roleValue] ?? 'bg-gray-200 text-gray-700'}
                      >
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{account.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          route="admin.user.edit"
                          routeParams={{ id: account.id }}
                          aria-label={`Ubah ${account.name}`}
                          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black active:scale-95"
                        >
                          <IconPencil size={18} />
                        </Link>

                        {/*
                          Orders and order actions reference users with
                          RESTRICT: an account that appears anywhere in the
                          record cannot be removed without taking the history
                          of what happened with it.
                        */}
                        {undeletable.has(account.id) ? (
                          <button
                            type="button"
                            disabled
                            aria-label={`Hapus ${account.name}`}
                            title="Akun ini sudah memiliki riwayat pesanan"
                            className="cursor-not-allowed rounded-full p-2 text-gray-300"
                          >
                            <IconTrash size={18} />
                          </button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger
                              aria-label={`Hapus ${account.name}`}
                              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-destructive active:scale-95"
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
