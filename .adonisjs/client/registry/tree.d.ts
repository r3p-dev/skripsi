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
      index: typeof routes['customer.orders.index']
      create: typeof routes['customer.orders.create']
      store: typeof routes['customer.orders.store']
      show: typeof routes['customer.orders.show']
      update: typeof routes['customer.orders.update']
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
  }
}
