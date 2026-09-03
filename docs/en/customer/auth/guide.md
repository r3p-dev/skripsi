# Auth — Guide

This walks through what a customer actually experiences when getting into the
app, in plain language. No code.

## Creating an account

A new customer taps **Sign up** and fills in three things: their name, their
phone number, and a password (typed twice).

- **Name** accepts letters, spaces, and dashes — up to 50 characters. Digits and
  punctuation are rejected, so "Budi Santoso" and "Ana-Maria" work, but
  "Budi123" does not.
- **Phone** must be a valid Indonesian mobile number. The app normalises what
  you type, so `0812...`, `+62812...`, and `62812...` all end up stored the same
  way. If someone already registered that number, signup fails and tells them so.
- **Password** must be 8 to 16 characters and must contain **both letters and
  digits**. Symbols are not allowed at all.

There is no email confirmation step and no SMS code at signup. Once the form is
accepted the account exists and the customer is taken straight into the app.

## Logging in

Login asks for the phone number and password, with an optional **Remember me**
tick.

Where you land after logging in depends on your role — customers go to their
profile page, staff to the staff profile, admins to the admin profile. This is
automatic; there is no role picker.

Staff and admin do not use the public login page. They have a separate entrance
at `/internal/login`. It is the same form behind the scenes — the split exists
so the customer-facing page stays simple and the internal one is not advertised.

If you are already logged in, the login and signup pages redirect you away.
You cannot see them while holding a session.

## Forgetting a password

The customer enters their phone number on the **Forgot password** page. If an
account exists for that number, a reset link is sent to them over WhatsApp.

**This is limited to one request every 15 minutes.** If someone taps the button
twice, the second attempt is refused with an error message rather than sending a
second link. This is deliberate — it stops the WhatsApp sending endpoint from
being used to spam people.

Following the link opens a page where they set a new password, typed twice. The
same 8–16 character letters-and-digits rule applies.

Once the password is changed, **every "remember me" session for that account is
revoked.** If the account was compromised, changing the password logs the
attacker out everywhere. The person resetting has to log in again with the new
password.

## Logging out

A single **Log out** action ends the session. It requires being logged in, so a
stale tab that has already been logged out elsewhere will just be bounced to the
login page.

## When things get blocked

The app deliberately slows down repeated attempts:

| Action          | Allowed          | Then blocked for |
| --------------- | ---------------- | ---------------- |
| Signup          | 10 per minute    | 10 minutes       |
| Login           | 5 per minute     | 5 minutes        |
| Forgot password | 1 per 15 minutes | 15 minutes       |
| Reset password  | 5 per 15 minutes | 15 minutes       |

Login counts attempts per IP **and** phone number together, so one person
fumbling their password does not lock out everybody else on the same office
Wi-Fi.

If you hit a limit during testing and do not want to wait, the counters live in
the `rate_limits` database table and can be cleared.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the desktop view, which is how this role's screens are normally used.

**Public landing page**

| Desktop                                                                   | Tablet                                                                  | Mobile                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ![Public landing page — desktop](../../../assets/public-home-desktop.png) | ![Public landing page — tablet](../../../assets/public-home-tablet.png) | ![Public landing page — mobile](../../../assets/public-home-mobile.png) |

**Customer login**

| Desktop                                                                      | Tablet                                                                     | Mobile                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ![Customer login — desktop](../../../assets/customer-auth-login-desktop.png) | ![Customer login — tablet](../../../assets/customer-auth-login-tablet.png) | ![Customer login — mobile](../../../assets/customer-auth-login-mobile.png) |

**Staff & admin login (`/internal/login`)**

| Desktop                                                                                                        | Tablet                                                                                                       | Mobile                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ![Staff & admin login (`/internal/login`) — desktop](../../../assets/customer-auth-internal-login-desktop.png) | ![Staff & admin login (`/internal/login`) — tablet](../../../assets/customer-auth-internal-login-tablet.png) | ![Staff & admin login (`/internal/login`) — mobile](../../../assets/customer-auth-internal-login-mobile.png) |

**Signup form**

| Desktop                                                                    | Tablet                                                                   | Mobile                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ![Signup form — desktop](../../../assets/customer-auth-signup-desktop.png) | ![Signup form — tablet](../../../assets/customer-auth-signup-tablet.png) | ![Signup form — mobile](../../../assets/customer-auth-signup-mobile.png) |

**Signup with a mismatched confirmation**

| Desktop                                                                                                    | Tablet                                                                                                   | Mobile                                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ![Signup with a mismatched confirmation — desktop](../../../assets/customer-auth-signup-error-desktop.png) | ![Signup with a mismatched confirmation — tablet](../../../assets/customer-auth-signup-error-tablet.png) | ![Signup with a mismatched confirmation — mobile](../../../assets/customer-auth-signup-error-mobile.png) |

**Forgot password request**

| Desktop                                                                                         | Tablet                                                                                        | Mobile                                                                                        |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ![Forgot password request — desktop](../../../assets/customer-auth-forgot-password-desktop.png) | ![Forgot password request — tablet](../../../assets/customer-auth-forgot-password-tablet.png) | ![Forgot password request — mobile](../../../assets/customer-auth-forgot-password-mobile.png) |

**Reset password form**

| Desktop                                                                                    | Tablet                                                                                   | Mobile                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ![Reset password form — desktop](../../../assets/customer-auth-reset-password-desktop.png) | ![Reset password form — tablet](../../../assets/customer-auth-reset-password-tablet.png) | ![Reset password form — mobile](../../../assets/customer-auth-reset-password-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
