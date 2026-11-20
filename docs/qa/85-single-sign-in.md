# QA script · Single sign-in: one front door for every account (staging)

## Purpose

Anyone can now sign in at either address and ends up in the right app, already signed in (no second sign-in):

- **Hotel owner, manager, staff** → the hotel app (web-staging.hospio360.com).
- **Hospio360 staff** (super admin, support, finance admin) → the admin console (admin-staging.hospio360.com).
- **Marketer** → the marketer console (the same admin address, Marketer area).

Signing in at the "wrong" address shows a line such as **"This is a hotel account. Taking you to your hotel app"** and opens
the right app about a second later. The move uses a one-time pass that works once, for 30 seconds, for that person and that
app only. Signing out of either app signs you out of both.

Two bugs are fixed:

- **"Too many requests" on admin-staging** and **the hotel app "crashing" for a platform admin**: both were the browser
  bouncing between the two addresses until Chrome gave up with "This page isn't working · redirected you too many times". It
  happened after one browser had signed in with the wrong kind of account on both addresses (for example support on
  web-staging, then a hotel owner on admin-staging). A wrong sign-in no longer leaves anything behind, and the apps never
  send each other back and forth.
- Every sign-in from both apps counted against one shared limit of 30 a minute; each browser now has its own.

Nothing else changed: first-time password change, terms, onboarding for new owners, lock screen and PIN, 2-step and the
backup code, support restrictions and the marketer invite all work as before. Developer notes: hospio-backend `docs/sign-in.md`.

## Links and accounts

- Hotel app: https://web-staging.hospio360.com · Admin console: https://admin-staging.hospio360.com
- Password for every account: `Hospio123!` · 2-step backup code on staging: `159753`

| Kind | Email | Belongs on |
|---|---|---|
| Support (Hospio360 staff) | `kola@hospio360.com` | admin console |
| Marketer | `ese@hospio360.com` | marketer console |
| Owner | `owner.lounge.qhye@hospio-qa.test` | hotel app |
| Manager | `manager.lounge.qhye@hospio-qa.test` | hotel app |
| Staff (bar) | `bar.lounge.qhye@hospio-qa.test` | hotel app |

A super admin behaves exactly like support here (same kind of account). Use a QA super admin if you have one; don't use the
shared real-person accounts (amoria, tobi, tunde, godwin, victor, segun, mariam).

Use a **private window for every step** (or clear the site data of both addresses between steps), so one account's session
doesn't carry into the next.

## 1 · Every account through both addresses

For each account in the table, do both rows below in a fresh private window.

1. **Do:** open https://web-staging.hospio360.com/auth and sign in.
   **Expect:** a hotel account lands on its dashboard (owner, manager) or its screen (bar), as before. Support and marketer
   see "Signed in · This is a Hospio360 staff account. Taking you to the admin console" (marketer: "This is a marketer
   account. Taking you to the marketer console") with a spinner, then the admin console's dashboard (support) or the
   marketer portal (marketer) opens, **signed in**. The address bar shows `admin-staging.hospio360.com/dashboard`, never a
   `code=`.
2. **Do:** open https://admin-staging.hospio360.com/auth and sign in.
   **Expect:** support and marketer stay and land as before. Owner, manager and bar see "Signed in · This is a hotel account.
   Taking you to your hotel app", then the hotel app opens signed in at their dashboard (a new owner still in setup goes to
   the setup wizard; a handed-over owner to the handover review).
3. **Expect, every time:** no "too many requests", no "redirected you too many times", no error page, and the back button
   does not return you to a half-finished sign-in.

## 2 · 2-step sign-in

1. **Do:** with an account that has 2-step on (your own QA account from script 12), sign in at the address it does **not**
   belong on. **Expect:** the 2-step step appears; enter `159753`; the hand-over line shows and the right app opens signed in.
2. **Do:** the same at the address it belongs on. **Expect:** as before.

## 3 · Bookmarked pages (deep links)

1. **Do:** open https://web-staging.hospio360.com/auth?next=/dashboard/support and sign in as support.
   **Expect:** handed over to the admin console and opened at **Support**.
2. **Do:** open https://admin-staging.hospio360.com/dashboard/businesses while signed out. **Expect:** sign-in; sign in as
   support. **Expect:** Businesses opens.
3. **Do:** open https://web-staging.hospio360.com/auth?next=https://example.com and sign in as support.
   **Expect:** the admin dashboard; nothing ever opens example.com (or any other site). The same for `next=//example.com`.

## 4 · Sign out from either app signs you out of both

1. **Do:** in window A sign in as the owner at web-staging; in window B (another private window or browser) sign in as the
   owner at admin-staging (handed to the hotel app). Sign out in A. Refresh B.
   **Expect:** B shows the sign-in page.
2. **Do:** the same with support: A at admin-staging, B at web-staging (handed to admin). Sign out in B, refresh A.
   **Expect:** A shows the sign-in page.
3. **Expect:** after signing out, opening either address shows sign-in (not a dashboard).

## 5 · The one-time pass can't be reused

These need the browser's developer tools (Network tab, "Preserve log").

1. **Do:** sign in as support at web-staging with the Network tab open. Find the request to
   `admin-staging.hospio360.com/auth/handoff?code=…` and copy its full address. Open it again in a new private window.
   **Expect:** the admin sign-in page with "That sign-in link has expired or was already used. Sign in again."
2. **Do:** copy such an address but don't let it load (sign in, then close the tab as the line appears, or block the request),
   wait one minute, open it. **Expect:** the same sentence; not signed in.
3. **Do:** take a code meant for admin-staging and open it on web-staging (`https://web-staging.hospio360.com/auth/handoff?code=…`).
   **Expect:** the hotel sign-in with the same sentence; then the same code on admin-staging is refused too.
4. **Expect:** the `/auth/handoff` response has `Referrer-Policy: no-referrer`; the page that opens has no `code=` in its address.

## 6 · The two old bugs

1. **Do:** in one private window: sign in as support at web-staging (it now takes you to the admin console), then open
   admin-staging/auth in the same window, sign out if needed, and sign in as the owner. **Expect:** the hotel app opens
   signed in as the owner. No "redirected you too many times".
2. **Do:** in a new private window: sign in as the owner at admin-staging, then as support at web-staging. **Expect:** the
   admin console opens signed in as support. No error page, no "too many requests".
3. **Do:** sign in 10 times in a row in a minute (different accounts, both addresses). **Expect:** no "Too many attempts from
   this network" (the limit is per browser address, 30 a minute).

## 7 · Nothing else changed (spot checks)

1. A new staff login with a temporary password, signed in at admin-staging: handed to the hotel app, then **Choose a new
   password** (enter the temporary one again), then terms, then the PIN prompt on a shared desk.
2. Lock screen and PIN on a shared device: unchanged (the device stays in the hotel app).
3. Support in the admin console: still no Integrations item; "View as owner" still opens the hotel app read-only.
4. A marketer invite link opens admin-staging /accept-invite and lands on the marketer portal (script 60).
5. Install the hotel app as a PWA and sign in there: unchanged.
