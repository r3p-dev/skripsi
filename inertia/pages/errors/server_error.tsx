import { OutlineButton, SolidButton } from '@/components/atoms/editorial'
import ErrorPage from '@/components/molecules/error_page'
import { Link } from '@adonisjs/inertia/react'

export default function ServerError() {
  return (
    <ErrorPage
      metaTitle="Terjadi Kesalahan"
      metaDescription="Server kami sedang mengalami gangguan"
      eyebrow="Error 500"
      title="Terjadi Kesalahan"
      description="Server kami sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi."
    >
      <SolidButton type="button" onClick={() => window.location.reload()}>
        Muat Ulang
      </SolidButton>
      <Link route="home" className="block">
        <OutlineButton render={<span />}>Kembali ke Beranda</OutlineButton>
      </Link>
    </ErrorPage>
  )
}
