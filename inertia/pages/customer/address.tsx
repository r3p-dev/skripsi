import UserLayout from '@/components/layouts/user-layout'
import StaticMap from '@/components/organisms/static-map'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { Data } from '@generated/data'
import { IconEdit, IconMapPin, IconPhone, IconPlus, IconUser } from '@tabler/icons-react'
import { latLng, LatLng } from 'leaflet'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { validateLocation } from '@/lib/location_validator'
import { Form } from '@adonisjs/inertia/react'
import { PhoneInput } from '@/components/atoms/phone-input'
import PinpointMap from '@/components/organisms/pinpoint-map'
import { ScrollArea } from '@/components/ui/scroll-area'

type PageProps = InertiaProps<{
  address: Data.Address | null
}>

export default function Address(props: PageProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const defaultPosition = latLng(-6.9555305, 107.6540353)

  const [position, setPosition] = useState<LatLng>(
    props.address ? latLng(props.address.latitude, props.address.longitude) : defaultPosition
  )

  const form = useForm<{
    latitude: number
    longitude: number
    radius: number
  }>({
    mode: 'onChange',
    defaultValues: {
      latitude: props.address ? props.address.latitude : position.lat,
      longitude: props.address ? props.address.longitude : position.lng,
      radius: props.address ? props.address.radius : 0,
    },
  })

  const watchedLat = form.watch('latitude')
  const watchedLng = form.watch('longitude')
  const watchedRadius = form.watch('radius')

  useEffect(() => {
    if (watchedLat !== undefined && watchedLng !== undefined) {
      const validation = validateLocation(watchedLat, watchedLng)

      if (!validation.valid) {
        form.setError('latitude', {
          type: 'manual',
          message: validation.message,
        })
        form.setError('longitude', {
          type: 'manual',
          message: validation.message,
        })
      } else {
        form.clearErrors(['latitude', 'longitude'])
      }
    }
  }, [watchedLat, watchedLng])

  function handlePositionChange(position: LatLng) {
    form.setValue('latitude', position.lat, { shouldValidate: true })
    form.setValue('longitude', position.lng, { shouldValidate: true })
    setPosition(position)
  }

  function handleRadiusChange(radius: number) {
    form.setValue('radius', radius, { shouldValidate: true })
  }

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

        {props.address ? (
          <div className="space-y-4">
            <Card className="border border-gray-200 bg-gray-50 overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-200">
                <h3 className="text-lg font-bold text-black mb-1">Alamat Anda</h3>
                <p className="text-sm text-gray-600">
                  Informasi alamat pengiriman yang akan digunakan untuk layanan antar jemput
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconUser className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Nama Penerima
                    </p>
                    <p className="font-medium text-black text-sm">{props.address.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconPhone className="size-5 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Nomor Telepon
                    </p>
                    <p className="font-medium text-black text-sm break-all">
                      {props.address.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconMapPin className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Alamat Lengkap
                    </p>
                    <p className="font-medium text-black text-sm">{props.address.street}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-3">
                    Lokasi
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <StaticMap
                      latitude={props.address.latitude}
                      longitude={props.address.longitude}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center bg-gray-200 rounded-lg shrink-0 hover:bg-gray-300 transition-colors">
                    <IconUser className="size-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider mb-1">
                      Catatan
                    </p>
                    <p className="font-medium text-black text-sm">
                      {props.address.note ? props.address.note : 'Tidak ada catatan tambahan'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 bg-white text-black font-semibold hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <IconEdit className="size-5" />
              Edit Alamat
            </Button>
          </div>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex flex-col items-center justify-center min-h-100 text-center">
              <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <IconMapPin className="size-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Belum ada alamat</h3>
              <p className="text-sm text-gray-600 mb-6 px-4">
                Tambahkan alamat pengiriman Anda untuk memudahkan proses layanan
              </p>
              <DialogTrigger className="bg-black text-white hover:bg-gray-900 font-semibold rounded-lg px-6 h-11 flex items-center gap-2 text-sm">
                <IconPlus className="size-5" />
                Tambah Alamat
              </DialogTrigger>

              <DialogContent
                className="w-[calc(100%-3rem)] border border-gray-300 bg-white"
                showCloseButton={false}
              >
                <ScrollArea className="h-[70vh]">
                  <DialogHeader>
                    <DialogTitle></DialogTitle>
                  </DialogHeader>
                  <DialogDescription></DialogDescription>

                  <Form
                    route="address.update"
                    disableWhileProcessing
                    resetOnSuccess
                    onSuccess={() => setIsOpen(false)}
                  >
                    {({ errors, processing }) => (
                      <FieldSet>
                        <input type="hidden" name="latitude" value={watchedLat ?? ''} readOnly />
                        <input type="hidden" name="longitude" value={watchedLng ?? ''} readOnly />
                        <input type="hidden" name="radius" value={watchedRadius ?? ''} readOnly />

                        <FieldGroup>
                          <Field data-invalid={errors.name ? 'true' : undefined}>
                            <FieldLabel className="text-sm">Nama Lengkap</FieldLabel>
                            <Input
                              className="h-10 px-3 py-1"
                              name="name"
                              placeholder="Masukkan nama lengkap"
                              defaultValue={props.address?.name}
                            />
                            <FieldError
                              errors={errors.name ? [{ message: errors.name }] : undefined}
                            />
                          </Field>

                          <Field data-invalid={errors.phone ? 'true' : undefined}>
                            <FieldLabel className="text-sm">Nomor Telepon</FieldLabel>
                            <PhoneInput
                              className="h-10 px-3 py-1"
                              name="phone"
                              placeholder="Masukkan nomor telepon"
                              defaultValue={props.address?.phone}
                            />
                            <FieldError
                              errors={errors.phone ? [{ message: errors.phone }] : undefined}
                            />
                          </Field>

                          <Field data-invalid={errors.street ? 'true' : undefined}>
                            <FieldLabel className="text-sm">Nama Jalan</FieldLabel>
                            <Textarea
                              className="h-22 p-3"
                              name="street"
                              placeholder="Masukkan nama jalan"
                              defaultValue={props.address?.street}
                            />
                            <FieldError
                              errors={errors.street ? [{ message: errors.street }] : undefined}
                            />
                          </Field>

                          <Field data-invalid={errors.note ? 'true' : undefined}>
                            <FieldLabel className="text-sm">Catatan</FieldLabel>
                            <Input
                              className="h-10 px-3 py-1"
                              name="note"
                              placeholder="Masukkan catatan"
                              defaultValue={props.address?.note ?? undefined}
                            />
                            <FieldError
                              errors={errors.note ? [{ message: errors.note }] : undefined}
                            />
                          </Field>

                          <Field
                            data-invalid={
                              form.formState.errors.latitude ||
                              form.formState.errors.longitude ||
                              form.formState.errors.radius
                                ? 'true'
                                : undefined
                            }
                          >
                            <FieldLabel className="text-sm">Lokasi Pinpoint</FieldLabel>
                            <div className="overflow-hidden rounded-lg border border-border">
                              <PinpointMap
                                position={
                                  new LatLng(
                                    form.watch('latitude') || defaultPosition.lat,
                                    form.watch('longitude') || defaultPosition.lng
                                  )
                                }
                                onPositionChange={handlePositionChange}
                                onRadiusChange={handleRadiusChange}
                                disableAutoLocation={!!props.address}
                              />
                            </div>
                            <FieldError
                              errors={
                                form.formState.errors.latitude
                                  ? [{ message: form.formState.errors.latitude.message }]
                                  : form.formState.errors.longitude
                                    ? [{ message: form.formState.errors.longitude.message }]
                                    : form.formState.errors.radius
                                      ? [{ message: form.formState.errors.radius.message }]
                                      : undefined
                              }
                            />
                          </Field>

                          <Field orientation="horizontal">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsOpen(false)}
                              className="flex-1 h-11 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-50 active:scale-95 transition-all text-sm"
                            >
                              Batalkan
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 h-11 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-900 active:scale-95 transition-all"
                            >
                              {processing && <Spinner />}
                              {props.address ? 'Simpan Perubahan' : 'Tambah Alamat'}
                            </Button>
                          </Field>
                        </FieldGroup>
                      </FieldSet>
                    )}
                  </Form>
                </ScrollArea>
              </DialogContent>
            </div>
          </Dialog>
        )}
      </div>
    </UserLayout>
  )
}
