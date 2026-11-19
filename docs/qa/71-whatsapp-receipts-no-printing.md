# QA script · Receipts on WhatsApp, no printing, no receipt printers (staging)

## Purpose

The owner's decision (19 Nov 2026): **receipts are not printed and not emailed. A guest's receipt goes on WhatsApp, or not at
all.** Hospio360 also **doesn't supply receipt printers** any more.

| Rule | What it means |
|---|---|
| Receipt choice when taking payment | Only **WhatsApp** (to the guest's phone) and **Don't send**. WhatsApp is picked when the guest's phone is known; the number can be changed. "Skip receipt" stays |
| What is gone | Every **Print receipt** / **Print or email receipt** / **Receipts** button in a payment flow, the **Email** receipt choice, the **80 mm roll** paper size, **Email receipt** on the receipt page |
| Sending again | **Send receipt on WhatsApp** (My payments, front office Payments), **WhatsApp receipt** (each payment of a sale or split bill), **Send on WhatsApp** / **Send receipt again** (Manager · Payments) |
| WhatsApp message | The approved template `hospio_payment_receipt_v2` (first name, the business, amount, paid by, reference) |
| Kept | Managers and owners: **Receipt PDF** on a payment and **Folio PDF** on a folio (the receipt page with **Save as PDF**). Owner/admin invoice and receipt **PDF downloads** (Billing). Reports' **Save as PDF** and the night audit / month **Print** (reports, not receipts). The folio's stay summary **Email** |
| Hotel setup | Payments and POS → Default receipt channel: only **WHATSAPP** or **NONE** (default WHATSAPP). A business that had PRINT or EMAIL now shows WHATSAPP |
| Device catalogue | **Receipt printer** is switched off: never offered for a new package, can't be switched back on. Packages that already have one keep it |

Contract: `docs/whatsapp-receipts.md` in hospio-backend.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Admin: **Settings → Device catalogue**; a business → **Devices & internet** (or onboarding step 8 **Connections**)

## Accounts

Password `Hospio123!`.

| Who | Email | PIN | Where |
|---|---|---|---|
| Front office | `qa.pin.front@hospio-qa.test` | 735184 | Simpas Ikeja (hotel) |
| Bar | `qa.pin.bar@hospio-qa.test` | 482916 | Simpas Ikeja |
| Kitchen | `qa.pin.kitchen@hospio-qa.test` | 691347 | Simpas Ikeja |
| Cashier | `qa.pin.cashier@hospio-qa.test` | 975318 | Simpas Ikeja |
| QA Lounge bar / manager | `bar.lounge.qhye@` / `manager.lounge.qhye@hospio-qa.test` | | QA Lounge Wuse Bar |
| Super admin | `amoria@hospio360.com` | | Admin portal |

**Name test data** "QA WR <your initials> …" (guests, walk-ins).

### What you can and can't check on staging

- **Use cash or the TEST terminal only.** Card payments never complete on staging; never use a real POS.
- **WhatsApp on staging only sends to allow-listed numbers.** Any other number is recorded as "Held back: not on this
  environment's allow-list": that is **expected**, and it proves the receipt was queued. Use a made-up number such as
  `+234 803 555 0192`. Do **not** type a real person's number. (The owner's Infobip account currently answers
  "Account issue (7011)" for real sends; also not a defect in the app.)
- **No SMS anywhere.** No receipt ever goes as an SMS.
- Don't touch "Patio Lounge". Don't accept terms for a real person's account.

## 1 · Take payment: the receipt step (front office)

1. **Do (front office):** Bookings → a checked-in QA guest with a phone → **Take payment** → Cash → an amount → **Cash
   received**. **Expect:** "Send a receipt" with two cards only: **WhatsApp** (picked) and **Don't send**. Under it
   "Guest's WhatsApp number" with the guest's phone. No Email, no Print, no SMS.
2. **Do:** clear the number and type `123`. **Expect:** "Type a real phone number…" and **Send on WhatsApp & record** is
   disabled. Type `+234 803 555 0192`.
3. **Do:** **Send on WhatsApp & record**. **Expect:** toast "₦… in cash recorded · Receipt sent on WhatsApp to +234 803 555
   0192". The done screen shows the tick and **no Print receipt**. No print window opens at any point.
4. **Do:** take another cash payment, pick **Don't send** → **Record payment**. **Expect:** "No receipt sent"; nothing sent.
5. **Do:** a guest with **no phone** (walk-in). **Expect:** **Don't send** is picked; WhatsApp can still be picked and asks for
   the number.
6. **Do:** **Skip receipt**. **Expect:** recorded, no receipt.

Repeat 1-4 as **bar** (close a tab / a sale → Collect), **kitchen** (a kitchen sale), **cashier** (To pay → a tab) and at the
**QA Lounge** bar. Same two choices everywhere.

## 2 · Sending again

1. **Front office → Payments** → an approved payment. **Expect:** **Send receipt on WhatsApp** (no Print receipt). Tap it:
   "Send receipt on WhatsApp" window with the payment's number filled in (empty = the number on the payment) → **Send on
   WhatsApp** → "Receipt sent on WhatsApp to …".
2. **My payments** (bar, kitchen, laundry, cashier) → an approved payment → **Send receipt on WhatsApp** (was "Print or email
   receipt"). Same window and result.
3. **Bar → Sales** → a paid sale: no **Print receipt** in the footer; each payment under **Payment** has **WhatsApp receipt**.
4. **Split bill** (a tab split in parts, each paid): no **Receipts** button; each paid part has **WhatsApp receipt**.
5. **Front office → Bookings → Check out** panel: no **Print receipt**.
6. A payment with no phone and the number left empty → "This payment has no guest phone · type the guest's WhatsApp number to
   send the receipt".

## 3 · Manager and owner

1. **Manager → Payments** → an approved payment. **Expect:** **Receipt PDF**, **Send on WhatsApp**, **Refund**. No Print receipt.
   Row menu **Send receipt again** → "Receipt sent on WhatsApp to …" (a payment without a phone: the "no guest phone" message).
2. **Receipt PDF** opens the receipt page: **Save as PDF** (A4 only, no "80 mm roll"), **Send on WhatsApp**, no **Email receipt**.
   Save as PDF opens the browser's save window with only the receipt on the page.
3. **Manager → Payments → Record a payment** and **Folios → a folio → Record payment**: "Receipt" offers **WhatsApp** (the
   folio's phone, greyed "No phone for this guest" without one) and **Don't send**.
4. **Folios → a folio → Email / copy** (was "Print / email"): window "Email or copy the folio" with **Copy / PDF** (Copy summary,
   **Folio PDF**) and **Email** (stay summary, unchanged). Front office's folio: **Email or copy** with **Copy** and **Email**,
   no Print receipt.
5. **Owner → Billing & invoices**: **Download PDF** on an invoice and **Receipt PDF** on its payments still download.
   Owner reports: **Save as PDF** still works.
6. **Hotel setup → Payments → Default receipt channel** and **Hotel setup → POS → Default receipt channel**: only WHATSAPP
   and NONE, with the help "Receipts are not printed or emailed".

## 4 · Device catalogue (Super admin)

1. **Settings → Device catalogue.** **Expect:** "Receipt printer" is there but **off**. Switching it on is refused: "Hospio360
   doesn't supply receipt printers: receipts go to guests on WhatsApp". Adding an item named "… printer" is refused the same way.
2. A QA business → **Devices & internet** (or onboarding step 8 Connections) → set up a package. **Expect:** tablet, router and
   data plan are offered; **no printer**.
3. A package that already listed a printer before today keeps its line, total and payments; saving its draft again is allowed.

## 5 · Regression

- Folio check-out with a balance (cash), bar tab close, split bill parts (cash), laundry payment, cashier To pay: payment
  recorded, till counts the cash, the folio/sale updates; only the receipt step changed.
- Tablet widths (768-1024 px): the receipt step, the WhatsApp window and the sale panel's payment rows don't overflow.
- Help (?) → Bar / Kitchen / Front office / Manager: "Send a receipt on WhatsApp" guides; What's new: "Receipts go on WhatsApp".
- Website Legal → Device & Equipment Supply Terms: "tablets, routers and data plans" (no printers).

## Expected vs a bug

- "Held back: not on this environment's allow-list" for a WhatsApp receipt on staging: **expected**.
- Any **Print** button, print window or 80 mm option in a payment flow, an **Email** receipt choice, or an SMS receipt: **bug**.
- A payment refused because of the receipt choice: **bug** (payments never fail over the receipt).
