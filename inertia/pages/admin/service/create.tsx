import AdminLayout from '@/components/layouts/admin_layout'
import { SolidButton } from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
import { ServiceFields, type Option } from '@/components/organisms/service_fields'
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
            className="flex min-h-11 items-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint"
          >
            <IconArrowLeft className="size-4" />
            Kembali
          </Link>
        }
      />

      <Form route="admin.service.store" className="flex max-w-2xl flex-col gap-4">
        {({ errors, processing }) => (
          <>
            <ServiceFields
              errors={errors}
              categoryOptions={categoryOptions}
              typeOptions={typeOptions}
            />

            <SolidButton type="submit" disabled={processing}>
              Simpan Layanan
            </SolidButton>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
