import AdminLayout from '@/components/layouts/admin_layout'
import { Notice, SolidButton } from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
import { ServiceFields, type Option } from '@/components/organisms/service_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  service: Data.Service
  categoryOptions: Option[]
  typeOptions: Option[]
  isInUse: boolean
}>

export default function Edit({ service, categoryOptions, typeOptions, isInUse }: PageProps) {
  return (
    <AdminLayout title={service.name} description="Ubah layanan katalog UmimaClean">
      <PageHeader
        eyebrow="Katalog"
        title="Ubah Layanan"
        description={service.name}
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

      {isInUse && (
        <Notice className="mb-4 max-w-2xl">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-ink" />
          <span>
            Layanan ini sudah dipakai pada pesanan. Perubahan harga hanya berlaku untuk pesanan baru
            — pesanan lama tetap memakai harga saat diinspeksi.
          </span>
        </Notice>
      )}

      <Form
        route="admin.service.update"
        routeParams={{ id: service.id }}
        className="flex max-w-2xl flex-col gap-4"
      >
        {({ errors, processing }) => (
          <>
            <ServiceFields
              errors={errors}
              defaults={{
                serviceName: service.name,
                description: service.description,
                price: service.price,
                category: service.category,
                type: service.type,
              }}
              categoryOptions={categoryOptions}
              typeOptions={typeOptions}
            />

            <SolidButton type="submit" disabled={processing}>
              Simpan Perubahan
            </SolidButton>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
