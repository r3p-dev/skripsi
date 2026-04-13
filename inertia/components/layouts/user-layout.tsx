import { cn } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { IconBell, IconHome, IconPackage, IconUser } from '@tabler/icons-react'
import { ReactNode } from 'react'

export default function UserLayout({ children }: { children: ReactNode }) {
  const { url } = usePage()

  const navItems = [
    { path: 'order.create' as const, icon: IconHome, label: 'Buat' },
    { path: 'order.index' as const, icon: IconPackage, label: 'Pesanan' },
    { path: 'profile.show' as const, icon: IconUser, label: 'Profil' },
  ]

  const routeUrlMap: Record<string, string> = {
    'order.create': '/orders/create',
    'order.index': '/orders',
    'profile.show': '/profile',
    'address.show': '/address',
  }

  const isActive = (path: string) => {
    const baseUrl = routeUrlMap[path] ?? ''
    // Profile should be active for both /profile and /address
    if (path === 'profile.show') {
      return (
        url === '/profile' ||
        url.startsWith('/profile?') ||
        url === '/address' ||
        url.startsWith('/address?')
      )
    }
    return url === baseUrl || url.startsWith(baseUrl + '?')
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center p-4 justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center bg-black rounded-lg shrink-0">
              <img src="/images/umima-logo.png" alt="Premium Care" className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-black leading-tight">UmimaClean</h1>
              <p className="text-xs text-gray-500 tracking-wide">LAYANAN CUCI SEPATU</p>
            </div>
          </div>
          <button
            className="relative p-2 hover:bg-secondary/50 rounded-full transition-colors"
            title="Notifikasi"
          >
            <IconBell className="w-8 h-8" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
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
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
