# Users — TL;DR

Account and role management. **This is the only place staff and admin accounts
can be created** — signup always produces a customer.

![All accounts with per-role counts](../../../assets/admin-users-index-desktop.png)

## The five things to know

1. **An admin cannot delete their own account** — blocked with a clear message.
2. **An account with any order history cannot be deleted either.** Deleting
   would orphan that history.
3. **`isActive` defaults to `false` when the field is absent** on update. A form
   that omits it deactivates the account.
4. **Passwords are only rewritten when one is typed**, so saving a name does not
   reset someone's login.
5. **Two different validators**: `userValidator` on create, `adminUserValidator`
   on update.

## Routes at a glance

| Method   | URL                                          | Purpose                      |
| -------- | -------------------------------------------- | ---------------------------- |
| GET      | `/admin/users`                               | List, filter by role, search |
| GET/POST | `/admin/users/create` · `/admin/users`       | Create                       |
| GET/PUT  | `/admin/users/:id/edit` · `/admin/users/:id` | Edit                         |
| DELETE   | `/admin/users/:id`                           | Delete (guarded)             |

## The gotcha

**An admin can deactivate themselves, even though they cannot delete
themselves.** `updateFromAdmin` merges `isActive: data.isActive ?? false`, and
self-edit is not blocked server-side — the UI only receives an `isSelf` flag as a
hint.

Second gotcha: **`updateFromAdmin` sets `passwordChangedAt = null`** when a
password is supplied, the opposite of `AuthService.resetPassword` which stamps
it.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
