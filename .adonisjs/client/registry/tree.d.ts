/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  home: typeof routes['home']
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
    }
  }
  staff: {
    profile: {
      show: typeof routes['staff.profile.show']
    }
    task: {
      index: typeof routes['staff.task.index']
      create: typeof routes['staff.task.create']
    }
    offlineOrder: {
      create: typeof routes['staff.offline_order.create']
    }
  }
  admin: {
    profile: {
      show: typeof routes['admin.profile.show']
    }
    dashboard: {
      index: typeof routes['admin.dashboard.index']
    }
  }
}
