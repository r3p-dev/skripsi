# Profile — Guide

The profile page is where a customer manages their own account. It holds three
independent forms.

## Changing the name

The simplest of the three. Type a new name, submit, done.

The same naming rule as signup applies: letters, spaces and dashes only, 1 to 50
characters. Numbers and punctuation are rejected.

## Changing the password

This form asks for three things: the **current** password, the new password, and
the new password again.

The current password is genuinely checked. If it is wrong, the error appears
attached to that specific field — so the customer can see it was the old password
that was wrong, not the new one.

The new password follows the same rule as everywhere else in the app: 8 to 16
characters, must contain both letters and digits, no symbols.

Note that unlike a password _reset_ (the forgotten-password flow), changing the
password from the profile page does **not** log the customer out of their other
devices. Only a reset does that.

## Changing the phone number

This is the involved one, because the phone number is the login identity. The
app will not simply take the customer's word for it.

**Step one — request.** The customer types the new number and submits. The app
checks two things immediately:

- The new number is not the same as their current one.
- The new number is not already used by another account.

If either check fails, they get an error on the phone field right away.

**Step two — verify.** If the checks pass, a WhatsApp message is sent **to the
new number** containing a verification link. The account is not changed yet.

**Step three — confirm.** Opening that link completes the change. The link is
signed and tied to the account, and it expires after 15 minutes. If it is
tampered with, expired, or opened while logged in as somebody else, the app
shows an "invalid signature" page instead of applying the change.

### Why this is worth understanding

The message goes to the **new** number, not the current one. That is the whole
point — it proves the customer actually controls the number they are moving to.

But it has a consequence: if they mistype the number, the link is delivered to
whoever owns the number they typed. The customer sees a cheerful "request sent"
message and then nothing ever happens. There is no bounce, no warning. They just
have to notice and request again.

There is a second subtlety. The number is **not reserved** during those 15
minutes. Availability is checked again when the link is opened. So if two people
request the same number at once, both get a link, and whoever clicks first wins.
The other gets an error saying the number is taken.

## What is not here

The saved address is **not** part of the profile — it lives in its own
[address](../address/) domain. Order history is under [orders](../orders/).

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**Profile page — name, phone and password rows**

| Desktop                                                                                                      | Tablet                                                                                                     | Mobile                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ![Profile page — name, phone and password rows — desktop](../../../assets/customer-profile-show-desktop.png) | ![Profile page — name, phone and password rows — tablet](../../../assets/customer-profile-show-tablet.png) | ![Profile page — name, phone and password rows — mobile](../../../assets/customer-profile-show-mobile.png) |

**Wrong current password, flagged on its own field**

| Desktop                                                                                                                    | Tablet                                                                                                                   | Mobile                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| ![Wrong current password, flagged on its own field — desktop](../../../assets/customer-profile-password-error-desktop.png) | ![Wrong current password, flagged on its own field — tablet](../../../assets/customer-profile-password-error-tablet.png) | ![Wrong current password, flagged on its own field — mobile](../../../assets/customer-profile-password-error-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
