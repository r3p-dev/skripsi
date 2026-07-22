import { client } from '@/client'
import type { routes } from '@/generated/registry'
import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { Head } from '@inertiajs/react'
import { IconHome, IconPackage, IconUser } from '@tabler/icons-react'
import { type PropsWithChildren } from 'react'

export default function CustomerLayout({
  children,
  title,
  description,
}: PropsWithChildren<{ title: string; description: string }>) {
  const navItems = [
    { path: 'customer.order.create' as const, icon: IconHome, label: 'Buat' },
    { path: 'customer.order.index' as const, icon: IconPackage, label: 'Pesanan' },
    { path: 'customer.profile.show' as const, icon: IconUser, label: 'Profil' },
  ]

  function isActive(path: keyof typeof routes) {
    switch (path) {
      case 'customer.profile.show':
        return client.current('customer.profile.*') || client.current('customer.address.*')

      default:
        return client.current(path)
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>

      <div className="max-w-md mx-auto bg-muted min-h-dvh">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center p-3 justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <img src="/images/logo.jpg" alt="Premium Care" className="size-6" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-black leading-tight">UmimaClean</h1>
                <p className="text-xs text-gray-500 tracking-wide">LAYANAN CUCI SEPATU</p>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 transform bg-white border-t border-gray-200">
          <div className="flex h-16 items-center justify-around gap-4 px-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  route={item.path}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center rounded-lg p-2 transition-all',
                    active
                      ? 'bg-black text-white'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
