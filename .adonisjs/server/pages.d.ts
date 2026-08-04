import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'admin/index': ExtractProps<(typeof import('../../inertia/pages/admin/index.tsx'))['default']>
    'admin/order/index': ExtractProps<(typeof import('../../inertia/pages/admin/order/index.tsx'))['default']>
    'admin/order/show': ExtractProps<(typeof import('../../inertia/pages/admin/order/show.tsx'))['default']>
    'admin/profile/show': ExtractProps<(typeof import('../../inertia/pages/admin/profile/show.tsx'))['default']>
    'admin/reconciliation/index': ExtractProps<(typeof import('../../inertia/pages/admin/reconciliation/index.tsx'))['default']>
    'admin/report/index': ExtractProps<(typeof import('../../inertia/pages/admin/report/index.tsx'))['default']>
    'admin/service/create': ExtractProps<(typeof import('../../inertia/pages/admin/service/create.tsx'))['default']>
    'admin/service/edit': ExtractProps<(typeof import('../../inertia/pages/admin/service/edit.tsx'))['default']>
    'admin/service/index': ExtractProps<(typeof import('../../inertia/pages/admin/service/index.tsx'))['default']>
    'admin/user/create': ExtractProps<(typeof import('../../inertia/pages/admin/user/create.tsx'))['default']>
    'admin/user/edit': ExtractProps<(typeof import('../../inertia/pages/admin/user/edit.tsx'))['default']>
    'admin/user/index': ExtractProps<(typeof import('../../inertia/pages/admin/user/index.tsx'))['default']>
    'auth/forgot_password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot_password.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/reset_password': ExtractProps<(typeof import('../../inertia/pages/auth/reset_password.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'customer/address/create': ExtractProps<(typeof import('../../inertia/pages/customer/address/create.tsx'))['default']>
    'customer/address/show': ExtractProps<(typeof import('../../inertia/pages/customer/address/show.tsx'))['default']>
    'customer/order/create': ExtractProps<(typeof import('../../inertia/pages/customer/order/create.tsx'))['default']>
    'customer/order/index': ExtractProps<(typeof import('../../inertia/pages/customer/order/index.tsx'))['default']>
    'customer/order/receipt': ExtractProps<(typeof import('../../inertia/pages/customer/order/receipt.tsx'))['default']>
    'customer/order/show': ExtractProps<(typeof import('../../inertia/pages/customer/order/show.tsx'))['default']>
    'customer/profile/show': ExtractProps<(typeof import('../../inertia/pages/customer/profile/show.tsx'))['default']>
    'errors/invalid_signature': ExtractProps<(typeof import('../../inertia/pages/errors/invalid_signature.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'order/payment': ExtractProps<(typeof import('../../inertia/pages/order/payment.tsx'))['default']>
    'staff/inspection/show': ExtractProps<(typeof import('../../inertia/pages/staff/inspection/show.tsx'))['default']>
    'staff/order/create': ExtractProps<(typeof import('../../inertia/pages/staff/order/create.tsx'))['default']>
    'staff/order/edit': ExtractProps<(typeof import('../../inertia/pages/staff/order/edit.tsx'))['default']>
    'staff/order/receipt': ExtractProps<(typeof import('../../inertia/pages/staff/order/receipt.tsx'))['default']>
    'staff/order/tag': ExtractProps<(typeof import('../../inertia/pages/staff/order/tag.tsx'))['default']>
    'staff/profile/show': ExtractProps<(typeof import('../../inertia/pages/staff/profile/show.tsx'))['default']>
    'staff/trip/index': ExtractProps<(typeof import('../../inertia/pages/staff/trip/index.tsx'))['default']>
    'staff/trip/show': ExtractProps<(typeof import('../../inertia/pages/staff/trip/show.tsx'))['default']>
  }
}
