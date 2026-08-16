import AdminLayout from '@/components/layouts/admin_layout'
import { Notice, SolidButton } from '@/components/atoms/editorial'
import { PageHeader } from '@/components/molecules/page_header'
import { CatalogueFields, type Option } from '@/components/organisms/catalogue_fields'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconArrowLeft, IconInfoCircle } from '@tabler/icons-react'

type PageProps = InertiaProps<{
  catalogue: Data.Catalogue
  categoryOptions: Option[]
  typeOptions: Option[]
  isInUse: boolean
}>

export default function Edit({ catalogue, categoryOptions, typeOptions, isInUse }: PageProps) {
  return (
    <AdminLayout title={catalogue.name} description="Ubah layanan katalog UmimaClean">
      <PageHeader
        eyebrow="Katalog"
        title="Ubah Layanan"
        description={catalogue.name}
        action={
          <Link
            route="admin.catalogue.index"
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
        route="admin.catalogue.update"
        routeParams={{ id: catalogue.id }}
        className="flex max-w-2xl flex-col gap-4"
      >
        {({ errors, processing }) => (
          <>
            <CatalogueFields
              errors={errors}
              defaults={{
                catalogueName: catalogue.name,
                description: catalogue.description,
                price: catalogue.price,
                category: catalogue.category,
                type: catalogue.type,
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
