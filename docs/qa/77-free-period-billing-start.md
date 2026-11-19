# QA script · Free until charges start, and WhatsApp / Email switches (staging)

## Purpose

A business pays Hospio360's platform fee (1.5% of daily sales, or its addendum rate) only from its **charges start date**.
Guest messages can be switched on and off **per channel** for each location.

| Rule | What it means |
|---|---|
| No date | **Free.** Each day is still worked out (sales shown), but it is **Free** with ₦0 platform fee; nothing is invoiced for it, no reminders, no pause, no suspension candidate for platform fees; a referral partner earns nothing |
| Date set (past or future) | Days **on or after** the date accrue as before (status *For this month's invoice*); days **before** it are **Free**. The first invoice is on the 1st after the first billed month (a part month from the start date) |
| Moving the date | Only days **not on an invoice yet** are recomputed. Issued invoices never change. Moving it **earlier** makes free days billable, so the admin must tick an explicit confirm |
| Clearing the date | Free again from the next day not on an invoice; issued invoices untouched |
| Devices | **Not free.** Device instalments, data plan and the device share of sales are invoiced as usual, so a free business may get an invoice with only **Devices & internet** |
| Guest messages in the free period | Messages that are switched on are sent and recorded at **₦0**, tagged **Free period**. After the start date they are priced as usual |
| Who sets it | Super admin and Finance admin only (onboarding step 3 and the business **Money** tab), with a reason. Support sees it read-only. Every change is in **Changes by Hospio360** (area "Billing start") |
| Reminder | 7 days before a business's charges start date, money admins get a bell notice and an email |
| Existing businesses | Kept their billing: charges start date = the old "Agreement starts on" date, else their first worked-out day (go-live). New businesses start with **no date (free)** |
| WhatsApp / Email switches | Replace the single "Guest messages" switch. Off = never sent, never charged, delivery recorded *Skipped* "WhatsApp (or Email) is switched off for this hotel". Hospio360's hold (suspension) is unchanged |

Contract: hospio-backend `docs/plan-monthly-invoices.md` ("Free until charges start") and `docs/guest-message-billing.md`.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Owner / manager: **Billing & invoices** (`/dashboard/billing`), **Hospio fees** (`/dashboard/hospio-fees`), **Hotel setup → Guest messages**.
- Admin: **Businesses** list; a business → **Money** tab (Charges start on card) and **Hotels** (Guest messages panel);
  **Onboarding** → step 3 **Fee & contract**; **Fees & billing → Invoices** and **Daily fees**; **Changes by Hospio360**.

## Accounts

Password: `Hospio123!`. Super admin `amoria@hospio360.com`, Finance admin `tobi@hospio360.com`, Support `kola@hospio360.com`.
Use **QA businesses only** (owner `@hospio-qa.test`), e.g. `qa.ownerb.fcekd@hospio-qa.test`. Never change a real customer's date.

### Staging QA endpoints (Super admin, staging only)

- `POST /platform/admin/qa/billing/issue` `{ "businessId", "month", "issuedOn" }`: issue a month as if on that day.
- `POST /platform/admin/qa/billing/charges-start-reminders?today=YYYY-MM-DD`: run the 7-day reminder as if today were that day.

## 1 · A new business is free

1. **Do (Super admin):** start onboarding a new QA business; at step 3 **Fee & contract** leave **Charges start on** empty.
   **Expect:** hint "Leave empty = free: no platform fee until a date is set. Devices are still billed." and a green **Free** tag.
2. **Do:** finish onboarding, go live, and take cash sales on two or three days (or use an existing QA business with no date).
3. **Expect (owner, Hospio fees):** each day shows its sales, Fee **₦0**, status **Free**, "free · would have been ₦…"; a green note
   "Every day here is free … Devices are still billed"; the Hospio fees card shows ₦0 "Free · no charges yet".
4. **Expect (owner, Billing & invoices):** a green banner at the top **"Free: no charges until Hospio360 tells you"**.
5. **Do (admin):** issue the month for this business (QA endpoint). **Expect:** no invoice ("Nothing to invoice …") when it has no devices.
6. **Expect (admin, Businesses list and Fees & billing):** the business has a green **Free** tag; the business filter says "… · Free".

## 2 · Devices only invoice while free

1. **Do:** give the free QA business a device package (owner accepts the terms, admin marks it installed), then issue the month.
2. **Expect:** an invoice with only **Devices & internet** (no Platform fee line); due date, reminders and pause work as for any
   invoice (run the QA day steps to check the banner and the 423 pause, then record a payment to lift it).

## 3 · Set a start date in the middle of a month

1. **Do (Finance admin):** business → **Money** → **Charges start on** → **Set date**: a date in the middle of the worked-out days,
   reason "Order form signed: charges from <date>". **Expect:** the preview says how many free days become billable and their
   fee, and a confirm toggle "Yes, bill N free days (₦…) on the next invoice"; **Save** stays disabled until it is ticked.
2. **Do:** tick it and save. **Expect:** the card shows the date, the tag **Billing from <date>**, "Set by … · reason"; History lists the change.
3. **Expect (owner, Hospio fees):** days from the date show the fee and *For this month's invoice*; days before stay **Free**.
4. **Do:** issue the month. **Expect:** the Platform fee line covers only the days from the date (sales × 1.5% = fee for those days).
5. **Expect (Changes by Hospio360):** a "Billing start" entry with the reason and before/after dates.

## 4 · A future date and the 7-day reminder

1. **Do:** set the date to a day in the future (e.g. the 1st of next month). **Expect:** tag **Billing from …** (blue); owner banner
   "Charges start on 1 December 2026 — 1.5% of daily sales, invoiced monthly"; new days stay **Free** until then.
2. **Do:** run `charges-start-reminders?today=` = the date minus 7 days. **Expect:** Super admins and Finance admins get a bell notice
   and an email naming the business and the date; running it again the same day sends nothing new.

## 5 · Move it later, then clear it

1. **Do:** with an issued invoice for an earlier month, move the date later. **Expect:** the preview only counts days not on an
   invoice; the issued invoice keeps its figures (open it: unchanged).
2. **Do:** **Clear** with a reason. **Expect:** the card shows "No date · free", tag **Free**, banner "Free: no charges until …";
   days not on an invoice turn **Free**; the issued invoice is untouched.

## 6 · Permissions

1. **Do (Support `kola@`):** open the business **Money** tab and onboarding step 3. **Expect:** the date and history are shown,
   no Set/Change/Clear buttons, the step-3 field is disabled with "Only a Super admin or Finance admin can change it."
2. **Do (Support, API):** `PUT /platform/admin/businesses/{id}/charges-start`. **Expect:** 403.
3. **Do:** save with a reason under 8 characters. **Expect:** Save stays disabled (API: 400).
4. **Expect (manager):** Billing & invoices shows the same banner, read-only.

## 7 · WhatsApp and Email switches

1. **Do (manager, Hotel setup → Guest messages):** the page shows **WhatsApp · On/Off** and **Email · On/Off** switches instead
   of one. Turn **WhatsApp off** (confirm). **Expect:** toast "WhatsApp is off for guest messages"; Email unchanged.
2. **Do (front desk):** take a payment with a WhatsApp receipt (use a fake number). **Expect:** the receipt step warns
   "WhatsApp receipts won't go: WhatsApp is switched off for this hotel …" and after paying "Receipt not sent: WhatsApp is switched
   off for this hotel. Turn it on in Hotel setup → Guest messages." (staff: "Ask your manager to turn it on."). Nothing is charged.
3. **Do:** confirm a booking for a guest with a `.test` email. **Expect:** the email is recorded (skipped as a test address, not
   because of the switch); turn **Email off** and repeat: recorded skipped "Email is switched off for this hotel".
4. **Do (admin, business → Hotels → Guest messages panel):** each location shows two switches (WhatsApp, Email); "Sending" says
   "WhatsApp only" / "Email only" when one is off; both off = "Not subscribed". Put on hold / Lift hold work as before.
5. **Expect (free period):** while the business is free, the Guest messages page shows "Free period: messages are sent at ₦0 until
   your charges start …" and each sent message in "See each message" is ₦0 with a **Free period** tag.

## 8 · Existing businesses unchanged

1. **Expect:** QA Owner B Hotels fcekd and QA Debit Rate rrydw show **Billing from <their first day>**; their days keep their
   status and fees; their invoices are unchanged.

## 9 · Tablet widths

At 768 px and 1024 px: the owner banner, the Money tab card and its modal, the Businesses list tags and the two guest-message
switches fit without sideways scrolling.
