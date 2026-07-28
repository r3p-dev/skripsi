import AdminLayout from '@/components/layouts/admin_layout'
import { PageHeader } from '@/components/molecules/page_header'
import { ServiceFields, type Option } from '@/components/organisms/service_fields'
import { Button, buttonVariants } from '@/components/ui/button'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  categoryOptions: Option[]
  typeOptions: Option[]
}>

export default function Create({ categoryOptions, typeOptions }: PageProps) {
  return (
    <AdminLayout title="Layanan Baru" description="Tambah layanan ke katalog UmimaClean">
      <PageHeader
        eyebrow="Katalog"
        title="Layanan Baru"
        description="Harga berlaku untuk pesanan yang dibuat setelah ini"
        action={
          <Link
            route="admin.service.index"
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-xl border-gray-300',
            })}
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <Form route="admin.service.store" className="max-w-2xl space-y-4">
        {({ errors, processing }) => (
          <>
            <ServiceFields
              errors={errors}
              categoryOptions={categoryOptions}
              typeOptions={typeOptions}
            />

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-2xl bg-black text-base font-semibold text-white hover:bg-black/90 active:scale-95"
            >
              Simpan Layanan
            </Button>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
