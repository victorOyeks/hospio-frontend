# QA script · Supplier bills from deliveries (staging)

## Purpose

Until 21 Nov receiving a delivery added stock but told Finance nothing, and the Finance officer had no Bills page at all.

Now:

- **Receiving a delivery makes a bill for Finance**, with or without a purchase order:
  - payee = the supplier (QA Supplies Ltd), category **Stock purchases**;
  - amount = the value **received**: the good units times their cost. Damaged units are noted for the supplier, never stocked and
    never billed; short units simply aren't received;
  - due date = the day it was received plus the supplier's payment terms ("14 days" → 14 days later). "Pay on delivery" or no
    terms → due the day it arrived;
  - note `Delivery 3F9A2C1B · PO-2026-00012 · invoice QA-INV-2111 · 14 days`; the supplier's invoice number is on the bill;
  - **one bill per delivery**: a repeated event never makes a second; a delivery worth ₦0 (only damaged goods) makes none;
  - deliveries received **before** this change have no bill;
  - nothing is ever paid automatically.
- **Deliveries:** Receive says "Bill of ₦1,820 added for Finance, due 5 Dec"; a delivery's panel shows **Supplier bill** with its
  status (Unpaid · due …, Unpaid · overdue since …, Paid … · from bank).
- **Finance → Bills** (new, in the sidebar after Expenses): **Owed to suppliers** (per supplier: total, overdue, oldest due date;
  Unpaid / Overdue / Paid tabs; tap a supplier to list only their bills), the bills list, Add bill and Mark paid. Finance with View
  only can read bills but not add or pay them.
- **Mark paid** → Paid from Bank / Cash / A till → a paid expense under Stock purchases, in Expenses and Today's money "Paid out".
  Pay in full only (no part payments).
- **Record expense** hints at an unpaid supplier bill of about the same amount ("There's an unpaid bill for QA Supplies Ltd ₦1,000
  from delivery … — pay that instead?") with a link to it. It is only a hint: the expense can still be sent.
- Manager **Financials → Bills** and the owner's **Financials** show Owed to suppliers too; their bill panel links to the delivery
  and the purchase order in Inventory.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract: hospio-backend `docs/inventory-stores.md` → Deliveries → "Supplier bills (21 Nov 2026)"; `docs/manager-leftovers.md`
  (bills endpoints); `docs/operating-day.md` → Expenses

## Accounts

Password `Hospio123!`; 2-step code `159753` where asked. Hotel: Royal Suites Ltd → Simpas Ikeja.

| Who | Email | Use |
|---|---|---|
| Jide (Inventory) | `jide@royalsuites.ng` | purchase orders, deliveries |
| Femi (Finance) | `femi@royalsuites.ng` | Bills, Expenses, Today's money |
| Manager (QA Lounge) | `manager.lounge.qhye@hospio-qa.test` | Financials → Bills (manager view) |
| Owner (QA Lounge) | `owner.lounge.qhye@hospio-qa.test` | Financials (owner view) |

Use **QA Supplies Ltd** (terms 14 days) and QA items only (QA Napkins, Bin liners), small quantities. Don't use Tunde, Godwin,
Segun, Mariam, Amoria, Victor or Tobi, and don't pay or cancel a bill you didn't make in this script.

## 1. A purchase order received with a damaged item makes a bill (Jide)

1. **Do:** Jide → **Purchase orders** → **New order** → QA Supplies Ltd, Main store, QA Napkins 3 × ₦500 and Bin liners 5 × ₦80
   (₦1,900) → send it. **Expect:** it goes to the supplier (SENT).
2. **Do:** **Deliveries** → **Receive a delivery** → that order. Bin liners: Received **4**, Damaged **1**; Invoice number
   `QA-INV-2111`. **Expect:** the grey line under the totals: "Received is the good units: they go into stock and onto the
   supplier's bill. Damaged units are noted for the supplier, not stocked or billed. Finance gets a bill of ₦1,820, due by the
   supplier's payment terms."; the amber note "1 pcs Bin liners short · 1 pcs Bin liners damaged (not stocked). The order stays
   open for the rest."; button **Receive ₦1,820**.
3. **Do:** **Receive ₦1,820**. **Expect:** toast "Delivery received · 1 short · 1 damaged · Bill of ₦1,820 added for Finance, due
   Sat 5 Dec" (today + 14 days).
4. **Do:** open the delivery. **Expect:** **Supplier bill ₦1,820 · Unpaid · due Sat 5 Dec** under the invoice line. (Right after
   receiving it may say "Supplier bill: waiting for Finance to add it" for a few seconds; reopen.)
5. **Bug if:** the bill is ₦1,900 (the ordered value) or includes the damaged bin liner (3 × ₦500 + 4 × ₦80 = ₦1,820 is right),
   the due date is not today + 14 days, or no bill appears. Close the order afterwards (**Close** → "the short bin liner is not
   coming") so it doesn't stay part received.

## 2. A walk-in delivery (no order) and a damaged-only one (Jide)

1. **Do:** **Receive a delivery** → **No order (walk-in delivery)** → Supplier QA Supplies Ltd → Main store → QA Napkins, Received 2,
   cost ₦500, invoice `QA-INV-2112` → **Receive ₦1,000**. **Expect:** "Bill of ₦1,000 added for Finance, due 5 Dec" (the supplier is
   found by name, so its 14-day terms apply); the panel shows the bill.
2. **Do:** the same with Received **0** and Damaged **1** (nothing good arrived). **Expect:** "Delivery received · 1 damaged" and
   **no** bill line in the toast or the panel (₦0 is never billed).
3. **Do:** open an older delivery (before 21 Nov). **Expect:** "No supplier bill for this delivery (received before bills were made
   automatically)".

## 3. One bill per delivery (replay)

1. **Do:** (engineer) re-publish the delivery's `hospio-delivery-received` event (same `deliveryId`) to Kafka. **Expect:**
   finance-service logs "Delivery … already has its bill; replay ignored"; still one bill for the delivery (Bills, search the
   supplier; `GET /finance/bills/delivery/{id}` unchanged).
2. **Bug if:** a second bill appears for the same delivery.

## 4. Finance: Bills and Owed to suppliers (Femi)

1. **Do:** sign in as Femi. **Expect:** **Bills** in the sidebar after Expenses.
2. **Do:** **Bills**. **Expect:** header "Supplier and utility bills · ₦… to pay · ₦… overdue · ₦… paid this month" and **Add
   bill**; **Owed to suppliers** card: "₦… owed to N suppliers" (plus "· ₦… overdue" when some is), one row per supplier with "N
   bills · oldest due …", the total and (red) "₦… overdue" where some is overdue; QA Supplies Ltd shows ₦2,820, "2 bills · oldest
   due Sat 5 Dec".
3. **Do:** switch **Overdue** and **Paid**. **Expect:** Overdue lists only suppliers with bills past due; Paid lists what was paid in
   the last 90 days with "last paid …".
4. **Do:** tap **QA Supplies Ltd**. **Expect:** the list below shows only its bills (search box = the name).
5. **Do:** open the ₦1,820 bill. **Expect:** To pay; Due 5 Dec; Repeats Once; **Supplier's invoice QA-INV-2111**; Note "Delivery … ·
   PO-… · invoice QA-INV-2111 · 14 days"; Added by Jide Alabi; blue note "Made from a delivery received in Inventory by Jide Alabi:
   the value of the good units received, damaged ones left out. Paid in full." Category Stock purchases.

## 5. Pay it from the bank (Femi)

1. **Do:** **Mark paid** → **Bank** → **Mark paid**. **Expect:** toast "QA Supplies Ltd paid · ₦1,820 recorded as an expense"; the
   bill moves to Paid; Owed to suppliers drops to ₦1,000.
2. **Do:** **Expenses**. **Expect:** "Bill · QA Supplies Ltd · Delivery … · PO-… · invoice QA-INV-2111 · 14 days", ₦1,820, Stock
   purchases, Paid; Paid from reads "Transfer" (the expense list's word for bank).
3. **Do:** **Today's money**. **Expect:** "Paid out" includes the ₦1,820; "Paid out today" and "Money movements" list the bill.
4. **Do:** Jide → Deliveries → that delivery. **Expect:** **Supplier bill ₦1,820 · Paid Today · from bank** (a date on later days).
5. **Bug if:** a bill is paid without Mark paid, or paying it twice is possible ("This bill is already paid").

## 6. Double-payment hint on Record expense (Femi)

1. **Do:** **Expenses** → **Record expense** → Category any, What for "QA Supplies napkins", Amount **1,000**. **Expect:** after a
   moment a blue note "There's an unpaid bill for QA Supplies Ltd ₦1,000 from delivery 328408FD · invoice QA-INV-2112 · 14 days — pay
   that instead?" with **Open the bill** → Bills, filtered to QA Supplies Ltd, with that bill open.
2. **Do:** change the amount to 50,000. **Expect:** the note goes.
3. **Do:** **Cancel** (don't send). The hint never blocks **Send for approval**.

## 7. Manager and owner (QA Lounge) and permissions

1. **Do:** manager.lounge → **Financials → Bills**. **Expect:** Owed to suppliers above the bills list (Unpaid / Overdue / Paid;
   "Nothing owed" while the lounge has no bills); a supplier bill's panel has **Open the delivery** / **Open the purchase order**
   links into Inventory. The manager's **Record expense** shows the same hint (it also reads "Paid to").
2. **Do:** owner.lounge → **Financials**. **Expect:** **Bills to pay** next to **Owed to suppliers** (unpaid, per supplier).
3. **Do:** a Finance account with **View only** (if one exists) → Bills. **Expect:** "View only: you can see the bills; a manager,
   the owner or Finance with Can edit adds and pays them."; no Add bill; no Mark paid.
4. **API:** front office → `GET /finance/bills/owed` → 403; Jide → `GET /finance/bills/delivery/{id}` → 200, `GET /finance/bills` →
   403.

## Known limits

- Pay in full only: no part payments on a bill.
- A bill made from a delivery is changed (amount, due date) or cancelled in Finance; editing the delivery doesn't change it.
- Deliveries received before 21 Nov 2026 have no bill (an owner decision whether to backfill them).
- Paying a bill isn't routed for approval (as for every bill): only a manager, the owner or Finance with Can edit can pay one.
- The hint looks at supplier bills from deliveries in the last 30 days only.

## Run on staging (21 Nov 2026)

All sections passed; screenshots 01–19 in "Hospio test screenshots/Supplier bills (21 Nov 2026)". PO-2026-00031 (₦1,900 ordered,
₦1,820 billed, paid from bank, then closed short); walk-in QA-INV-2112 ₦1,000 left **unpaid** for the hint; the damaged-only delivery
made no bill; the PO delivery's event re-published twice → "already has its bill; replay ignored" twice, still one bill. Deliveries
already on the topic from before the release were skipped ("received before supplier bills"). Jide gets 403 on the bills list and
Owed to suppliers, 200 on his delivery's bill.
