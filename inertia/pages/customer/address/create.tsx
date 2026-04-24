import UserLayout from '@/components/layouts/user-layout'
import AddressForm from '@/components/mollecules/address-form'
import { Button, buttonVariants } from '@/components/ui/button'
import { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Data } from '@generated/data'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function CreateAddress(props: PageProps) {
  return (
    <UserLayout>
      <div className="w-full max-w-md mx-auto p-4 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Profil & Alamat</h2>
          <p className="text-gray-600">Kelola informasi profil dan alamat Anda</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link
            route="profile.show"
            className={buttonVariants({
              variant: 'outline',
              className:
                'flex-1 h-8 text-sm font-semibold transition-all bg-gray-100 text-black hover:bg-gray-200',
              size: 'lg',
            })}
          >
            Akun
          </Link>
          <Button
            className="flex-1 h-8 text-sm font-semibold transition-all bg-black text-white shadow-sm"
            size="lg"
          >
            Alamat
          </Button>
        </div>

        <AddressForm address={props.address} />
      </div>
    </UserLayout>
  )
}
