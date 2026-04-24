/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  home: typeof routes['home']
  register: {
    create: typeof routes['register.create']
    store: typeof routes['register.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  forgotPassword: {
    create: typeof routes['forgot_password.create']
    store: typeof routes['forgot_password.store']
  }
  resetPassword: {
    create: typeof routes['reset_password.create']
    store: typeof routes['reset_password.store']
  }
  fullPayment: {
    show: typeof routes['full_payment.show']
    store: typeof routes['full_payment.store']
  }
  profile: {
    show: typeof routes['profile.show']
    update: typeof routes['profile.update']
  }
  address: {
    show: typeof routes['address.show']
    create: typeof routes['address.create']
    update: typeof routes['address.update']
  }
  order: {
    index: typeof routes['order.index']
    create: typeof routes['order.create']
    store: typeof routes['order.store']
    show: typeof routes['order.show']
  }
  downPayment: {
    show: typeof routes['down_payment.show']
    store: typeof routes['down_payment.store']
  }
  task: {
    index: typeof routes['task.index']
  }
  dashboard: {
    index: typeof routes['dashboard.index']
  }
}
