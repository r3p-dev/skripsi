import { SolidButton } from '@/components/atoms/editorial'
import ErrorPage from '@/components/molecules/error_page'
import { Link } from '@adonisjs/inertia/react'

export default function NotFound() {
  return (
    <ErrorPage
      metaTitle="Halaman Tidak Ditemukan"
      metaDescription="Halaman yang Anda cari tidak dapat ditemukan"
      eyebrow="Error 404"
      title="Halaman Tidak Ditemukan"
      description="Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau memang tidak pernah ada."
    >
      <Link route="home" className="block">
        <SolidButton render={<span />}>Kembali ke Beranda</SolidButton>
      </Link>
    </ErrorPage>
  )
}
