import CustomerLayout from '@/components/layouts/customer_layout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button, buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { Data } from '@/generated/data'
import { services } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'
import type { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { IconChevronRight, IconMapPin, IconPencil, IconTag } from '@tabler/icons-react'
import { id } from 'date-fns/locale'
import { useMemo, useState } from 'react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function Create({ address }: PageProps) {
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined)
  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), [])

  function formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const priceListByCategory = Object.groupBy(services, (service) => service.category)

  return (
    <CustomerLayout title="Buat Pesanan" description="Jadwalkan penjemputan sepatu Anda">
      <div className="px-6 py-5">
        <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Pesanan</p>
        <h1 className="text-3xl font-bold tracking-tight text-black">Buat Pesanan</h1>
      </div>

      <div className="flex-1 px-6 pb-28">
        {!address ? (
          <Card className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-black/10">
              <IconMapPin className="size-7 text-black" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-black">Alamat belum tersedia</p>
              <p className="text-sm text-gray-600">
                Tambahkan alamat penjemputan terlebih dahulu sebelum membuat pesanan
              </p>
            </div>
            <Link
              route="customer.address.create"
              className={buttonVariants({
                className:
                  'h-11 rounded-xl bg-black px-6 text-sm font-semibold tracking-wide text-white hover:bg-black/90 active:scale-95',
              })}
            >
              Tambah Alamat
            </Link>
          </Card>
        ) : (
          <>
            <p className="mb-6 text-sm leading-relaxed text-gray-700">
              Pilih tanggal penjemputan dan tim kami akan menjemput sepatu Anda langsung dari alamat
              terdaftar
            </p>

            <Card className="mb-6 rounded-2xl border border-gray-200 bg-gray-50">
              <CardHeader>
                <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                  Alamat Penjemputan
                </p>
                <CardAction>
                  <Link
                    route="customer.address.create"
                    aria-label="Ubah alamat"
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 underline underline-offset-4"
                  >
                    <IconPencil className="size-3.5" />
                    Ubah
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium text-black">{address.name}</p>
                <p className="text-sm text-gray-600">{address.phone}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{address.street}</p>
              </CardContent>
            </Card>

            <Card className="mb-6 rounded-2xl border border-gray-200 bg-gray-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconTag className="size-4 text-black" />
                  <p className="text-xs tracking-widest text-gray-600 uppercase font-medium">
                    Daftar Harga
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion>
                  {Object.entries(priceListByCategory).map(([category, items]) => (
                    <AccordionItem key={category} value={category} className="border-gray-200">
                      <AccordionTrigger className="text-sm font-semibold text-black">
                        {category}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {items?.map((item) => (
                            <div key={item.name} className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-black">{item.name}</p>
                                <p className="text-xs leading-relaxed text-gray-600">
                                  {item.description}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold whitespace-nowrap text-black">
                                {item.type === 'Mulai dari' && (
                                  <span className="mr-1 text-xs font-normal text-gray-500">
                                    mulai
                                  </span>
                                )}
                                {formatRupiah(item.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Form route="customer.order.store" className="space-y-5">
              {({ errors, processing }) => (
                <>
                  <input type="hidden" name="addressId" value={address.id} />
                  <input
                    type="hidden"
                    name="pickupDate"
                    value={pickupDate ? formatDate(pickupDate) : ''}
                    readOnly
                  />

                  <Field data-invalid={errors.pickupDate ? 'true' : undefined}>
                    <FieldLabel className="text-xs tracking-widest text-gray-700 uppercase">
                      Tanggal Penjemputan
                    </FieldLabel>
                    <div className="flex justify-center rounded-2xl border border-gray-300 bg-gray-50 py-2">
                      <Calendar
                        mode="single"
                        locale={id}
                        selected={pickupDate}
                        onSelect={setPickupDate}
                        disabled={{ before: today }}
                        className="[--cell-size:--spacing(10)]"
                      />
                    </div>
                    <FieldError>{errors.pickupDate}</FieldError>
                  </Field>

                  <Button
                    type="submit"
                    disabled={processing || !pickupDate}
                    className="h-12 w-full rounded-xl bg-black text-lg font-semibold tracking-wide text-white transition-all duration-300 hover:bg-black/90 active:scale-95"
                  >
                    Jadwalkan Penjemputan
                    <IconChevronRight className="size-5" />
                  </Button>
                </>
              )}
            </Form>
          </>
        )}
      </div>
    </CustomerLayout>
  )
}
