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
    'admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/admin/dashboard.tsx'))['default']>
    'admin/item': ExtractProps<(typeof import('../../inertia/pages/admin/item.tsx'))['default']>
    'admin/order': ExtractProps<(typeof import('../../inertia/pages/admin/order.tsx'))['default']>
    'admin/profile': ExtractProps<(typeof import('../../inertia/pages/admin/profile.tsx'))['default']>
    'admin/service/form': ExtractProps<(typeof import('../../inertia/pages/admin/service/form.tsx'))['default']>
    'admin/service/index': ExtractProps<(typeof import('../../inertia/pages/admin/service/index.tsx'))['default']>
    'admin/transaction': ExtractProps<(typeof import('../../inertia/pages/admin/transaction.tsx'))['default']>
    'admin/user': ExtractProps<(typeof import('../../inertia/pages/admin/user.tsx'))['default']>
    'auth/forgot_password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot_password.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/reset_password': ExtractProps<(typeof import('../../inertia/pages/auth/reset_password.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'customer/address/form': ExtractProps<(typeof import('../../inertia/pages/customer/address/form.tsx'))['default']>
    'customer/address/show': ExtractProps<(typeof import('../../inertia/pages/customer/address/show.tsx'))['default']>
    'customer/order/create': ExtractProps<(typeof import('../../inertia/pages/customer/order/create.tsx'))['default']>
    'customer/order/index': ExtractProps<(typeof import('../../inertia/pages/customer/order/index.tsx'))['default']>
    'customer/order/show': ExtractProps<(typeof import('../../inertia/pages/customer/order/show.tsx'))['default']>
    'customer/profile': ExtractProps<(typeof import('../../inertia/pages/customer/profile.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'staff/offline_order': ExtractProps<(typeof import('../../inertia/pages/staff/offline_order.tsx'))['default']>
    'staff/profile': ExtractProps<(typeof import('../../inertia/pages/staff/profile.tsx'))['default']>
    'staff/task/index': ExtractProps<(typeof import('../../inertia/pages/staff/task/index.tsx'))['default']>
    'staff/task/inspection': ExtractProps<(typeof import('../../inertia/pages/staff/task/inspection.tsx'))['default']>
    'staff/task/pickup_delivery': ExtractProps<(typeof import('../../inertia/pages/staff/task/pickup_delivery.tsx'))['default']>
    'transaction': ExtractProps<(typeof import('../../inertia/pages/transaction.tsx'))['default']>
  }
}
