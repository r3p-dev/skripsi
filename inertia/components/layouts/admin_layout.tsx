import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import {
  IconCashBanknote,
  IconChartBar,
  IconLayoutDashboard,
  IconMenu2,
  IconReceipt2,
  IconSparkles,
  IconUser,
  IconUsers,
  IconX,
} from '@tabler/icons-react'
import { useState, type PropsWithChildren } from 'react'

/**
 * The admin sections. `match` lists the Inertia page components that belong to
 * each one, so a detail or form page keeps its parent section highlighted.
 */
const NAV_ITEMS = [
  {
    route: 'admin.dashboard.index',
    match: ['admin/index'],
    label: 'Dasbor',
    icon: IconLayoutDashboard,
  },
  {
    route: 'admin.order.index',
    match: ['admin/order/index', 'admin/order/show'],
    label: 'Pesanan',
    icon: IconReceipt2,
  },
  {
    route: 'admin.reconciliation.index',
    match: ['admin/reconciliation/index'],
    label: 'Rekonsiliasi',
    icon: IconCashBanknote,
  },
  {
    route: 'admin.service.index',
    match: ['admin/service/index', 'admin/service/create', 'admin/service/edit'],
    label: 'Layanan',
    icon: IconSparkles,
  },
  {
    route: 'admin.user.index',
    match: ['admin/user/index', 'admin/user/create', 'admin/user/edit'],
    label: 'Pengguna',
    icon: IconUsers,
  },
  {
    route: 'admin.report.index',
    match: ['admin/report/index'],
    label: 'Laporan',
    icon: IconChartBar,
  },
  {
    route: 'admin.profile.show',
    match: ['admin/profile/show'],
    label: 'Profil',
    icon: IconUser,
  },
] as const

/**
 * The admin shell.
 *
 * Unlike the customer and staff apps, this one is not mobile-first: an admin
 * reads tables and charts, which need width. The nav is a permanent sidebar on
 * a desktop and collapses behind a button on a phone, rather than the
 * bottom tab bar the other two roles use — seven sections do not fit there.
 */
export default function AdminLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: string
  description: string
}>) {
  const { component } = usePage()
  const [isNavOpen, setIsNavOpen] = useState(false)

  const links = NAV_ITEMS.map((item) => {
    const isActive = (item.match as readonly string[]).includes(component)

    return (
      <Link
        key={item.route}
        route={item.route}
        // Following a link on a phone should reveal the page, not leave the menu open.
        onClick={() => setIsNavOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-black font-semibold text-white'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-black'
        }`}
      >
        <item.icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
        {item.label}
      </Link>
    )
  })

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
        <div className="px-4 pb-6">
          <p className="text-xs tracking-[0.3em] text-gray-500 uppercase">UmimaClean</p>
          <p className="text-lg font-bold tracking-tight text-black">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">{links}</nav>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 md:hidden">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">UmimaClean</p>
          <p className="text-base font-bold tracking-tight text-black">Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setIsNavOpen((open) => !open)}
          aria-label={isNavOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={isNavOpen}
          className="rounded-lg border border-gray-300 p-2 text-black transition-colors hover:bg-gray-100 active:scale-95"
        >
          {isNavOpen ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
        </button>
      </header>

      {isNavOpen && (
        <nav className="sticky top-14.25 z-30 flex flex-col gap-1 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          {links}
        </nav>
      )}

      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  )
}
