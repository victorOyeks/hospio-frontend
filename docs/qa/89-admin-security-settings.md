# QA script · Admin security settings: 2-step for every admin and session length (staging)

## Purpose

Admin console → **Settings → Security** now does what it says for **Hospio360 staff** (super admin, support, finance admin):

- **Require 2-step sign-in for every admin.** With it on, a staff member who has no 2-step sign-in yet signs in with their
  password and lands on **"Set up 2-step sign-in"**. Nothing else in the console works until they finish (scan the QR code,
  type a code, keep the recovery codes); the server refuses every other page and call too. Then they carry on as normal.
  Turning it on without 2-step yourself asks first ("You'll be asked to set it up on your next sign-in" or **Set up now**).
- **Session length** (4, 12 or 24 hours, default 12). A staff sign-in lasts that long, then they sign in again.
- **"Only allow admin sign-in from office IPs" is gone** from the screen. It was never enforced (there is no IP list and the
  team is remote).

Marketers and every hotel account (owner, manager, staff, PIN on a shared device) are **not affected** by either setting.
Developer notes: hospio-backend `docs/sign-in.md`, "Admin security settings".

## Links and accounts

- Admin console: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com
- Passwords and the staging 2-step backup code: as in `85-single-sign-in.md`. On staging the backup code also confirms a new
  2-step setup; on production only the app's code works.

| Kind | Email | Used for |
|---|---|---|
| Super admin (QA) | a QA super admin account (ask the owner; **only a super admin can save Settings**) | turning the settings on and off |
| Support (Hospio360 staff) | `kola@hospio360.com` | the forced setup |
| Marketer | `ese@hospio360.com` | not affected |
| Owner | `owner.lounge.qhye@hospio-qa.test` | not affected |
| Staff (bar) | `bar.lounge.qhye@hospio-qa.test` | not affected |

Don't use the real-person accounts (amoria, victor, tobi, tunde, segun, godwin, mariam). Turning the setting on affects
**every** staff member on staging who signs in meanwhile, so keep the window short and **turn it off again at the end**.

You need an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) for step 3, or the backup code.
Use a private window per account.

## 1 · The Security tab

1. **Do:** sign in as the QA super admin, open Settings → Security.
   **Expect:** "Require 2-step sign-in for every admin" (with the hint naming super admins, support and finance, not marketers
   or hotel accounts), "Session length" (4 / 12 / 24 hours, hint "Hospio360 staff sign in again after this. Hotel accounts are
   not affected") and "Keep audit logs for". **No** "Only allow admin sign-in from office IPs".
2. **Do:** sign in as support (`kola`) and open Settings → Security.
   **Expect:** the same fields, read-only (support can't save settings).

## 2 · Turning it on

1. **Do:** as a QA super admin **without** 2-step, switch "Require 2-step sign-in for every admin" on.
   **Expect:** a confirm "You don't use 2-step sign-in yet" saying you'll be asked to set it up on your next sign-in (or when
   your session renews, within the hour), with **Set up now** and **Turn on**. **Set up now** opens My profile → Security
   and leaves the switch off. **Cancel** leaves it off.
2. **Do:** switch it on again, **Turn on**, then **Save changes**.
   **Expect:** "Settings saved"; reloading shows it on.
3. **Do:** as a QA super admin who **already has** 2-step, switch it on.
   **Expect:** no confirm, the switch just turns on (then Save changes).

## 3 · A staff member without 2-step is sent to set it up

Make sure `kola` has 2-step **off** first (My profile → Security; turn it off with the password and a code if it's on).

1. **Do:** in a private window sign in at https://admin-staging.hospio360.com/auth as `kola`.
   **Expect:** after the password, **"Set up 2-step sign-in"** ("Hospio360 requires 2-step sign-in for every admin…") with
   **Show the QR code** and **Sign out**. The address is `/setup-two-step`.
2. **Do:** type `/dashboard`, `/dashboard/businesses`, `/dashboard/settings`, `/dashboard/profile` in the address bar.
   **Expect:** every one comes back to "Set up 2-step sign-in".
3. **Do (optional, tester with dev tools):** call any API with this session, e.g. the admin dashboard.
   **Expect:** 403 "Set up 2-step sign-in to continue. Hospio360 requires it for every admin".
4. **Do:** sign in at https://web-staging.hospio360.com/auth as `kola`.
   **Expect:** "This is a Hospio360 staff account. Taking you to the admin console", then the same setup screen there.
5. **Do:** **Show the QR code**, scan it, type the code (or the backup code), **Turn on**.
   **Expect:** "2-step sign-in is on", then the recovery codes (Copy, Download).
6. **Do:** **I've saved them, continue**.
   **Expect:** the admin dashboard opens; every page works.
7. **Do:** sign out and sign in again as `kola`.
   **Expect:** the 2-step code step (as before), then the dashboard. No setup screen.

## 4 · Not affected

With the setting still on:

1. **Do:** sign in as the owner, the bar staff and the marketer (each in a private window).
   **Expect:** exactly as before: owner and bar in the hotel app, the marketer in the marketer console. No setup screen.
2. **Do:** a staff member who **has** 2-step signs in.
   **Expect:** the code step, then the dashboard, as before.

## 5 · First sign-in of a new super admin (when one is invited)

1. **Do:** with the setting on, a newly invited or bootstrap super admin signs in with the temporary password.
   **Expect:** "Choose your password" first, then "Set up 2-step sign-in", then the dashboard.

## 6 · Session length

1. **Do:** as the QA super admin set Session length to **4 hours**, Save.
   **Expect:** "Settings saved". A staff member signed in more than 4 hours ago is sent to sign in within the hour; a fresh
   sign-in lasts 4 hours. (Waiting 4 hours is optional; the backend tests cover 4, 12 and 24.)
2. **Do:** sign in as the owner and leave the hotel app open past 4 hours (optional).
   **Expect:** still signed in (hotel sessions are not affected).
3. **Do:** set it back to **12 hours**, Save.

## 7 · Leave staging as it was

1. **Do:** as the QA super admin switch "Require 2-step sign-in for every admin" **off**, Session length **12 hours**, Save.
   **Expect:** "Settings saved". `kola` keeps 2-step on (turn it off again in My profile only if other scripts expect it off).

## Regression

- My profile → Security: turning 2-step on, new recovery codes and turning it off work as before (same screens).
- Sign out, Sign out everywhere, the hand-over between the two addresses (QA 85) work as before.
