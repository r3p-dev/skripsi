import UserLayout from '@/components/layouts/user-layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { InertiaProps } from '@/types'
import { Form, Link } from '@adonisjs/inertia/react'
import { Data } from '@generated/data'
import { IconAlertCircle } from '@tabler/icons-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DateTime } from 'luxon'
import { useState } from 'react'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function CreateOrder(props: PageProps) {
  const [date, setDate] = useState<Date>()

  function getAvailableDates() {
    const dates = []
    const today = DateTime.now()
    const oneMonthFromNow = today.plus({ months: 1 })

    for (let i = 0; i < 31; i++) {
      const checkDate = today.plus({ days: i })
      if (
        checkDate <= oneMonthFromNow &&
        (checkDate.weekday === 3 ||
          checkDate.weekday === 4 ||
          checkDate.weekday === 5 ||
          checkDate.weekday === 6)
      ) {
        dates.push(checkDate.toJSDate())
      }
    }

    return dates
  }

  const availableDates = getAvailableDates()

  return (
    <UserLayout>
      <div className="flex-1 w-full max-w-md mx-auto p-4 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-1">Buat Pesanan Baru</h2>
          <p className="text-gray-600">Pilih tanggal pickup sepatu Anda</p>
        </div>

        <Card className="bg-black text-white gap-2">
          <CardHeader>
            <CardTitle className="text-lg">Cara Pemesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <li className="flex gap-3">
              <span className="shrink-0">1.</span>
              <span>Pilih tanggal pickup yang tersedia</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">2.</span>
              <span>Tim kami akan menghubungi via WhatsApp untuk konfirmasi</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">3.</span>
              <span>Diskusikan detail layanan dan kebutuhan sepatu Anda</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0">4.</span>
              <span>Kami akan datang sesuai jadwal untuk pickup</span>
            </li>
          </CardContent>
        </Card>

        {!props.address && (
          <Alert className="flex justify-between my-5 border-gray-400">
            <IconAlertCircle className="size-8" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex-1 flex-col justify-center gap-1">
                <AlertTitle className="text-lg">Alamat Belum Dibuat</AlertTitle>
                <AlertDescription className="text-sm">
                  Anda perlu menambahkan alamat terlebih dahulu untuk membuat pesanan
                </AlertDescription>
              </div>
              <div className="flex items-center">
                <Link route="address.show">
                  <Button className="h-10 text-lg cursor-pointer rounded-md px-4">
                    Buat Alamat
                  </Button>
                </Link>
              </div>
            </div>
          </Alert>
        )}

        <Card className="border-gray-400 border">
          <CardHeader>
            <CardTitle className="text-lg">Pilih Tanggal Penjemputan</CardTitle>
          </CardHeader>
          <CardContent>
            <Form
              route="order.store"
              disableWhileProcessing
              resetOnSuccess
              onSuccess={() => setDate(undefined)}
              transform={(data) => ({
                ...data,
                addressId: props.address?.id,
                date: date ? DateTime.fromJSDate(date).toISODate() : undefined,
              })}
              className="space-y-8"
            >
              {({ errors, processing }) => (
                <FieldSet>
                  <FieldGroup>
                    <Field className="mx-auto">
                      <FieldLabel className="text-sm">Tanggal</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              id="date-picker-simple"
                              className="w-full justify-start font-normal text-base h-11 border border-gray-300 hover:border-gray-400 bg-white text-black rounded-lg"
                            >
                              {date ? format(date, 'PPP') : <span>Pilih tanggal</span>}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            fixedWeeks
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date: Date) =>
                              !props.address ||
                              !availableDates.some((d) => d.toDateString() === date.toDateString())
                            }
                            locale={id}
                            className="text-sm [--cell-size:--spacing(9.5)]"
                          />
                        </PopoverContent>
                      </Popover>
                      <FieldError errors={errors.date ? [{ message: errors.date }] : undefined} />
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        disabled={!props.address || !date || processing}
                        className="w-full h-11 bg-black text-white hover:bg-black/90 rounded-lg text-base tracking-wide"
                      >
                        {processing ? <Spinner /> : 'Buat Pesanan'}
                      </Button>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  )
}
