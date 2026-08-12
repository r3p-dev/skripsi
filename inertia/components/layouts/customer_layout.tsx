import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconCalendarPlus, IconReceipt2, IconUser } from '@tabler/icons-react'
import { type PropsWithChildren } from 'react'
import { usePage } from '@inertiajs/react'

const NAV_ITEMS = [
  {
    route: 'customer.orders.create',
    match: ['customer/order/create'],
    label: 'Pesan',
    icon: IconCalendarPlus,
  },
  {
    route: 'customer.orders.index',
    match: ['customer/order/index', 'customer/order/show', 'customer/order/receipt'],
    label: 'Pesanan',
    icon: IconReceipt2,
  },
  {
    route: 'customer.profile.show',
    match: ['customer/profile/show', 'customer/address/show', 'customer/address/create'],
    label: 'Profil',
    icon: IconUser,
  },
] as const

export default function CustomerLayout({
  children,
  title,
  description,
  wide = false,
}: PropsWithChildren<{
  title: string
  description: string
  wide?: boolean
}>) {
  const { component } = usePage()

  const shell = wide
    ? 'tablet:max-w-180 tablet:border-x tablet:border-rule'
    : 'tablet:my-14 tablet:min-h-[auto] tablet:max-w-170 tablet:rounded-[6px] tablet:border tablet:border-rule tablet:shadow-[0_24px_64px_rgba(0,0,0,0.08)]'

  return (
    <div className="min-h-dvh bg-paper desktop:flex">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <nav
        aria-label="Navigasi akun"
        className="hidden w-60 flex-none flex-col border-r border-rule bg-[#fafafa] px-7 py-12 desktop:flex"
      >
        <img src="/images/logo_full.jpg" alt="Umima" className="mb-10 w-20 object-contain" />

        {NAV_ITEMS.map((item) => {
          const isActive = (item.match as readonly string[]).includes(component)

          return (
            <Link
              key={item.route}
              route={item.route}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'py-2.5 text-body leading-[1.4]',
                isActive ? 'font-semibold text-ink' : 'text-ink-subtle hover:text-ink'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-107.5 flex-col bg-white text-ink',
          shell,
          'desktop:m-0 desktop:min-h-dvh desktop:max-w-none desktop:flex-1 desktop:rounded-none desktop:border-0 desktop:shadow-none'
        )}
      >
        {children}
      </div>

      <nav
        aria-label="Navigasi utama"
        className={cn(
          'fixed inset-x-0 bottom-0 left-1/2 z-50 w-full max-w-107.5 -translate-x-1/2 border-t border-rule-strong bg-white pb-safe desktop:hidden',
          wide && 'tablet:max-w-180 tablet:border-x tablet:border-rule'
        )}
      >
        <div className="mx-auto flex items-stretch justify-around px-4 py-1.5">
          {NAV_ITEMS.map((item) => {
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
