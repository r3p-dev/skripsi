import { cn, hasRoute } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconClipboardList, IconUser } from '@tabler/icons-react'
import { type PropsWithChildren } from 'react'
import { usePage } from '@inertiajs/react'

const NAV_ITEMS = [
  {
    route: 'staff.trip.index',
    match: ['staff/trip/index', 'staff/trip/show', 'staff/inspection/show'],
    label: 'Tugas',
    icon: IconClipboardList,
  },
  {
    route: 'staff.profile.show',
    match: ['staff/profile/show', 'staff/profile/edit'],
    label: 'Profil',
    icon: IconUser,
  },
] as const

const SHELL_WIDTH = 'tablet:max-w-170 desktop:max-w-190'

export default function StaffLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: string
  description: string
}>) {
  const { component } = usePage()
  const navItems = NAV_ITEMS.filter((item) => hasRoute(item.route))

  return (
    <div className="min-h-dvh bg-paper">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white text-ink',
          SHELL_WIDTH,
          'tablet:border-x tablet:border-rule'
        )}
      >
        {children}
      </div>

      <nav
        hidden={navItems.length === 0}
        className={cn(
          'fixed inset-x-0 bottom-0 left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 border-t border-rule-strong bg-white pb-safe',
          SHELL_WIDTH,
          'tablet:border-x tablet:border-rule'
        )}
      >
        <div className="mx-auto flex items-stretch justify-around px-4 py-1.5">
          {navItems.map((item) => {
            const isActive = (item.match as readonly string[]).includes(component)

            return (
              <Link
                key={item.route}
                route={item.route}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition-colors active:scale-95 touch-target ${
                  isActive ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                <item.icon className="size-6" strokeWidth={isActive ? 2.25 : 1.75} />
                <span
                  className={`text-xs tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
