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
    'auth/forgot-password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot-password.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/register': ExtractProps<(typeof import('../../inertia/pages/auth/register.tsx'))['default']>
    'auth/reset-password': ExtractProps<(typeof import('../../inertia/pages/auth/reset-password.tsx'))['default']>
    'errors/invalid-token': ExtractProps<(typeof import('../../inertia/pages/errors/invalid-token.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'customer/address': ExtractProps<(typeof import('../../inertia/pages/customer/address.tsx'))['default']>
    'customer/order/create': ExtractProps<(typeof import('../../inertia/pages/customer/order/create.tsx'))['default']>
    'customer/order/index': ExtractProps<(typeof import('../../inertia/pages/customer/order/index.tsx'))['default']>
    'customer/order/show': ExtractProps<(typeof import('../../inertia/pages/customer/order/show.tsx'))['default']>
    'customer/profile': ExtractProps<(typeof import('../../inertia/pages/customer/profile.tsx'))['default']>
    'staff/tasks': ExtractProps<(typeof import('../../inertia/pages/staff/tasks.tsx'))['default']>
    'transaction/down-payment': ExtractProps<(typeof import('../../inertia/pages/transaction/down-payment.tsx'))['default']>
    'transaction/full-payment': ExtractProps<(typeof import('../../inertia/pages/transaction/full-payment.tsx'))['default']>
    'admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/admin/dashboard.tsx'))['default']>
    'customer/address/show': ExtractProps<(typeof import('../../inertia/pages/customer/address/show.tsx'))['default']>
    'customer/address/create': ExtractProps<(typeof import('../../inertia/pages/customer/address/create.tsx'))['default']>
  }
}
