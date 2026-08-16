import { hasRoute } from '@/lib/utils'
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
    route: 'admin.catalogue.index',
    match: ['admin/catalogue/index', 'admin/catalogue/create', 'admin/catalogue/edit'],
    label: 'Layanan',
    icon: IconSparkles,
  },
  {
    route: 'admin.user.index',
    match: ['admin/user/index', 'admin/user/create', 'admin/user/edit', 'admin/signup'],
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

  const navItems = NAV_ITEMS.filter((item) => hasRoute(item.route))

  const links = navItems.map((item) => {
    const isActive = (item.match as readonly string[]).includes(component)

    return (
      <Link
        key={item.route}
        route={item.route}
        onClick={() => setIsNavOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex min-h-11 items-center gap-3 px-4 py-2.5 text-small leading-[1.4] transition-colors ${
          isActive
            ? 'bg-ink font-semibold text-white'
            : 'font-medium text-ink-soft hover:bg-ink/5 hover:text-ink'
        }`}
      >
        <item.icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
        {item.label}
      </Link>
    )
  })

  return (
    <div className="flex min-h-dvh flex-col bg-white text-ink">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-rule bg-[#fafafa] px-4 py-6 desktop:flex">
        <div className="px-4 pb-6">
          <p className="eyebrow">UmimaClean</p>
          <p className="text-lead leading-[1.4] font-semibold text-ink">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">{links}</nav>
      </aside>

      <div className="sticky top-0 z-40 bg-white desktop:hidden">
        <header className="flex items-center justify-between gap-3 border-b border-rule bg-white px-[clamp(20px,4vw,40px)] py-2.5">
          <div>
            <p className="text-micro leading-[1.4] tracking-[0.2em] text-ink-muted uppercase">
              UmimaClean
            </p>
            <p className="text-body leading-[1.4] font-semibold text-ink">Admin</p>
          </div>
          {navItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsNavOpen((open) => !open)}
              aria-label={isNavOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isNavOpen}
              className="flex size-11 shrink-0 items-center justify-center border border-rule-field text-ink transition-colors hover:bg-ink/5"
            >
              {isNavOpen ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
            </button>
          )}
        </header>

        {isNavOpen && navItems.length > 0 && (
          <nav className="flex max-h-[calc(100dvh-4.5rem)] flex-col gap-1 overflow-y-auto border-b border-rule bg-white px-4 py-3">
            {links}
          </nav>
        )}
      </div>

      <div className="flex flex-1 flex-col desktop:pl-60">
        <div className="mx-auto w-full max-w-7xl flex-1 px-[clamp(20px,4vw,40px)] py-6 desktop:py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
