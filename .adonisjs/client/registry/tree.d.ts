/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  robots: typeof routes['robots']
  sitemap: typeof routes['sitemap']
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
  transaction: {
    update: typeof routes['transaction.update']
  }
  home: typeof routes['home']
  signup: {
    create: typeof routes['signup.create']
    store: typeof routes['signup.store']
  }
  session: {
    createInternal: typeof routes['session.create_internal']
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  passwordReset: {
    create: typeof routes['password_reset.create']
    store: typeof routes['password_reset.store']
    edit: typeof routes['password_reset.edit']
    update: typeof routes['password_reset.update']
  }
  customer: {
    profile: {
      show: typeof routes['customer.profile.show']
      update: typeof routes['customer.profile.update']
    }
    phone: {
      store: typeof routes['customer.phone.store']
      update: typeof routes['customer.phone.update']
    }
    password: {
      update: typeof routes['customer.password.update']
    }
    address: {
      geocode: typeof routes['customer.address.geocode']
      nearby: typeof routes['customer.address.nearby']
      show: typeof routes['customer.address.show']
      create: typeof routes['customer.address.create']
      store: typeof routes['customer.address.store']
    }
    orders: {
      receipt: typeof routes['customer.orders.receipt']
      index: typeof routes['customer.orders.index']
      create: typeof routes['customer.orders.create']
      store: typeof routes['customer.orders.store']
      show: typeof routes['customer.orders.show']
      update: typeof routes['customer.orders.update']
    }
    transaction: {
      show: typeof routes['customer.transaction.show']
      store: typeof routes['customer.transaction.store']
    }
  }
  staff: {
    profile: {
      show: typeof routes['staff.profile.show']
      update: typeof routes['staff.profile.update']
    }
    phone: {
      store: typeof routes['staff.phone.store']
      update: typeof routes['staff.phone.update']
    }
    trip: {
      index: typeof routes['staff.trip.index']
      show: typeof routes['staff.trip.show']
      update: typeof routes['staff.trip.update']
      destroy: typeof routes['staff.trip.destroy']
    }
    inspection: {
      show: typeof routes['staff.inspection.show']
      update: typeof routes['staff.inspection.update']
      destroy: typeof routes['staff.inspection.destroy']
    }
    cleaning: {
      update: typeof routes['staff.cleaning.update']
    }
    collection: {
      update: typeof routes['staff.collection.update']
    }
    notification: {
      store: typeof routes['staff.notification.store']
    }
    tag: {
      show: typeof routes['staff.tag.show']
    }
    customers: {
      index: typeof routes['staff.customers.index']
    }
    order: {
      create: typeof routes['staff.order.create']
      store: typeof routes['staff.order.store']
      edit: typeof routes['staff.order.edit']
      update: typeof routes['staff.order.update']
      receipt: typeof routes['staff.order.receipt']
    }
  }
  internal: {
    action: {
      photo: typeof routes['internal.action.photo']
    }
  }
  admin: {
    profile: {
      show: typeof routes['admin.profile.show']
      update: typeof routes['admin.profile.update']
    }
    phone: {
      store: typeof routes['admin.phone.store']
      update: typeof routes['admin.phone.update']
    }
    dashboard: {
      index: typeof routes['admin.dashboard.index']
    }
    order: {
      export: typeof routes['admin.order.export']
      index: typeof routes['admin.order.index']
      show: typeof routes['admin.order.show']
    }
    reconciliation: {
      index: typeof routes['admin.reconciliation.index']
      update: typeof routes['admin.reconciliation.update']
    }
    catalogue: {
      index: typeof routes['admin.catalogue.index']
      create: typeof routes['admin.catalogue.create']
      store: typeof routes['admin.catalogue.store']
      edit: typeof routes['admin.catalogue.edit']
      update: typeof routes['admin.catalogue.update']
      destroy: typeof routes['admin.catalogue.destroy']
    }
    user: {
      index: typeof routes['admin.user.index']
      create: typeof routes['admin.user.create']
      store: typeof routes['admin.user.store']
      edit: typeof routes['admin.user.edit']
      update: typeof routes['admin.user.update']
      destroy: typeof routes['admin.user.destroy']
    }
    report: {
      export: typeof routes['admin.report.export']
      index: typeof routes['admin.report.index']
    }
  }
}
