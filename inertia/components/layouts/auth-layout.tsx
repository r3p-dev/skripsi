import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@adonisjs/inertia/react'
import { type PropsWithChildren } from 'react'

export default function AuthLayout({
  children,
  title,
  description,
}: PropsWithChildren<{
  name?: string
  title?: string
  description?: string
}>) {
  return (
    <div className="flex max-w-md mx-auto min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
      <div className="flex w-full flex-col gap-6">
        <Link route="home" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-20 w-20 items-center justify-center">
            <img src="/images/umima-logo.png" className="size-20 fill-current text-black" />
          </div>
        </Link>

        <div className="flex flex-col gap-6">
          <Card className="rounded-xl bg-background">
            <CardHeader className="px-10 pt-8 pb-2 text-center">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-8 pt-4">{children}</CardContent>
          </Card>
        </div>

        <footer className="border-gray-200 bottom-0">
          <p className="text-xs text-gray-600 text-center">
            UmimaClean - Layanan Cuci Sepatu Terpercaya
          </p>
        </footer>
      </div>
    </div>
  )
}
