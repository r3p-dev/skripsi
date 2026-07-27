import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconCalendarPlus, IconReceipt2, IconUser } from '@tabler/icons-react'
import { type PropsWithChildren } from 'react'
import { usePage } from '@inertiajs/react'

export default function CustomerLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: string
  description: string
}>) {
  const { component } = usePage()

  const items = [
    {
      route: 'customer.order.create',
      match: ['customer/order/create'],
      label: 'Pesan',
      icon: IconCalendarPlus,
    },
    {
      route: 'customer.order.index',
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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      {children}

      <nav className="fixed inset-x-0 bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 z-50 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-around px-6 py-2.5">
          {items.map((item) => {
            const isActive = (item.match as readonly string[]).includes(component)

            return (
              <Link
                key={item.route}
                route={item.route}
                className={`flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 transition-colors active:scale-95 ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}
              >
                <item.icon className="size-6" strokeWidth={isActive ? 2.25 : 1.75} />
                <span
                  className={`text-[11px] tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}
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
