import { Form, Link } from '@adonisjs/inertia/react'
import type { ComponentProps, PropsWithChildren } from 'react'

export function OrderBackLink({
  orderNumber,
  className,
  children,
}: PropsWithChildren<{ orderNumber: string; className?: string }>) {
  return (
    <Link route="customer.orders.show" routeParams={{ number: orderNumber }} className={className}>
      {children}
    </Link>
  )
}

export function RetryPaymentForm({
  orderNumber,
  children,
}: {
  orderNumber: string
  children: ComponentProps<typeof Form>['children']
}) {
  return (
    <Form route="customer.transaction.store" routeParams={{ number: orderNumber }}>
      {children}
    </Form>
  )
}
