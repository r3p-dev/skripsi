import ImageSlider from '@/components/molecules/image_slide'
import {
  BackLink,
  Eyebrow,
  Rule,
  Shell,
  SolidButton,
  StickyBar,
} from '@/components/atoms/editorial'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CatalogueCategoryLabel } from '@/enums/catalogue_enum'
import { IconStarFilled } from '@tabler/icons-react'
import { areas, benefits, contact, faqs, rituals, reviews, steps, terms } from '@/lib/constants'
import type { Data } from '@/generated/data'
import type { InertiaProps } from '@/types'
import { Link } from '@adonisjs/inertia/react'
import { useMemo } from 'react'

type PageProps = InertiaProps<{
  catalogues: Data.Catalogue[]
}>

export default function Home({ catalogues }: PageProps) {
  const groups = useMemo(() => {
    const byCategory = new Map<string, Data.Catalogue[]>()

    for (const catalogue of catalogues) {
      const existing = byCategory.get(catalogue.category) ?? []

      byCategory.set(catalogue.category, [...existing, catalogue])
    }

    return [...byCategory.entries()]
  }, [catalogues])

  return (
    <div className="bg-paper">
      <Shell className="relative pb-nav tablet:max-w-190 desktop:max-w-none desktop:pb-0">
        <div>
          <div className="flex flex-col tablet:grid tablet:grid-cols-2 tablet:items-center tablet:gap-12 tablet:gutter tablet:py-14 desktop:grid-cols-[1.1fr_1fr] desktop:gap-20 desktop:px-[clamp(40px,6vw,96px)] desktop:py-18">
            <div className="gutter flex flex-col items-center pt-6 pb-12 text-center tablet:order-2 tablet:items-start tablet:px-0 tablet:py-0 tablet:text-left">
              <img src="/images/logo_full.jpg" alt="Umima" className="mb-7 w-37.5 object-contain" />
              <Eyebrow className="mb-7">Perawatan Sepatu Profesional</Eyebrow>
              <h1 className="m-0 mb-2 max-w-70 text-lead leading-[1.6] font-normal text-ink-strong">
                Bersihkan, rawat, dan kembalikan sepatu, tas, serta helm Anda seperti baru.
              </h1>
              <div className="mb-8 text-meta leading-normal text-ink-subtle">
                Berbasis di Bandung, Jawa Barat
              </div>
              <Link
                route="session.create"
                className="inline-block border border-ink px-11 py-4 text-small font-medium tracking-[0.08em] text-ink uppercase hover:bg-ink/5"
              >
                Pesan Sekarang
              </Link>
            </div>
            <div className="gutter tablet:order-1 tablet:px-0">
              <img
                src="/images/logo.jpg"
                alt="Perawatan Umima"
                className="aspect-4/5 w-full border border-rule object-cover desktop:ml-auto desktop:max-w-130"
              />
            </div>
          </div>

          <Rule className="mx-[clamp(24px,4vw,64px)]" />

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-8">Keunggulan</Eyebrow>
            <div className="grid grid-cols-2 gap-x-5 gap-y-7 tablet:gap-x-8 tablet:gap-y-7 desktop:grid-cols-3 xl:grid-cols-4">
              {benefits.map((benefit, index) => (
                <div key={benefit.title} className="flex gap-3.5">
                  <div className="w-6 flex-none text-small leading-[1.4] text-ink-faint">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="mb-1.5 text-lead leading-[1.4] font-semibold text-ink">
                      {benefit.title}
                    </div>
                    <div className="text-small leading-[1.6] text-ink-soft">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-ink py-14">
            <div className="gutter desktop:mx-auto desktop:max-w-280">
              <Eyebrow className="mb-8">Cara Kerja</Eyebrow>
              <div className="flex flex-col">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4.5 border-b border-rule-inverse py-4.5 last:border-b-0"
                  >
                    <div className="w-5.5 flex-none text-small leading-[1.6] text-[#9a9a9a]">
                      {index + 1}
                    </div>
                    <div className="text-body leading-[1.6] text-[#eee]">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-2">Hasil Nyata</Eyebrow>
            <div className="mb-7 text-body leading-[1.6] text-ink-soft">
              Geser untuk melihat perbedaannya.
            </div>
            <ImageSlider
              beforeImage="/images/logo.jpg"
              afterImage="/images/logo_full.jpg"
              className="aspect-4/5 tablet:aspect-video"
            />
          </section>

          <Rule className="mx-[clamp(24px,4vw,64px)]" />

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-2">Area Layanan</Eyebrow>
            <div className="mb-6 text-body leading-[1.6] text-ink-soft">
              Antar-jemput gratis dalam radius tertentu dari basecamp kami di Margacinta, Bandung.
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 tablet:grid-cols-3">
              {areas.map((area) => (
                <div key={area} className="text-body leading-[1.6] text-ink-body">
                  — {area}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-paper-tint py-14">
            <div className="gutter desktop:mx-auto desktop:max-w-280">
              <Eyebrow className="mb-2">Testimoni</Eyebrow>
              <div className="mb-7 text-body leading-[1.6] text-ink-soft">
                Dikutip apa adanya dari ulasan Google Maps Umima Clean, tanpa diubah.
              </div>
              <div className="flex flex-col gap-7 tablet:grid tablet:grid-cols-2 tablet:gap-x-8 tablet:gap-y-7">
                {reviews.map((review) => (
                  <div key={review.name}>
                    <div className="mb-2 flex items-center gap-0.5 text-ink">
                      {Array.from({ length: review.rating }, (_, star) => (
                        <IconStarFilled key={star} className="size-3.5" />
                      ))}
                    </div>
                    <div className="mb-2.5 text-lead leading-[1.6] text-ink-strong">
                      “{review.comment}”
                    </div>
                    <div className="text-meta leading-[1.4] text-ink-subtle">
                      — {review.name} · Ulasan Google
                    </div>
                  </div>
                ))}
              </div>
              <a
                href={contact.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-block border-b border-ink pb-1 text-meta leading-[1.4] text-ink hover:text-ink-soft"
              >
                Baca &amp; verifikasi semua ulasan di Google Maps
              </a>
            </div>
          </section>

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-2">Proses Perawatan</Eyebrow>
            <div className="mb-7 text-body leading-[1.6] text-ink-soft">
              Setiap barang melewati ritual perawatan yang sama, terlepas dari mereknya.
            </div>
            <div className="flex flex-col">
              {rituals.map((ritual) => (
                <div
                  key={ritual.name}
                  className="flex justify-between border-b border-rule py-4 last:border-b-0"
                >
                  <span className="text-body leading-normal text-ink-body">{ritual.name}</span>
                  <span className="text-small leading-normal text-ink-subtle">{ritual.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <Rule className="mx-[clamp(24px,4vw,64px)]" />

          <section id="pricing" className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-1">Harga</Eyebrow>
            <div className="mb-7 text-body leading-[1.6] text-ink-soft">
              Katalog lengkap layanan perawatan kami.
            </div>

            <Accordion
              defaultValue={groups.length > 0 ? [groups[0][0]] : []}
              className="desktop:grid desktop:grid-cols-2 desktop:gap-x-14 desktop:gap-y-0"
            >
              {groups.map(([category, items]) => (
                <AccordionItem
                  key={category}
                  value={category}
                  className="border-b border-rule desktop:self-start"
                >
                  <AccordionTrigger className="py-4 text-meta font-semibold tracking-[0.06em] text-ink uppercase">
                    {CatalogueCategoryLabel[category as keyof typeof CatalogueCategoryLabel] ??
                      category}
                    <span className="ml-2 text-eyebrow font-normal tracking-normal text-ink-subtle normal-case">
                      {items.length} layanan
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3.5">
                    <div className="flex flex-col">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <span className="text-body leading-[1.4] text-ink-strong">
                            {item.name}
                          </span>
                          <span className="text-body leading-[1.4] font-semibold whitespace-nowrap text-ink">
                            {item.priceLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Link route="session.create" className="mt-6 block">
              <SolidButton render={<span />}>Pesan Sekarang</SolidButton>
            </Link>
          </section>

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-6">FAQ</Eyebrow>
            <Accordion>
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="border-b border-rule last:border-b-0"
                >
                  <AccordionTrigger className="py-4 text-body font-medium text-ink">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-body leading-[1.6] text-ink-soft">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <Rule className="mx-[clamp(24px,4vw,64px)]" />

          <section className="gutter py-14 desktop:mx-auto desktop:max-w-280">
            <Eyebrow className="mb-2">Syarat &amp; Ketentuan</Eyebrow>
            <div className="mb-7 text-body leading-[1.6] text-ink-soft">
              Berlaku untuk layanan pick-up &amp; delivery.
            </div>
            <div className="flex flex-col">
              {terms.map((term, index) => (
                <div
                  key={term}
                  className="flex gap-4.5 border-b border-rule py-4.5 last:border-b-0"
                >
                  <div className="w-6 flex-none text-small leading-[1.6] text-ink-faint">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="text-body leading-[1.6] text-ink-body">{term}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="gutter pt-10 pb-8 text-center">
          <img
            src="/images/logo_full.jpg"
            alt="Umima"
            className="mx-auto mb-4 w-27.5 object-contain"
          />
          <div className="text-meta leading-[1.6] text-ink-subtle">Bandung, Jawa Barat</div>
          <div className="text-meta leading-[1.6] text-ink-subtle">
            Jam Operasional {contact.operationalHours}
          </div>
          <a
            href={`tel:${contact.phone.replace(/-/g, '')}`}
            className="text-meta leading-[1.6] text-ink-body hover:underline"
          >
            {contact.phone}
          </a>
          <div className="mt-4 mb-4 text-meta leading-[1.6] text-ink-subtle">
            © 2026 Umima. Semua hak dilindungi.
          </div>
          <BackLink route="session.create_internal" className="text-eyebrow text-ink-faint">
            Login Staf &amp; Admin
          </BackLink>
        </footer>

        <StickyBar className="tablet:max-w-190 desktop:hidden">
          <Link
            route="session.create"
            className="flex flex-1 justify-center bg-ink px-4 py-4 text-small font-medium tracking-[0.08em] text-white uppercase hover:bg-ink/90"
          >
            Pesan Sekarang
          </Link>
        </StickyBar>
      </Shell>
    </div>
  )
}
