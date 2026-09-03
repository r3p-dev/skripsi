# Auth — TL;DR

**The phone number is the username.** There are no email addresses anywhere in
this app. Signup, login, and password reset all key off an Indonesian phone
number.

![Public landing page](../../../assets/public-home-desktop.png)

## The five things to know

1. **Phone is the identity.** `users.phone` is unique. Login is phone +
   password, never email.
2. **One account, one role.** A user is a `customer`, `staff`, or `admin`. There
   is no switching, and signup can only ever create a `customer`.
3. **Staff and admin log in on a different page.** `/internal/login` — same
   form, separate entrance. Regular customers use `/login`.
4. **Everything is rate limited.** Login allows 5 attempts per minute per
   IP+phone, then blocks for 5 minutes. Forgot-password allows **1 request per
   15 minutes**.
5. **Passwords are 8–16 characters, letters and digits only.** No symbols — the
   regex rejects them.

## Routes at a glance

| Method   | URL                | Purpose                   |
| -------- | ------------------ | ------------------------- |
| GET/POST | `/signup`          | Create a customer account |
| GET/POST | `/login`           | Customer login            |
| GET      | `/internal/login`  | Staff / admin login page  |
| GET/POST | `/forgot-password` | Request a reset           |
| GET/POST | `/reset-password`  | Set a new password        |
| POST     | `/logout`          | End the session           |

## The gotcha

**Forgot-password is limited to one request every 15 minutes, per IP.** During
testing this looks like the feature is broken — you request a link, mistype
something, try again, and get a validation error instead of a second link. It is
working as designed. Wait it out or clear the `rate_limits` table.

Second gotcha: **the password rule forbids symbols.** `Password123` passes,
`Password123!` fails. This surprises people who use a password manager.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
