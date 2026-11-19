# QA script · Real suspension of a business (staging)

## Purpose

Until now the **Suspended** stage was only a label. Now it locks the business out (Terms of Service 7.3, Fees 5.5):

| Rule | What it means |
|---|---|
| Who is locked out | Everyone at the suspended business: owner, managers, staff, on any device, a shared tablet's PIN unlock and the installed app included |
| What they see | One full page, **This account is suspended**: since when, the reason if Hospio360 chose to show it, `hello@oyeksglobal.com`, **Sign out**. No menu, no other page: any address goes there |
| Owner | Also sees every unpaid invoice, the total, **Pay now** (Paystack), the invoice **PDF**, and paid invoices with their receipts |
| Managers and staff | "Please ask the owner to contact Hospio360". No amounts |
| The services | Every call by the business's people is refused with **403**, code `BUSINESS_SUSPENDED`, except sign-in / refresh / sign-out, `me`, the suspension status, the owner's billing and legal acceptance |
| Candidates | Fees & billing → Invoices → **Suspension candidates**: not suspended, an invoice **30 or more days** past its due date |
| Notice | **Send suspension notice**: email to the owner + bell to owners and managers, "Your account will be suspended on <date> unless … are paid". The date is at least 7 days ahead. Email only |
| Suspend | **Suspend business**: reason type (**Unpaid invoices** / **Another reason**), a note, "Show this note to the business", and for unpaid invoices the tick "7 days' notice was sent on …". A finance admin can only suspend by the Terms (30 days overdue, notice at least 7 days old); a super admin is warned and can go ahead. Another reason: super admin only |
| Lifting | **Unpaid invoices**: by itself within a minute of every overdue invoice being paid in full. **Another reason**: only a super admin's **Reactivate**. Reactivating puts back the stage it had (Live or At risk) |
| While suspended | No new fee days or invoices, no reminders, no scheduled reports, no guest messages. Nothing is deleted |
| Hospio360 | Admins still open the business; **View as owner** still works (read only) |

Contract: `docs/suspension.md` in hospio-backend.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Suspended screen: `/suspended` (you are sent there; you never need to type it)
- Admin: **Fees & billing → Invoices → Suspension candidates**; a business page (the amber or red card under the title)

## Accounts

Password `Hospio123!`. **QA businesses only. Never suspend, or send a notice to, a real customer** (Royal Suites / Simpas,
THEWISEMAN and the like). Staging refuses both for a business that isn't QA ("Staging only suspends QA businesses").

| Who | Email |
|---|---|
| Super admin / Finance admin / Support | `amoria@hospio360.com` / `tobi@hospio360.com` / `kola@hospio360.com` |
| QA Owner B Hotels fcekd · owner | `qa.ownerb.fcekd@hospio-qa.test` |
| … manager / front desk (Abuja) | `qa.mi.mgr.fcekd@hospio-qa.test` / `qa.mi.staff.fcekd@hospio-qa.test` (PIN `864913` on the shared device "QA B Abuja front desk") |
| Another business (must stay unaffected) | `qa.debitrate.rrydw@hospio-qa.test` |

### Making an invoice 30 days overdue (Super admin, staging only)

Emails to `@hospio-qa.test` are recorded as "Not sent: test address" by design: check the delivery record, not an inbox.

- The business needs a daily fee in an old month (ask a developer to seed one, or use a business that has unbilled days).
- `POST /platform/admin/qa/billing/issue` `{ "businessId", "month": "2026-09", "issuedOn": "<45 days ago>" }`: due 7 days later, so
  about 38 days overdue today.
- `GET /platform/admin/qa/suspension/{businessId}/email?kind=NOTICE|SUSPENDED|REACTIVATED`: the email's subject and text.

## 1 · Suspension candidates

1. **Do (any admin):** Fees & billing → Invoices → **Suspension candidates**.
2. **Expect:** the QA business with its overdue invoices, the overdue total, "38 days" (the oldest), Notice "Not sent", and (super /
   finance admin) **Send notice** and **Suspend**. A business whose oldest unpaid invoice is under 30 days overdue is not listed.
   Support sees the list without the two buttons.
3. **Do:** open the business. **Expect:** an amber card under the title: "Suspension candidate · ₦… overdue, oldest 38 days past
   its due date", the invoices, "No notice sent yet…", **Send suspension notice** and **Suspend business**.

## 2 · Send the 7 days' notice

1. **Do (finance or super admin):** **Send suspension notice**. **Expect:** the suspension date is filled with today + 7; an
   earlier date says "That is less than 7 days' notice" and the button stays off.
2. **Do:** **Send notice**. **Expect:** "Notice sent · … may be suspended from <date>"; the card now says "Notice sent <today> by
   <you> to <owner email>: may be suspended from <date>". The business is **not** suspended.
3. **Expect (owner, manager):** a bell notice "Account to be suspended on <date>" (staff don't get it).
4. **Expect:** Changes by Hospio360 has "Suspension notice sent to …". The email (subject "Notice: your Hospio360 account will be
   suspended on … unless … are paid") lists the invoices, the amount, clause 7.3 and a Pay now link.
5. **Do (support):** try the same. **Expect:** no button (and the service refuses).

## 3 · Suspend for unpaid invoices

1. **Do (super admin, same day as the notice):** **Suspend business**. **Expect:** "What happens" (four lines), reason type
   **Unpaid invoices**, the overdue invoices, the tick "7 days' notice was sent on <today>" already on with its date, and an amber
   warning "The notice was sent on …: the 7 days end on … As a super admin you can still suspend; it is recorded." Cancel.
2. **Do (finance admin, same day):** open it. **Expect:** the same warning in red, "Only a super admin can suspend before that",
   and **Suspend business** stays off.
3. **Do (finance admin, 7 or more days after the notice):** no warning. Write a note (8+ characters), switch **Show this note to
   the business** on, **Suspend business**. **Expect:** "<Business> is suspended"; the card turns red: "Suspended since <today> ·
   Unpaid invoices", the note, "by <you>", "the note is shown to the business", "notice sent <date>", and **Reactivate**. The
   stage pill says Suspended and **Change stage** is gone.
4. **Do:** Change stage on another Live business → pick **Suspended**. **Expect:** the same Suspend business step opens (with Back).
5. **Expect:** the owner gets the email "Your Hospio360 account for … is suspended"; owners and managers a bell notice "Account
   suspended"; Changes by Hospio360 has "Suspended (unpaid invoice)…" with the note.

## 4 · What the business sees

1. **Do (owner):** sign in. **Expect:** straight to **This account is suspended**: the business name, "Suspended since <date>",
   "Nothing has been deleted…", **Reason:** your note, **What is owed** with each unpaid invoice (number, month, due date, amount,
   **PDF**, **Pay now**), **Total owed**, "Pay every overdue invoice in full … comes back by itself within a minute",
   **Paid invoices and receipts**, `hello@oyeksglobal.com`, **Sign out**. Hospio360 maroon. No sidebar, no header.
2. **Do:** type other addresses: `/dashboard`, `/dashboard/staff`, `/dashboard/billing`, `/receipt?payment=x`, an address that
   doesn't exist. **Expect:** always the same screen.
3. **Do:** **PDF** on an invoice; open **Paid invoices and receipts** and download an invoice and a receipt. **Expect:** the files download.
4. **Do (manager), then (front desk):** sign in. **Expect:** the same screen with the reason and **"Please ask the owner to
   contact Hospio360."**; no invoices, no amounts, no Pay now.
5. **Do:** **Sign out**. **Expect:** the sign-in page; `/dashboard` asks to sign in.
6. **Do (shared device):** on the tablet's lock screen pick the person and enter the PIN. **Expect:** the same suspended screen,
   with **Lock** instead of Sign out; Lock goes back to the lock screen.
7. **Do (someone already working when it is suspended):** keep a page open. **Expect:** within a minute the page moves to the
   suspended screen (at once if they press anything that saves).
8. **Do (installed app on a phone):** open it. **Expect:** the same screen (pages are never shown from a saved copy).
9. **Do (the other QA business):** sign in. **Expect:** everything works as usual.

## 5 · Hospio360 can still look

1. **Do (admin):** open the suspended business: Overview, Hotels, People, Money. **Expect:** everything loads.
2. **Do (support):** **View as owner** with a reason. **Expect:** the hotel app opens on the dashboard with "Viewing as Hospio360
   support · read only", not on the suspended screen. Nothing can be changed, as always.

## 6 · Paying lifts it (unpaid invoices)

Paystack's test page can't be driven by a script; by hand use test card `4084 0840 8408 4081`, any future date, CVV `408`.

1. **Do (owner, two invoices overdue):** **Pay now** on the older one and pay. **Expect:** back on the suspended screen, "… is
   paid · thank you", that invoice has moved to **Paid invoices and receipts**, the other is still under What is owed, and the
   business is **still suspended**.
2. **Do:** pay the other one. **Expect:** within a minute the owner is in the app again (dashboard, menu back), and so is anyone
   else who had the suspended screen open, without touching anything. No "paused" banner. New sales and bookings work.
3. **Expect (admin):** stage back to **Live**, no card; Changes by Hospio360 "Reactivated automatically… · Hospio360 · automatic";
   the owner's email "… is active again"; a bell notice "Account active again".

## 7 · Another reason: paying does not lift it

1. **Do (super admin):** set a QA business to **At risk** (Change stage), then **Suspend business** → **Another reason**, a note,
   show the note. (A finance admin sees "Only a super admin can suspend for a reason other than unpaid invoices".)
2. **Expect (owner):** the suspended screen; under the invoices (if any) "Paying these invoices does not lift this suspension by
   itself. Please contact Hospio360."; with nothing unpaid "Only Hospio360 can lift this suspension".
3. **Do (owner):** pay an unpaid invoice. **Expect:** it is paid; the business is **still suspended**.
4. **Do (finance admin):** Reactivate. **Expect:** "Only a super admin can reactivate a business suspended for a reason other
   than unpaid invoices"; the button is off.
5. **Do (super admin):** **Reactivate** with a note. **Expect:** "… is active again (At risk)": the stage is **At risk**, the
   stage it had; everyone is back in within a minute.

## 8 · While suspended, nothing goes out

1. **Do (super admin):** `POST /platform/admin/qa/billing/run-day` for the suspended business and today. **Expect:** `notices: 0`.
2. **Expect:** a scheduled report that falls due is not sent (it runs once after reactivation); a guest message for that business
   is recorded "Not sent: the business's Hospio360 account is suspended"; no new fee day is made at 00:05.

## 9 · Regression

1. **Do:** Simpas Ikeja with the `qa.pin.*` accounts: PIN unlock, a sale, a payment in cash. **Expect:** all as before.
2. **Do:** the marketer portal (a marketer login): dashboard, businesses, commissions. **Expect:** as before; a marketer never
   sees the suspended screen.
3. **Do:** sign in to a business that isn't suspended (owner, manager, staff). **Expect:** the dashboard, no delay.
4. **Do:** an unpaid invoice past its grace period on a business that isn't suspended. **Expect:** the usual soft pause (red
   banner, 423 on new sales), not the suspended screen.

## 10 · Layout

1. **Do:** the suspended screen on a phone (390 wide) as the owner. **Expect:** one column; each invoice's amount, PDF and Pay
   now stay inside the card; no sideways scroll.
2. **Do:** the Suspend business step on a tablet. **Expect:** the fields scroll inside the box; the buttons stay in reach.

## Checked when this shipped (19 Nov 2026, staging, QA Owner B Hotels fcekd)

- Candidates: two overdue invoices (₦3,000 at 38 days, ₦1,500 at 11 days) listed as one row, ₦4,500, "38 days".
- Notice: recorded with its date; delivery to the owner "Not sent: test address"; bell for owner and manager; audit line.
- Suspended by the finance admin: owner, manager and front desk refused on 34 endpoints across all 14 services (403,
  `BUSINESS_SUSPENDED`); all land on the suspended screen, also from the PIN lock, deep links and an address that doesn't exist.
- Owner paid the first invoice (Paystack test charge + signed webhook): still suspended. Paid the second: Live again at once,
  everyone back in within a minute, open suspended screens returned to the dashboard by themselves, no pause left.
- Another reason (from At risk): paying did not lift it; finance could not reactivate; the super admin did, back to At risk.
- While suspended: the reminder step sent nothing; a due scheduled report waited and ran after reactivation.
- Regression: Simpas Ikeja `qa.pin.*` logins, three other QA businesses and a marketer were never refused.
- Screenshots: `~/Desktop/Hospio test screenshots/Real suspension (18 Nov 2026)/` (27).
