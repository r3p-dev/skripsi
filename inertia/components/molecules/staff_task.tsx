import { Eyebrow, PageTitle, Panel, SectionLabel } from '@/components/atoms/editorial'
import { telUrl, whatsappUrl } from '@/lib/utils'
import { Link } from '@adonisjs/inertia/react'
import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconLock,
  IconMapPin,
  IconPhone,
  IconPhoneCall,
  IconUser,
} from '@tabler/icons-react'
import { type ReactNode } from 'react'

export function TaskHeader({
  eyebrow,
  title,
  showBack = false,
}: {
  eyebrow: string
  title: string
  showBack?: boolean
}) {
  return (
    <div className="gutter flex items-center gap-3 pt-7 pb-5">
      {showBack && (
        <Link
          route="staff.trip.index"
          aria-label="Kembali ke antrean"
          className="flex size-11 shrink-0 items-center justify-center border border-rule-field text-ink transition-colors hover:bg-paper-tint"
        >
          <IconArrowLeft className="size-5" />
        </Link>
      )}
      <div className="min-w-0">
        <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>
        <PageTitle className="truncate">{title}</PageTitle>
      </div>
    </div>
  )
}

export function BlockedNotice() {
  return (
    <Panel
      tone="tint"
      className="flex flex-col items-center gap-3 border-dashed px-6 py-16 text-center"
    >
      <IconLock className="size-8 text-ink-subtle" />
      <div>
        <p className="m-0 text-lead leading-[1.4] font-semibold text-ink">
          Sedang diproses petugas lain
        </p>
        <p className="m-0 mt-1.5 text-small leading-[1.6] text-ink-soft">
          Tugas ini sedang ditangani oleh petugas lain. Silakan pilih tugas lain dari antrean.
        </p>
      </div>
    </Panel>
  )
}

export function TaskSummary({ status, pickupDate }: { status: string; pickupDate: string }) {
  return (
    <Panel tone="tint" className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 border-b border-rule pb-3">
        <SectionLabel>Status Pesanan</SectionLabel>
        <p className="m-0 text-small leading-normal font-semibold text-ink">{status}</p>
      </div>
      <div className="flex items-center justify-between gap-3 pt-3 text-small leading-normal">
        <span className="text-ink-soft">Jadwal Jemput</span>
        <span className="font-medium text-ink">{pickupDate}</span>
      </div>
    </Panel>
  )
}

const contactButton =
  'flex min-h-11 items-center justify-center gap-2 border border-rule-field px-4 text-meta font-medium tracking-[0.04em] text-ink transition-colors hover:bg-paper-tint'

export function TaskAddress({
  address,
  children,
}: {
  address: { name: string; phone: string; street: string }
  children?: ReactNode
}) {
  return (
    <Panel tone="tint">
      <div className="border-b border-rule px-5 py-3.5">
        <SectionLabel>Alamat</SectionLabel>
      </div>

      <div className="flex flex-col gap-3.5 px-5 py-4">
        <div className="flex items-start gap-3">
          <IconUser className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
          <p className="m-0 text-small leading-normal font-medium text-ink">{address.name}</p>
        </div>
        <div className="flex items-start gap-3">
          <IconPhone className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
          <p className="m-0 text-small leading-normal text-ink-body">{address.phone}</p>
        </div>
        <div className="flex items-start gap-3">
          <IconMapPin className="mt-0.5 size-4 shrink-0 text-ink-subtle" />
          <p className="m-0 text-small leading-[1.6] text-ink-body">{address.street}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={telUrl(address.phone)} className={contactButton}>
            <IconPhoneCall className="size-4" />
            Telepon
          </a>
          <a
            href={whatsappUrl(address.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className={contactButton}
          >
            <IconBrandWhatsapp className="size-4" />
            WhatsApp
          </a>
        </div>

        {children}
      </div>
    </Panel>
  )
}
