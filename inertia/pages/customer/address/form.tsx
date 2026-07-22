import CustomerProfileLayout from '@/components/layouts/customer_profile_layout'
import { PhoneInput } from '@/components/atoms/phone_input'
import PinpointMap from '@/components/organisms/pinpoint_map'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { validateLocation } from '@/lib/location_validator'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@/generated/data'
import { latLng, type LatLng } from 'leaflet'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

type AddressFormProps = {
  address: Data.Address | null
}

export default function AddressForm({ address }: AddressFormProps) {
  const defaultPosition = latLng(-6.9555305, 107.6540353)

  const form = useForm<{
    latitude: number
    longitude: number
  }>({
    mode: 'onChange',
    defaultValues: {
      latitude: address?.latitude ?? defaultPosition.lat,
      longitude: address?.longitude ?? defaultPosition.lng,
    },
  })

  const watchedLat = useWatch({
    control: form.control,
    name: 'latitude',
  })

  const watchedLng = useWatch({
    control: form.control,
    name: 'longitude',
  })

  const position = useMemo(() => {
    if (watchedLat === null || watchedLng === null) {
      return defaultPosition
    }

    return latLng(watchedLat, watchedLng)
  }, [watchedLat, watchedLng, defaultPosition])

  useEffect(() => {
    if (watchedLat === null || watchedLng === null) return

    const result = validateLocation(watchedLat, watchedLng)

    if (!result.valid) {
      form.setError('latitude', {
        type: 'manual',
        message: result.message,
      })

      form.setError('longitude', {
        type: 'manual',
        message: result.message,
      })
    } else {
      form.clearErrors(['latitude', 'longitude'])
    }
  }, [watchedLat, watchedLng, form])

  function handlePositionChange(pos: LatLng) {
    form.setValue('latitude', pos.lat, {
      shouldValidate: true,
      shouldDirty: true,
    })

    form.setValue('longitude', pos.lng, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  return (
    <CustomerProfileLayout title="Tambah Alamat" description="Tambahkan alamat baru Anda">
      <div className="pb-20">
        <Card className="border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="text-lg font-bold">Tambah Alamat Baru</CardTitle>
            <CardDescription className="text-sm">
              Isi informasi alamat pengiriman Anda dengan lengkap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form route="customer.address.store" disableWhileProcessing resetOnSuccess>
              {({ errors, processing }) => {
                const positionError =
                  form.formState.errors.latitude?.message ||
                  form.formState.errors.longitude?.message ||
                  errors.position

                return (
                  <FieldSet>
                    <input type="hidden" name="latitude" value={watchedLat ?? ''} readOnly />
                    <input type="hidden" name="longitude" value={watchedLng ?? ''} readOnly />

                    <FieldGroup>
                      <Field data-invalid={errors.name ? 'true' : undefined}>
                        <FieldLabel className="text-sm">Nama Lengkap</FieldLabel>
                        <Input
                          className="h-10 px-3 py-1"
                          name="name"
                          placeholder="Masukkan nama lengkap"
                          defaultValue={address?.recipientName}
                        />
                        <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
                      </Field>

                      <Field data-invalid={errors.phone ? 'true' : undefined}>
                        <FieldLabel className="text-sm">Nomor Telepon</FieldLabel>
                        <PhoneInput
                          className="h-10 px-3 py-1"
                          name="phone"
                          placeholder="Masukkan nomor telepon"
                          defaultValue={address?.recipientPhone}
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
                          defaultValue={address?.addressDetail}
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
                          defaultValue={address?.note ?? undefined}
                        />
                        <FieldError errors={errors.note ? [{ message: errors.note }] : undefined} />
                      </Field>

                      <Field data-invalid={positionError ? 'true' : undefined}>
                        <FieldLabel className="text-sm">Lokasi Pinpoint</FieldLabel>
                        <div className="overflow-hidden rounded-lg border border-border">
                          <PinpointMap
                            value={position}
                            onChange={handlePositionChange}
                            disableAutoLocation={!!address}
                          />
                        </div>
                        <FieldError
                          errors={positionError ? [{ message: positionError }] : undefined}
                        />
                      </Field>

                      <Field orientation="horizontal">
                        <Link
                          route="customer.address.show"
                          className={buttonVariants({
                            variant: 'outline',
                            className:
                              'flex-1 h-11 border-2 border-gray-300! font-semibold active:scale-95 transition-all',
                          })}
                        >
                          Batalkan
                        </Link>
                        <Button
                          type="submit"
                          className="flex-1 h-11 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-900 active:scale-95 transition-all"
                        >
                          {processing && <Spinner />}
                          {address ? 'Simpan Perubahan' : 'Tambah Alamat'}
                        </Button>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                )
              }}
            </Form>
          </CardContent>
        </Card>
      </div>
    </CustomerProfileLayout>
  )
}
