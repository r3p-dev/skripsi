import { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { ReactElement, useEffect } from 'react'
import { toast, Toaster } from 'sonner'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  useEffect(() => {
    toast.dismiss()
  }, [usePage().url])

  if (children.props.flash.error) {
    toast.error(children.props.flash.error)
  }

  if (children.props.flash.success) {
    toast.success(children.props.flash.success)
  }

  return (
    <>
      <main>{children}</main>
      <Toaster position="top-center" richColors />
    </>
  )
}
