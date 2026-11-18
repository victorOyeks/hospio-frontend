# QA script · Phone code cooldown, ended marketer's final statement, default stores backfill (staging)

## Purpose

| Change | What it means |
|---|---|
| Phone code cooldown | "Check your phone" never sends a new code when it is opened again while the last code still works. It shows until when the code works and **Send again** appears only after a 60-second wait (countdown). The server refuses a new code within 60 s of the last one (nothing is sent) |
| Ended marketer's final statement | Setting a marketer to **Ended** puts every open line and every *Carried over* balance on a **Final statement** that is approved and paid whatever the amount (the ₦5,000 minimum doesn't apply) |
| Default stores backfill | Hotels created before 18 Nov 2026 with no store at all get Main, Kitchen, Bar and Housekeeping stores, once |

## Links

- Hotel app: https://web-staging.hospio360.com (sign-up, Check your phone)
- Admin portal: https://admin-staging.hospio360.com (marketers, statements)
- Contracts in hospio-backend: `docs/plan-marketers.md`, `docs/inventory-stores.md`

## Accounts

Password for every account: `Hospio123!`

| Who | Email |
|---|---|
| Super admin | `amoria@hospio360.com` |
| Finance admin | `tobi@hospio360.com` |
| Your hotel owner / marketer | the ones you create, `@hospio-qa.test` |

Name everything "QA P3 <your initials>". Use `@hospio-qa.test` emails and a `+234800…` phone (staging accepts 123456).

## 1 · Check your phone: one code, a visible expiry, a 60 s wait

1. **Do:** sign up at `/sign-up` as a new owner. **Expect:** *Check your phone* says "We sent a 6-digit code to … It works
   until HH:MM" (10 minutes on), the notice at the top shows **one** code, and "Didn't get it? Send again in 1:00" counts down.
2. **Do:** reload the page (and open `/verify-phone` in a new tab). **Expect:** "We **already** sent a 6-digit code … It works
   until" the same time; **no** new code notice; the countdown carries on from where the server says (never back to 1:00).
3. **Do:** wait for the countdown to end. **Expect:** **Send again** appears. Click it. **Expect:** one new code notice, a
   new "works until" time, the countdown starts again at 1:00.
4. **Do:** reload straight away. **Expect:** no new code; the newest code's expiry; the countdown continues.
5. **Do:** type `123456`. **Expect:** "Phone confirmed" and the wizard.

## 2 · Ended marketer: final statement paid whatever the amount

Needs a marketer with a small balance: follow QA 55 to make a marketer and a *Carried over* statement under ₦5,000
(simulated debit), with bank details checked.

1. **Do:** as super admin, **Marketers** → the marketer → **End agreement** (the confirm lists "Everything not paid yet … goes on a final statement") → confirm. **Expect:** **Marketer statements** has a new statement
   for this month with **Ready** and **Final statement** pills, *Carried in from earlier* = the carried balance, *Payable* under ₦5,000;
   the row reads "Final statement · paid whatever the amount (no minimum)". The marketer gets a "statement ready" email
   saying it is the final statement.
2. **Do:** as finance, **Approve**, then **Record payment** with the exact amount. **Expect:** *Paid*; the carried statement's
   lines show paid too.
3. **Do:** end a marketer with nothing open. **Expect:** no statement is made.

## 3 · Default stores for older hotels (backend run, once)

1. **Do:** before the run, sign in as a manager of a hotel made before 18 Nov with **no** stores → **Inventory**. Note: empty.
2. **Do (whoever deploys):** `POST /inventory/admin/stores/backfill-defaults` as super admin (`docs/inventory-stores.md`).
   **Expect:** `{hotelsChecked, hotelsChanged, storesCreated, failed: []}` with `storesCreated = 4 × hotelsChanged`.
3. **Do:** reload **Inventory** for that hotel. **Expect:** Main, Kitchen, Bar and Housekeeping stores, empty.
4. **Do:** Tunde (`tunde@royalsuites.ng`) → **Inventory**. **Expect:** Simpas Ikeja's own stores unchanged (no extra ones).
5. **Do:** run the call again. **Expect:** `hotelsChanged 0`, `storesCreated 0`.

## What to report

- A second code sent by reopening the page, or Send again shown before the wait ends.
- An ended marketer's balance still *Carried over*, or a final statement that can't be approved or paid.
- A hotel that already had stores getting new ones, or a second run creating anything.
