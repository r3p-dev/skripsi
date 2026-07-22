import { type PropsWithChildren } from 'react'
import CustomerLayout from './customer_layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { client, urlFor } from '@/client'
import { router } from '@inertiajs/react'

export default function CustomerProfileLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  title: string
  description: string
}>) {
  function getCurrentTab() {
    if (client.current('customer.address.*')) {
      return 'address'
    }

    return 'profile'
  }

  function handleTabChange(value: string) {
    const tabs = {
      profile: 'customer.profile.show',
      address: 'customer.address.show',
    } as const

    const url = urlFor(tabs[value as keyof typeof tabs])

    router.get(url)
  }

  return (
    <CustomerLayout title={title} description={description}>
      <div className="flex-1 w-full max-w-md mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Profil & Alamat</h2>
          <p className="text-gray-600">Kelola informasi profil dan alamat Anda</p>
        </div>

        <Tabs value={getCurrentTab()} onValueChange={handleTabChange} defaultValue="profile">
          <TabsList className="w-full h-10! bg-gray-200!">
            <TabsTrigger className="data-active:bg-black! data-active:text-white!" value="profile">
              Profil
            </TabsTrigger>
            <TabsTrigger className="data-active:bg-black! data-active:text-white!" value="address">
              Alamat
            </TabsTrigger>
          </TabsList>

          <TabsContent value={getCurrentTab()}>{children}</TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  )
}
