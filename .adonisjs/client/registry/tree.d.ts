/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  home: typeof routes['home']
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
  transaction: {
    update: typeof routes['transaction.update']
  }
  signup: {
    create: typeof routes['signup.create']
    store: typeof routes['signup.store']
  }
  session: {
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
      show: typeof routes['customer.address.show']
      create: typeof routes['customer.address.create']
      store: typeof routes['customer.address.store']
    }
    order: {
      create: typeof routes['customer.order.create']
      store: typeof routes['customer.order.store']
      index: typeof routes['customer.order.index']
      show: typeof routes['customer.order.show']
      receipt: typeof routes['customer.order.receipt']
    }
    transaction: {
      store: typeof routes['customer.transaction.store']
      show: typeof routes['customer.transaction.show']
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
    order: {
      create: typeof routes['staff.order.create']
      store: typeof routes['staff.order.store']
    }
    transaction: {
      store: typeof routes['staff.transaction.store']
      show: typeof routes['staff.transaction.show']
    }
  }
  admin: {
    profile: {
      show: typeof routes['admin.profile.show']
      edit: typeof routes['admin.profile.edit']
      update: typeof routes['admin.profile.update']
    }
    dashboard: {
      index: typeof routes['admin.dashboard.index']
    }
  }
}
