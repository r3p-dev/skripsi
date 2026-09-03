# Profile — TL;DR

The customer's own account details: **name, phone number, password**. Three
separate forms on one page, each with its own rules.

![Profile page — name, phone and password rows](../../../assets/customer-profile-show-desktop.png)

## The five things to know

1. **Name and password change instantly.** Submit the form, it is saved.
2. **The phone number does not.** Changing a phone requires clicking a
   verification link sent over WhatsApp to the _new_ number.
3. **That link is a signed URL and expires in 15 minutes.** It proves the person
   controls the new number before the account moves to it.
4. **Changing the password requires the current one.** A wrong current password
   fails on the `currentPassword` field, not generically.
5. **All three roles share one service.** `ProfileService` handles customer,
   staff, and admin identically — only the redirect route differs.

## Routes at a glance

| Method | URL             | Purpose                        |
| ------ | --------------- | ------------------------------ |
| GET    | `/profile`      | Show the profile page          |
| PUT    | `/profile`      | Change the name                |
| PUT    | `/password`     | Change the password            |
| POST   | `/phone`        | Request a phone change         |
| GET    | `/phone/verify` | Confirm it via the signed link |

## The gotcha

**The verification link goes to the new number, not the current one.** If the
customer typos the number, the link is sent to a stranger and they simply never
get it. Nothing tells them it went astray — the request just appears to succeed.
They have to request again with the correct number.

Also: the new number is **not** reserved when the request is made. Uniqueness is
re-checked when the link is opened, so two people racing for the same number
means the second one fails at verification time.

→ Plain-language walkthrough: [guide.md](guide.md)
→ Implementation detail: [technical.md](technical.md)
