# QA script · One monthly invoice (staging)

## Purpose

Hospio360 no longer debits anything. Each business gets **one invoice a month** and pays it itself:

| Rule | What it means |
|---|---|
| Invoice | One per business per month, number `HIN-YYYYMM-NNNN`, issued on the **1st at 07:00** (Lagos) for the month before |
| Sections | **Platform fee** (per location: sales × rate = fee, with a day-by-day breakdown), **Guest messages** (each location's `MSG-…` invoice), **Devices & internet** (instalments / data plan due that month and the "from sales" device share), **Carried in** (an earlier month under ₦1,000, or a credit), **Credits & adjustments** |
| Minimum | Total under **₦1,000** → *Carried forward*: nothing to pay, it rolls into next month |
| VAT | Not charged unless Settings → Fee defaults → Invoice VAT is above 0 |
| Due | 7 days after issue (the **8th**); grace 3 days (last day the **11th**) |
| Reminders | 6th, 7th, 8th (due today), 9th and 10th (overdue), **11th final warning**: email to the owner, bell to owner and managers |
| Paused (RESTRICTED) | From **06:00 on the 12th** if unpaid: card/transfer POS payments, new bar/kitchen sales and tabs (new orders and adding lines), new bookings and walk-ins are refused (HTTP 423, readable message). Still allowed: sign-in, viewing, check-out, **cash** on existing folios/tabs, reports and exports, paying the invoice |
| Lifted | Within a minute of paying (Paystack), or when an admin records a full payment, grants an extension or voids |
| Who pays | Only the **owner**, the full amount, with **Pay now** (Paystack). Managers see their locations' lines, read-only. Admins (Super admin, Finance admin) record offline payments (part payments allowed), extend **once**, add a credit note / adjustment, void (optionally reissue) |

Contract: `docs/plan-monthly-invoices.md` in hospio-backend.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Owner / manager: sidebar **Billing & invoices** (`/dashboard/billing`); one invoice: `/dashboard/billing?invoice=<id>`.
  Emails link to `/hotel-owner/billing?invoice=<id>`, which opens the same page.
- Admin: **Fees & billing → Invoices** (first tab); a business → **Money** tab.

## Accounts

Password: `Hospio123!`. Super admin `amoria@hospio360.com`. Use a **QA business you created** (`@hospio-qa.test` owner) for
anything that issues, pays, pauses or voids: staging only sends invoice emails for QA businesses (the log says
"not sent (staging: QA businesses only)" for the others). Never pay or pause a real customer's invoice.

### Staging QA endpoints (Super admin, staging only; Swagger or curl through the gateway)

- `POST /platform/admin/qa/billing/issue` `{ "businessId", "month": "2026-10", "issuedOn": "2026-11-01" }`: issue one month as if on that day.
- `POST /platform/admin/qa/billing/run-day` `{ "businessId", "date": "2026-11-09" }`: run that day's reminders / restriction for the business.
- `GET /platform/admin/qa/billing/invoices/{id}/notice?kind=REMINDER|DUE_TODAY|OVERDUE|FINAL_WARNING|RESTRICTED`: preview a notice's text.

## 1 · Issue an invoice

1. **Do:** make sure the QA business has daily fees last month (Hospio fees shows days), a guest-message plan with some
   messages and, if possible, a device package. Issue last month with the QA endpoint (`issuedOn` = the 1st of this month).
2. **Expect (admin):** Fees & billing → **Invoices**: a row `HIN-YYYYMM-NNNN`, the business, the month, Platform / Messages / Devices
   figures, Total, Outstanding, status **Due**, due date the 8th. Counts chips and the four totals (Invoiced, Paid, Outstanding,
   Platform fee) include it.
3. **Do:** open the row. **Expect:** the panel shows **Platform fee** with one line per location ("Sales ₦… × 1.5% = ₦…"),
   **Guest messages** (`MSG-…` per location), **Devices & internet**, the section totals, Total, "No VAT is charged on this
   invoice", and **Reminders & actions** with "Issued · emailed".
4. **Do:** **Day by day** on a location. **Expect:** one row per day (sales, fee, devices if any) whose fee column adds up to that
   location's platform-fee line.
5. **Do:** **Download PDF**. **Expect:** a PDF on Oyeks Global letterhead with the same sections and figures.
6. **Do (owner):** check the inbox. **Expect:** the invoice email with a link that opens Billing & invoices on this invoice.
7. **Do (admin):** **Export CSV** on the Invoices tab. **Expect:** one row per invoice shown, same figures.

## 2 · Carried forward

1. **Do:** issue a month for a QA business whose total is under ₦1,000 (a business with a day or two of tiny sales).
2. **Expect:** status **Carried forward**; the owner's invoice says "Nothing to pay this month: the total is under ₦1,000, so it
   rolls into the next month's invoice"; no Pay now; no banner.
3. **Do:** issue the next month. **Expect:** a **Carried in** line for the earlier month; the earlier invoice names the new one.

## 3 · Banner states and reminders

Use `run-day` on the QA business for each date, then reload the hotel app as owner, a manager and a staff member (front desk or bar).

| Date run | Owner | Manager | Staff |
|---|---|---|---|
| 2nd–5th (DUE) | Quiet white notice "Your <Month> invoice is ready" with **View invoice** | nothing | nothing |
| 6th, 7th (DUE_SOON) | Amber "Invoice HIN-… is due on …" with **Pay now** and **View invoice** | Amber, **View invoice**, "Ask the owner to pay" | nothing |
| 8th (DUE_TODAY) | Amber "… is due today" | Amber | nothing |
| 9th, 10th (OVERDUE) | Amber "… is overdue", says what pauses from the 12th 06:00 | Amber | nothing |
| 11th (FINAL_WARNING) | Stronger amber "FINAL NOTICE: pay invoice … today" | Same | nothing |
| 12th (RESTRICTED) | **Red** "Card/transfer POS payments, new sales and new bookings are paused", **Pay now** | Red, "Ask the owner to pay" | **Red**, message only (no amounts) |

1. **Expect:** the banner is on every page (dashboard, bookings, bar, settings…), not just Billing.
2. **Expect (admin):** the invoice's **Reminders & actions** lists one entry per notice (Reminder, Due today, Overdue notice,
   Final warning, Restricted) with "emailed" and the owner's email. Running the same day twice doesn't add a second entry.
3. **Do:** the notice preview endpoint for each kind. **Expect:** plain-English text with the number, amount and dates.
4. **Do:** bell (owner and manager). **Expect:** each notice; **Open →** goes to Billing & invoices on this invoice.

## 4 · Restriction (paused)

With the QA business RESTRICTED:

1. **Do (front desk):** take a card/transfer payment on a folio (Send to POS). **Expect:** refused with the server's sentence
   ("… the Hospio360 invoice HIN-… is unpaid. They resume within a minute of the owner paying it …"), not "Something went wrong".
2. **Do (bar):** start a new sale / open a new tab, and add an item to an existing tab. **Expect:** both refused with that sentence.
3. **Do (front desk):** new booking and a walk-in. **Expect:** refused with that sentence.
4. **Do:** take **cash** on an existing folio and on an existing tab; **check out** a guest; open Reports and export a CSV.
   **Expect:** all work.
5. **Do (admin):** Hotels list. **Expect:** the hotel counts under "POS paused" (unpaid Hospio360 invoice).

## 5 · Pay now (Paystack test mode)

1. **Do (owner):** on the red or amber banner tap **Pay now**. **Expect:** Billing & invoices opens the invoice and goes straight to
   Paystack's checkout for the **full outstanding amount**.
2. **Do:** pay with Paystack's test card (`4084 0840 8408 4081`, any future date, CVV `408`, PIN `0000`, OTP `123456`).
3. **Expect:** back on `/dashboard/billing?invoice=…`, a toast "HIN-… is paid · thank you", the invoice **Paid**, a payment under
   **Payments & receipts** with a receipt number. Reloading the return address doesn't fail (already paid reads as paid).
4. **Do:** **Receipt PDF**. **Expect:** the receipt with the amount, Paystack and the reference.
5. **Expect:** within a minute the red banner is gone for everyone; card payments, new sales and bookings work again.
6. **Expect (admin):** the log has Payment, Paid, Receipt sent, Restriction lifted; the row is **Paid**.
7. **Do:** open Pay now in the panel directly (not from the banner). **Expect:** the same flow.

## 6 · Admin actions (Finance admin or Super admin)

1. **Offline part payment:** **Record payment**, ₦5,000 by Bank transfer, reference `QA-TRF-1`, today. **Expect:** "Payment recorded ·
   ₦… still to pay"; the invoice stays open; a receipt is listed. Then record the rest. **Expect:** Paid; any pause lifts within a minute.
2. **Extension:** on an open invoice tap **Extend**, a date after the current last day, reason "QA extension". **Expect:** "Extended to …";
   the owner's invoice shows the note; if it was paused, the pause lifts. **Extend** now shows "Extended once" and is disabled.
3. **Credit note:** **Credit note / adjustment** → Credit note ₦1,000, reason "QA goodwill". **Expect:** a **Credits & adjustments**
   line −₦1,000 with the reason and who added it; total and outstanding drop. An **Adjustment** of ₦500 adds a positive line.
4. **Void and reissue:** **Void**, reason "QA wrong figures", Reissue ticked. **Expect:** "Voided · reissued as HIN-…"; the old one
   **Void** with the reason, the new one **Due** and says it replaces the old one; any pause lifts. Void without reissue: nothing
   owed, no new invoice.
5. **Issue a month (Super admin):** **Issue a month**, last month, the QA business. **Expect:** a sentence with what was issued or
   skipped (a business that already has that month is skipped). A month that hasn't ended can't be picked.
6. **Support:** sign in as Support. **Expect:** Invoices are visible; no Record payment, Extend, Credit note or Void.
7. **Business page:** the QA business → **Money**. **Expect:** "Hospio360 monthly invoices" with the state chip (Paid up / Invoice
   due / Overdue / Paused for an unpaid invoice), the outstanding amount and this business's invoices (same panel and actions).

## 7 · Managers and staff

1. **Do (manager):** Billing & invoices. **Expect:** "read-only · the owner pays it"; the invoice shows only their locations' lines;
   no Pay now; footer "Only the owner can pay this invoice."; Download PDF and Day by day work.
2. **Do (staff):** no Billing & invoices in the menu; only the red banner when paused.

## 8 · Terms boxes

1. **Do:** `/sign-up`. **Expect:** box 2 reads "I agree to pay Hospio360's monthly invoice — 1.5% of my business's daily sales —
   within 7 days of issue. How the fee works" (link to the Fees and monthly invoice page).
2. **Do:** an existing QA owner signs in after the new terms (TOS-2026-11B, FEES-2026-11B). **Expect:** the "We've updated our terms"
   modal with the same box 2 wording at that business's rate. Accept. **Expect (admin):** Acceptance tab "Monthly invoice
   agreement (1.5%)"; older FEES-2026-11 records still read "Daily debit authority".

## 9 · Regression

- **Hospio fees** (owner and manager): "This month so far" by default, a note "Billed monthly … added to your <Month> invoice, issued
  on the 1st" with a **Billing & invoices** link, statuses *For this month's invoice* / *On invoice, unpaid* / *Paid* / *No fee*;
  no Debited column, provider or debit reference anywhere.
- **Devices** (Hospio fees → Device invoices): no Pay button; open ones say "On invoice HIN-…" (link) or "Billed on your <Month>
  invoice"; old paid ones still listed.
- **Guest messages** (Hotel setup → Guest messages): no Pay; an open MSG- invoice says "On Hospio360 invoice HIN-…" or "Billed on
  your monthly invoice".
- **Admin Fees & billing:** Daily fees has no Run debit or debit columns; Work out a day and refunds still work; Fee rules,
  Statements, Guest messages and Devices tabs load. Hotels → POS & Hospio fees has no debit switch.
- **Settings → Fee defaults:** Invoice VAT (%) shows 0 and Invoice minimum (₦) 1000; saving works.
- No page in either app says "debit" about Hospio360's fees (a guest's "bank shows two debits" dispute text is fine).
