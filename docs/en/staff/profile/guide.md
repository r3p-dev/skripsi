# Staff Profile — Guide

Where a staff member manages their own account. Three forms, exactly as for
customers.

## Where staff land

After logging in, a staff member is taken to their **profile page**, not to the
work queue. This surprises people who expect to arrive at the task list — the
queue is one navigation step away at `/staff/tasks`.

## Changing the name

Type a new name, submit. Letters, spaces and dashes only, up to 50 characters.

## Changing the password

Requires the current password, plus the new one typed twice. If the current
password is wrong, the error points at that field specifically.

New passwords must be 8 to 16 characters with both letters and digits, and no
symbols.

Changing the password here does **not** log the staff member out of their other
devices. Only a full password reset via the forgotten-password flow does that.

## Changing the phone number

Because the phone number is how staff log in, changing it takes two steps.

They enter the new number. The app checks it is not their current number and not
already taken, then sends a WhatsApp verification link **to the new number**.
Opening that link completes the change. The link expires after 15 minutes.

The same caution applies as for customers: the message goes to the number they
typed. A typo means the link reaches a stranger, and nothing reports the
failure. If the link never arrives, check the number and request again.

## What staff cannot do here

**Staff cannot change their own role or deactivate themselves.** Those are admin
actions, done from the admin user management screens. A staff member has no way
to promote themselves.

They also cannot see or edit other people's profiles. This page is strictly
their own account.

## Worth knowing

This page is the _same code_ as the customer profile page, wired to a different
URL prefix. If profile behaviour changes for staff, it changes for customers and
admins at the same time. That is by design — there is one account model and one
set of rules for editing it.

## Screenshots

Every state below is shown at three widths — desktop (1440px), tablet (834px) and mobile (430px). The hero above is the mobile view, which is how this role's screens are normally used.

**Staff's own account page**

| Desktop                                                                               | Tablet                                                                              | Mobile                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ![Staff's own account page — desktop](../../../assets/staff-profile-show-desktop.png) | ![Staff's own account page — tablet](../../../assets/staff-profile-show-tablet.png) | ![Staff's own account page — mobile](../../../assets/staff-profile-show-mobile.png) |

→ One-minute version: [tldr.md](tldr.md)
→ Implementation detail: [technical.md](technical.md)
