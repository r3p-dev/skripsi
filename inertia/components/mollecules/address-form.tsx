import { PhoneInput } from '@/components/atoms/phone-input'
import PinpointMap from '@/components/organisms/pinpoint-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { validateLocation } from '@/lib/location_validator'
import { Form, Link } from '@adonisjs/inertia/react'
import { Data } from '@generated/data'
import { latLng, LatLng } from 'leaflet'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type AddressFormProps = {
  address: Data.Address | null
}

export default function AddressForm({ address }: AddressFormProps) {
  const defaultPosition = latLng(-6.9555305, 107.6540353)

  const [position, setPosition] = useState<LatLng>(
    address ? latLng(address.latitude, address.longitude) : defaultPosition
  )

  const form = useForm<{
    latitude: number
    longitude: number
    radius: number
  }>({
    mode: 'onChange',
    defaultValues: {
      latitude: address ? address.latitude : position.lat,
      longitude: address ? address.longitude : position.lng,
      radius: address ? address.radius : 0,
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
    <Card className="border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-gray-200">
        <CardTitle className="text-lg font-bold">Tambah Alamat Baru</CardTitle>
        <CardDescription className="text-sm">
          Isi informasi alamat pengiriman Anda dengan lengkap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form route="address.update" disableWhileProcessing resetOnSuccess>
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
                    defaultValue={address?.name}
                  />
                  <FieldError errors={errors.name ? [{ message: errors.name }] : undefined} />
                </Field>

                <Field data-invalid={errors.phone ? 'true' : undefined}>
                  <FieldLabel className="text-sm">Nomor Telepon</FieldLabel>
                  <PhoneInput
                    className="h-10 px-3 py-1"
                    name="phone"
                    placeholder="Masukkan nomor telepon"
                    defaultValue={address?.phone}
                  />
                  <FieldError errors={errors.phone ? [{ message: errors.phone }] : undefined} />
                </Field>

                <Field data-invalid={errors.street ? 'true' : undefined}>
                  <FieldLabel className="text-sm">Nama Jalan</FieldLabel>
                  <Textarea
                    className="h-22 p-3"
                    name="street"
                    placeholder="Masukkan nama jalan"
                    defaultValue={address?.street}
                  />
                  <FieldError errors={errors.street ? [{ message: errors.street }] : undefined} />
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
                      disableAutoLocation={!!address}
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
                  <Link route="address.show">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-50 active:scale-95 transition-all text-sm"
                    >
                      Batalkan
                    </Button>
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
          )}
        </Form>
      </CardContent>
    </Card>
  )
}
