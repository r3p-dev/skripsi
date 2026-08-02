import ImageSlider from '@/components/molecules/image_slide'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { areas, reviews, steps } from '@/lib/constants'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import {
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconStar,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'

type PageProps = InertiaProps<{
  services: Data.Service[]
}>

export default function Home({ services }: PageProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState<number>(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    onSelect()

    api.on('select', onSelect)

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const count = api?.scrollSnapList().length ?? 0

  return (
    <div className="mx-auto max-w-md">
      <section className="bg-white px-6 py-5">
        <div className="mb-10 flex items-center gap-3">
          <img src="/images/logo.jpg" alt="Premium Care" className="size-14" />
          <div>
            <h1 className="mb-0.5 text-2xl font-bold tracking-tight text-black">UmimaClean</h1>
            <p className="text-xs tracking-widest text-gray-600 uppercase">Layanan Cuci Sepatu</p>
          </div>
        </div>

        <div className="-mx-6 flex flex-1 flex-col justify-center px-6">
          <div className="relative mb-10 overflow-hidden rounded-2xl bg-black px-8 py-12 text-white">
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative space-y-4">
              <p className="text-xs tracking-[0.3em] text-white/70 uppercase font-medium">
                Eksklusif
              </p>
              <h2 className="text-3xl leading-snug tracking-tight font-bold">
                Sepatu Anda
                <br />
                Layak Perawatan Terbaik
              </h2>
              <p className="leading-relaxed text-white/80">
                Pembersihan profesional dengan layanan antar-jemput gratis di seluruh area Bandung
                Raya
              </p>
              <Link
                route="session.create"
                className={buttonVariants({
                  variant: 'outline',
                  className:
                    'h-11 w-full text-lg font-semibold text-black tracking-wide transition-all duration-300 hover:bg-white/90 active:scale-95',
                })}
              >
                Pesan sekarang
                <IconChevronRight className="size-5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-xl bg-gray-100 p-6 border border-gray-200">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-black/10">
                  <IconClock className="size-5 text-black" />
                </div>
                <span className="text-sm tracking-widest uppercase font-medium text-gray-700">
                  Waktu
                </span>
              </div>
              <p className="text-base font-medium tracking-wide text-black">2-4 Hari</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-6 border border-gray-200">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-black/10">
                  <IconMapPin className="size-5 text-black" />
                </div>
                <span className="text-sm tracking-widest uppercase font-medium text-gray-700">
                  Area
                </span>
              </div>
              <p className="text-base font-medium tracking-wide text-black">Bandung Raya</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-28">
        <div className="mb-14 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Hasil</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">Lihat Perbedaannya</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-2">
            Geser slider untuk melihat hasil pembersihan profesional kami
          </p>
        </div>

        <ImageSlider
          beforeImage="https://images.unsplash.com/photo-1699195025225-221a6554008f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXJ0eSUyMHdvcm4lMjBzbmVha2VycyUyMGJlZm9yZSUyMGNsZWFuaW5nfGVufDF8fHx8MTc3MjEyMzQzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          afterImage="https://images.unsplash.com/photo-1608380272894-b3617f04b463?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmlzdGluZSUyMGNsZWFuJTIwd2hpdGUlMjBzbmVha2VycyUyMGFmdGVyfGVufDF8fHx8MTc3MjEyMzQzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        />
      </section>

      <section className="bg-gray-50 px-6 py-28 border-t border-b border-gray-200">
        <div className="mb-16 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Layanan</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">Keahlian Kami</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-2">
            Berbagai pilihan perawatan profesional untuk setiap kebutuhan sepatu Anda
          </p>
        </div>

        <div className="pb-8">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'center',
              loop: true,
            }}
          >
            <CarouselContent>
              {services.map((service, index) => (
                <CarouselItem key={service.name}>
                  <Card className="h-full flex gap-2 flex-col justify-between rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                    <CardHeader className="tracking-[0.2em] text-gray-500 font-medium pt-6">
                      {String(index + 1).padStart(2, '0')}
                    </CardHeader>
                    <CardContent>
                      <h3 className="mb-4 text-xl font-bold tracking-tight text-black">
                        {service.name}
                      </h3>
                      <p className="mb-6 flex-1 leading-relaxed text-gray-700 text-sm">
                        {service.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="border-gray-300 w-full">
                        <div className="flex items-center justify-between mt-6 pb-6">
                          <span className="text-sm tracking-widest text-gray-600 uppercase font-medium">
                            {service.type}
                          </span>
                          <span className="text-base font-semibold tracking-wide text-black">
                            {service.price}
                          </span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/*
          The dot stays 10px — it is an indicator, not a button you are meant to
          aim at. What grew is the invisible box around it, so the dot can be
          hit with a thumb rather than only with a mouse.
        */}
        <div className="-my-3 flex justify-between">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className="flex flex-1 cursor-pointer items-center justify-center py-3"
              aria-label={`Ke slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
            >
              <span
                className={`size-2.5 rounded-full transition-colors ${i === current ? 'bg-black' : 'bg-gray-400'}`}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-28">
        <div className="mb-16 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Proses</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">Cara Kerja</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-2">
            Proses mudah dalam 4 langkah sederhana
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex gap-5 rounded-2xl border border-gray-300 bg-gray-50 p-6 transition-colors hover:bg-gray-100 active:scale-95"
            >
              <div className="shrink-0">
                <div className="flex size-14 items-center justify-center rounded-lg bg-black text-white shrink-0">
                  <step.icon className="size-6" />
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs tracking-widest text-gray-500 font-medium">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-base font-bold text-black">{step.title}</h3>
                </div>
                <p className="leading-relaxed text-gray-700 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 px-6 py-28 border-t border-b border-gray-200">
        <div className="mb-14 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Jangkauan</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">Area Layanan</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-2">
            Kami melayani seluruh wilayah Bandung Raya dengan bangga
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {areas.map((area, index) => (
            <div
              key={index}
              className="flex touch-target flex-col items-center gap-3 rounded-xl border border-gray-300 bg-white p-5 text-center transition-all hover:shadow-sm active:scale-95"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/10">
                <IconMapPin className="size-5 text-black" />
              </div>
              <span className="text-sm font-medium tracking-wide text-black">{area}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-28">
        <div className="mb-14 text-center space-y-2">
          <p className="text-xs tracking-[0.3em] text-gray-600 uppercase font-medium">Testimoni</p>
          <h2 className="text-3xl font-bold tracking-tight text-black">Kata Pelanggan</h2>
          <p className="text-sm leading-relaxed text-gray-700 pt-2">
            Kepercayaan dan kepuasan pelanggan adalah prioritas kami
          </p>
        </div>

        <div className="space-y-4">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-300 bg-gray-50 p-6 transition-colors hover:bg-gray-100 active:scale-95"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-base font-bold text-black tracking-wide">
                    {review.name}
                  </h3>
                  <p className="text-xs tracking-wide text-gray-600">{review.date}</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <IconStar key={i} className="size-4 fill-black text-black" />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">&quot;{review.comment}&quot;</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-black px-6 py-40 text-white">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 text-center space-y-8">
          <p className="text-xs tracking-[0.3em] text-white/70 uppercase font-medium">
            Mulai Sekarang
          </p>
          <h2 className="text-3xl leading-snug tracking-tight font-bold">
            Siap Merawat
            <br />
            Sepatu Anda?
          </h2>
          <p className="text-sm leading-relaxed text-white/80 max-w-xs mx-auto">
            Pesan layanan hari ini dan rasakan perawatan sepatu profesional terbaik
          </p>
          <Link
            route="session.create"
            className={buttonVariants({
              variant: 'outline',
              className:
                'h-11 w-full text-lg font-semibold text-black tracking-wide transition-all duration-300 hover:bg-white/90 active:scale-95',
            })}
          >
            Pesan sekarang
            <IconChevronRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-md space-y-10">
          <div className="text-center">
            <h3 className="mb-2 text-3xl font-bold tracking-tight">UmimaClean</h3>
            <p className="text-xs tracking-widest text-white/60 uppercase font-medium">Bandung</p>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-xs tracking-widest text-white/60 uppercase font-medium">
              Hubungi Kami
            </p>
            <div className="flex justify-center gap-5">
              <a
                href="https://wa.me/6281234567890"
                className="flex items-center justify-center gap-3 py-2 text-sm font-medium transition-colors hover:text-white/80 active:scale-95"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                  <IconMapPin className="size-5" />
                </div>
              </a>
              <a
                href="https://wa.me/6281234567890"
                className="flex items-center justify-center gap-3 py-2 text-sm font-medium transition-colors hover:text-white/80 active:scale-95"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                  <IconBrandWhatsapp className="size-5" />
                </div>
              </a>
              <a
                href="https://instagram.com/premiumcare.bdg"
                className="flex items-center justify-center gap-3 py-2 text-sm font-medium transition-colors hover:text-white/80 active:scale-95"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
                  <IconBrandInstagram className="size-5" />
                </div>
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="space-y-2 text-center">
              <p className="text-xs tracking-wide text-white/50">
                © 2026 UmimaClean. Hak Cipta Dilindungi.
              </p>
              <p className="text-xs tracking-wide text-white/50">Melayani Area Bandung Raya</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
