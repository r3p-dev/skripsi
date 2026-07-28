import AdminLayout from '@/components/layouts/admin_layout'
import { PageHeader } from '@/components/molecules/page_header'
import { ServiceFields, type Option } from '@/components/organisms/service_fields'
import { Button, buttonVariants } from '@/components/ui/button'
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

      {/*
        A price is copied onto the order line at inspection time, so editing it
        here never reprices an order that has already been quoted. Worth saying
        out loud: it is the first thing an admin worries about.
      */}
      {isInUse && (
        <div className="mb-4 flex max-w-2xl items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-800">
            Layanan ini sudah dipakai pada pesanan. Perubahan harga hanya berlaku untuk pesanan baru
            — pesanan lama tetap memakai harga saat diinspeksi.
          </p>
        </div>
      )}

      <Form
        route="admin.service.update"
        routeParams={{ id: service.id }}
        className="max-w-2xl space-y-4"
      >
        {({ errors, processing }) => (
          <>
            <ServiceFields
              errors={errors}
              defaults={{
                name: service.name,
                description: service.description,
                price: service.priceValue,
                category: service.categoryValue,
                type: service.typeValue,
              }}
              categoryOptions={categoryOptions}
              typeOptions={typeOptions}
            />

            <Button
              type="submit"
              disabled={processing}
              className="h-12 w-full rounded-2xl bg-black text-base font-semibold text-white hover:bg-black/90 active:scale-95"
            >
              Simpan Perubahan
            </Button>
          </>
        )}
      </Form>
    </AdminLayout>
  )
}
