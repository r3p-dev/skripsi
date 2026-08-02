import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconClipboardList, IconUser } from '@tabler/icons-react'
import { type PropsWithChildren } from 'react'
import { usePage } from '@inertiajs/react'

/**
 * Bottom navigation tabs. `match` lists the Inertia page components that
 * should light the tab up, so detail pages stay under their parent tab.
 */
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

export default function StaffLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: string
  description: string
}>) {
  const { component } = usePage()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      {children}

      <nav className="fixed inset-x-0 bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 z-50 border-t border-gray-200 bg-white pb-safe">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-4 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = (item.match as readonly string[]).includes(component)

            return (
              <Link
                key={item.route}
                route={item.route}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition-colors active:scale-95 touch-target ${
                  isActive ? 'text-black' : 'text-gray-400'
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
