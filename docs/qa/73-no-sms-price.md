# QA script · No SMS price for guest messages (staging)

## Purpose

Guest messages (booking messages, receipts, folios, messages to guests, statements, reminders, purchase orders) go by
**email and WhatsApp only**. SMS is only for sign-in and phone verification codes, and those are free. So the **SMS price
is gone** (19 Nov 2026), from:

- the admin portal: Fees & billing → **Guest messages · default prices**, and each hotel's **Guest messages** card and its
  **Prices** editor (business → hotel, onboarding);
- the hotel app: Hotel setup → **Guest messages** (prices and this month's usage);
- the API: prices are `{email, whatsapp}`; this month's usage has no SMS count or amount.

**Older invoices are history and are not changed.** An invoice issued before this change that charged SMS still shows its
SMS line, labelled **"SMS (older messages)"**. Staging has one: `MSG-202611-0090` (QA B Ikoyi, 6 SMS, ₦60, paid on
`HIN-202611-0004`).

Contract: hospio-backend `docs/guest-message-billing.md`.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com

## Accounts

| Who | Email | Password |
|---|---|---|
| Hospio360 admin | amoria@hospio360.com | `Hospio123!` |
| Owner with invoices (QA debit-rate business) | qa.debitrate.rrydw@hospio-qa.test | `Hospio123!` |
| A Royal Suites (Simpas Ikeja) manager or owner QA account from script 15/16 | as listed there | `Hospio123!` |

Do not switch guest messages off at Simpas Ikeja (they are on) and do not change any price except as below (set it back).
Nothing in this script sends an email, SMS or WhatsApp.

## 1 · Admin portal: default prices

1. **Do:** sign in as the admin → **Fees & billing** → scroll to **Guest messages · default prices**. **Expect:** two prices,
   email and WhatsApp (₦5 · ₦25). No SMS anywhere on the card.
2. **Do:** **Change prices**. **Expect:** two boxes, Email and WhatsApp. Leave one empty and save: "Enter both prices".
3. **Do:** set email to **6**, save; then set it back to **5** and save. **Expect:** "Default prices saved" each time and the
   card follows.

## 2 · Admin portal: a hotel's plan

1. **Do:** **Businesses** → Royal Suites Ltd → **Simpas Ikeja** (and the business's **Money** tab). **Expect:** the Guest
   messages card shows On, the prices as two amounts (email · WhatsApp) and this month's amount. No SMS.
2. **Do:** **Prices**. **Expect:** the subtitle reads "Empty uses the default (₦5 · ₦25)"; two boxes, Email and WhatsApp.
3. **Do:** close it without saving (or, on a QA hotel, set WhatsApp to **20**, save, then **Use default prices**). **Expect:**
   saving works, the card shows "The hotel's own prices" then "Default prices" again. Guest messages stay **On**.

## 3 · Hotel app

1. **Do:** sign in as a Simpas Ikeja manager or owner → Hotel setup → **Guest messages**. **Expect:** prices for Email and
   WhatsApp only; this month's usage counts emails and WhatsApp only. No SMS row, no SMS price.
2. **Do:** sign in as the QA debit-rate owner → Hotel setup → **Guest messages**. **Expect:** the same. Open an invoice from the
   Invoices table: its Summary lists emails, WhatsApp and the total; no SMS line (these invoices charged no SMS).
3. **Do:** as that owner, **Billing & invoices** → open a monthly invoice (or its preview). **Expect:** each "Guest messages ·
   <location> · <month>" line reads "N emails, N WhatsApp (MSG-…)" with no SMS.
4. **Do (history):** as the QA B Ikoyi owner (if you have it), open invoice `MSG-202611-0090`. **Expect:** its Summary still shows
   **"6 SMS (older messages)" ₦60**, and its monthly invoice line still names the SMS. Older invoices are not rewritten.

## 4 · API (developer)

1. `GET /messaging/billing/messages/admin/prices` → `{email, whatsapp}` (no `sms`).
2. `PUT /messaging/billing/messages/admin/prices` with `{"email":5,"sms":10,"whatsapp":25}` → **200**, `sms` ignored; the answer
   has no `sms`.
3. `PUT /messaging/billing/messages/admin/plans/{hotelId}` with an `sms` field → **200**, the plan is unchanged apart from
   what was sent for email and WhatsApp.
4. `GET /messaging/billing/messages` (hotel) → `prices`, `defaults` `{email, whatsapp}`; `thisMonth` has no `smsCount` or
   `smsAmount`.

## Not changed

- Sign-in and phone verification codes still come by SMS (Termii), free (script 25).
- An older invoice's SMS count and amount stay on it and are still shown.
