import { SolidButton } from '@/components/atoms/editorial'
import ErrorPage from '@/components/molecules/error_page'
import { Link } from '@adonisjs/inertia/react'

export default function InvalidSignature() {
  return (
    <ErrorPage
      metaTitle="Tautan Tidak Valid"
      metaDescription="Tautan yang Anda gunakan sudah tidak valid"
      eyebrow="Tautan Kedaluwarsa"
      title="Tautan Tidak Valid"
      description="Tautan yang Anda gunakan sudah tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru untuk melanjutkan."
    >
      <Link route="home" className="block">
        <SolidButton render={<span />}>Kembali ke Beranda</SolidButton>
      </Link>
      <Link route="session.create" className="py-2 text-center text-small text-ink-subtle">
        Masuk ke Akun
      </Link>
    </ErrorPage>
  )
}
