# Admin Profile — TL;DR

The admin's own account details. **Same code as the customer and staff profile**
— one shared service, three URL prefixes.

![Admin's own account page](../../../assets/admin-profile-show-desktop.png)

## The five things to know

1. **Same three forms**: name, password, phone.
2. **`/admin` prefix.** Routes are `admin.profile.show`, `admin.password.update`,
   `admin.phone.store`, `admin.phone.update`.
3. **Phone changes still need WhatsApp verification** — signed link, 15 minutes,
   sent to the new number.
4. **This is the post-login landing page** for admins (`admin.profile.show`), not
   the dashboard.
5. **To change their own role, an admin uses [users](../users/)** — but they
   cannot delete themselves.

## Routes at a glance

| Method | URL                   | Purpose                 |
| ------ | --------------------- | ----------------------- |
| GET    | `/admin/profile`      | Show the profile        |
| PUT    | `/admin/profile`      | Change the name         |
| PUT    | `/admin/password`     | Change the password     |
| POST   | `/admin/phone`        | Request a phone change  |
| GET    | `/admin/phone/verify` | Confirm via signed link |

## The gotcha

**An admin editing their own account through [users](../users/) is a different
path with different rules** — that one can change role and `is_active`, this one
cannot. The user-edit screen passes `isSelf` so the UI can warn them.

Notably, `updateFromAdmin` defaults `isActive` to `false` when the field is
absent, so an admin can deactivate themselves through the user screen. Deleting
themselves is blocked; deactivating is not.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
