# QA script · Inventory fixes from Samuel's run (staging)

## Purpose

Samuel's inventory and stores run (sheet v1.0, 21–22 Nov 2026, script 08) raised DEF-095 to DEF-108. This script checks each
fix on staging. Everything you do writes to the shared staging database.

What changed:

- **DEF-095, DEF-102 · optional notes say so.** "Note for the store (optional)" on Ask the store, "Note (optional)" on the count
  sheet, and the same on Receive a delivery, Move stock and Bar stock → Breakage; "Note to supplier (optional)" on a purchase
  order; "Notes (optional)" on a supplier.
- **DEF-096 · a supplier with no items is still allowed (decision).** Script 08 never promised a refusal, and an item has **one**
  usual supplier: forcing an item on a new supplier would take it from the supplier who has it now, and hotels often add a
  supplier first and move items to it later. Instead, **Items they supply** says "None yet is fine · add them now or later. Until
  then an order to them can pick any item."
- **DEF-097 · contact person's phone.** The supplier panel has **Contact person (optional)** and **Contact phone (optional)**.
  The contact phone (and the company phone) are checked on the screen and by the server: `0000000` gets "Enter a phone number like
  0803 123 4567". A number typed into the contact person's name gets "Enter the contact person's name · their number goes under
  Contact phone".
- **DEF-098 · nothing loose under Lines.** The yellow "+ Bed sheet (low)" pills under **Add an item** are gone; items running low
  are now first in the **Add an item** list, marked "· low". After you pick an item, the box shows its placeholder again.
- **DEF-099 · quantity starts empty.** A line you pick by hand has an empty Quantity box with a suggestion as placeholder ("e.g.
  20"). Save draft / Send with an empty quantity shows red "Enter how many" under it and sends nothing. **Reorder** from Stores &
  stock still fills the suggested quantity (script 08, 4.1).
- **DEF-100, DEF-101 · count notifications.** Submitting a count tells every manager ("Stock count to approve · <store>"); the link
  opens the count. Approving it tells whoever counted it ("Your count was approved · <store>").
- **DEF-104 · nothing covers Charge to room.** It was the staging-only **API** button sitting over the panel's bottom-right
  button. While a side panel or window is open the API button now sits at the bottom left, over the dimmed page.
- **DEF-105 · approval over the limit.** Not reproduced: see section 6. The check is unchanged and works on staging (limit
  ₦200,000 for Simpas Ikeja).
- **DEF-106 · one figure for what is on order.** Jide's **On order** tile shows full naira (₦41,770, not "42k") and "N orders
  still to arrive"; Femi's Today's money → Stock → **Still on order** shows the same figure and the same line. Both come from one
  number. The **Stock value** tile is full naira too.
- **DEF-107 · reorder-up-to below minimum.** Minimum 10, Reorder up to 5 → red "The reorder-up-to level can't be below the minimum
  (10)" under Reorder up to and **Save** stays greyed (the server refused it already).
- **DEF-108 · Stop stocking.** The item panel has **Stop stocking**. While any store holds the item the window says "<item> still
  has 12 kg in Main store · count it out or move it first" and the button stays greyed; once no store holds any it removes the item.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract: hospio-backend `docs/inventory-stores.md` (Suppliers, Stock counts, Money)
- Script 08 (`08-inventory-stores.md`) carries the same wording changes

## Accounts

Password `Hospio123!`; 2-step code `159753` where asked. Hotel: Royal Suites Ltd → Simpas Ikeja.

| Who | Email | Use |
|---|---|---|
| Jide Alabi (Inventory, Full) | `jide@royalsuites.ng` | suppliers, orders, counts, items |
| Tunde Bakare (Manager) | `tunde@royalsuites.ng` | approve counts and orders |
| Femi Ojo (Finance) | `femi@royalsuites.ng` | Today's money |
| Grace (Housekeeping) | `grace@royalsuites.ng` | Ask the store |
| Segun Ajayi (Bar, Full) | `segun@royalsuites.ng` | Bar stock, Sales |

Use QA items and suppliers named "QA …" only. Cancel test orders you don't need.

## 1. Optional notes (DEF-095, DEF-102)

1. **Do:** Grace → **Housekeeping store** → **Ask the store**. **Expect:** the note box reads **Note for the store (optional)**.
   Add one item, leave the note empty → **Send request**. **Expect:** sent.
2. **Do:** Jide → **Stock counts** → open (or start) a count. **Expect:** **Note (optional)** under the sheet; submitting with no
   note works.
3. **Do:** Jide → **Receive delivery**, **Move stock**, **New order**, **Add supplier**; Segun → **Stock** → Breakage. **Expect:**
   Note (optional) / Note to supplier (optional) / Notes (optional) on each. Close them without saving.

## 2. Suppliers (DEF-096, DEF-097)

1. **Do:** Jide → **Suppliers** → **Add supplier** → Company "QA Contact Co <initials>", Phone `0803 555 0778`, Contact phone
   `0000000` → **Save supplier**. **Expect:** red "Enter a phone number like 0803 123 4567" under **Contact phone (optional)**; the
   panel stays open; nothing is saved.
2. **Do:** Contact person `0000000`, Contact phone empty → **Save supplier**. **Expect:** red "Enter the contact person's name ·
   their number goes under Contact phone".
3. **Do:** Contact person "Bola QA", Contact phone `0803 123 4567`, leave **Items they supply** empty. **Expect:** under Add an
   item: "None yet is fine · add them now or later. Until then an order to them can pick any item." **Save supplier**.
   **Expect:** "… added"; the supplier's panel subtitle reads "Bola QA (0803 123 4567) · 0803 555 0778".
4. **API:** `POST /inventory/suppliers` with `contactPhone: "0000000"` → 400 "Enter a phone number like 0803 123 4567 for the
   contact person".
5. **Do:** open it → **Edit** → In use off → Save (tidy up).

## 3. New purchase order lines (DEF-098, DEF-099)

1. **Do:** Jide → **Purchase orders** → **New order**, don't pick a supplier yet. **Expect:** under LINES only "No lines yet · pick
   items below." and the **Add an item** box; no yellow "(low)" pills below it.
2. **Do:** open **Add an item**. **Expect:** items running low first, each "<name> · low"; the grey line under each says "N held
   · min M".
3. **Do:** pick one. **Expect:** a line card with the name, **Quantity** empty showing "e.g. N", **Unit cost** filled; the Add an
   item box shows its placeholder again (not blank).
4. **Do:** pick a supplier, then **Send** with the quantity still empty. **Expect:** red "Enter how many" under Quantity; nothing is
   sent.
5. **Do:** type `2` → **Save draft**. **Expect:** "Saved as a draft". Cancel the draft afterwards (Reason "QA 91").
6. **Do:** Stores & stock → **Reorder** on a low item. **Expect:** the order opens with the suggested quantity filled in (unchanged).

## 4. Stock count notifications (DEF-100, DEF-101)

1. **Do:** Jide → **Stock counts** → **Start a count** → Housekeeping store (or a store with no open count) → enter every quantity,
   one 1 fewer → **Submit count**.
2. **Do:** Tunde → bell / **Notifications**. **Expect:** "Stock count to approve · Housekeeping store" with "Jide Alabi counted
   the Housekeeping store · missing worth ₦…"; tapping it opens Inventory → Stock counts with that count open.
3. **Do:** Tunde → **Approve**. **Do:** Jide → Notifications. **Expect:** "Your count was approved · Housekeeping store" with
   "Tunde Bakare approved it · levels corrected (missing worth ₦…)"; tapping it opens the count.
4. **Bug if:** a manager who counts and approves their own count is told about their own approval.

## 5. Charge to room is not covered (DEF-104)

1. **Do:** Segun → **Sales** → **Show them** (unpaid from before today) → open an unpaid sale. **Expect:** the footer reads "₦…
   still to pay" and Cancel sale · Charge to room · Split or discount · Take payment, nothing on top of any of them; the dark **API**
   button sits at the bottom left while the panel is open.
2. **Do:** **Charge to room**. **Expect:** the Charge to room panel's **Back** and **Charge to room** are fully readable. Click
   **Back** (don't charge it).
3. Check on a laptop (1366–1440 wide) and a tablet (1024 and 800 wide).

## 6. Order over the limit needs the manager (DEF-105)

What we found: no ₦270,000 order was made during Samuel's run. Every order Jide sent between 11:00 and 12:00 on 21 Nov was
₦35,000 or less, so each went straight to the supplier, which is right. Every order Jide made over ₦200,000 (PO-2026-00022, 26,
29, 32, 37) went to **Needs approval** and onto Tunde's Approvals. The most likely cause was the pre-filled quantity (DEF-099):
typing into a box that already held a number made a different total. Re-run it:

1. **Do:** Jide → **New order** → Lagos Fresh Foods → Rice, Quantity `150`, Unit cost `1800`. **Expect:** the line total and the
   footer read ₦270,000. **Send**. **Expect:** "Sent to the manager for approval"; status **Needs approval**.
2. **Do:** Tunde → **Approvals**. **Expect:** "Purchase order PO-… · Lagos Fresh Foods · ₦270,000"; his bell has "Approval needed:
   purchase order". **Decline** it with the note "QA 91" (or approve and cancel it), so no rice is really ordered.

## 7. On order is the same for the storekeeper and Finance (DEF-106)

1. **Do:** Jide → **Stores & stock**. **Expect:** **On order** in full naira (e.g. ₦41,770) and "N orders still to arrive"; **Stock
   value** in full naira.
2. **Do:** Femi → **Today's money** → **Stock**. **Expect:** **Still on order** = the same naira figure and the same "N orders still
   to arrive" line.

## 8. Reorder-up-to and Stop stocking (DEF-107, DEF-108)

1. **Do:** Jide → open an item → **Edit item** → Minimum `10`, Reorder up to `5`. **Expect:** red "The reorder-up-to level can't be
   below the minimum (10)" under Reorder up to; **Save** greyed. Set Reorder up to `20` → the message goes. Cancel.
2. **Do:** open an item that holds stock → **Stop stocking**. **Expect:** a window "Stop stocking <item>?" with the red note
   "<item> still has N <unit> in <store> · count it out or move it first"; its Stop stocking button is greyed. Close it.
3. **Do:** **Add item** "QA Stop test <initials>", Opening quantity 0 → open it → **Stop stocking** → confirm. **Expect:** "… is no
   longer stocked"; the panel closes and the item is gone from the list.
4. **API:** `PUT /inventory/items/{id}` with `active:false` on an item holding stock → 400 "<item> still has … · count it out or
   move it first".

## Known limits

- A stopped item is not listed anywhere; to stock it again, add it again as a new item (its old movements stay with the old one).
- Count notices go to managers (not the owner); the owner still approves from Inventory → Stock counts.
- A bar or kitchen counter's "count approved" notice has no link (their menus have no Stock counts page); the notice text is enough.

## Run on staging (22 Nov 2026)

All sections passed; screenshots 00–28 in "Hospio test screenshots/Samuel inventory fixes (22 Nov 2026)" (00 is the API button over
Charge to room before the fix).

- Suppliers: contact phone `0000000` and a contact name `0000000` refused on screen; "QA Contact Co SM7876" saved with Bola QA (0803
  123 4567) and no items, then stopped (In use off).
- New order: no pills under Lines, low items first marked "· low"; Rice line started empty ("e.g. 1"), Send asked "Enter how many";
  Rice 150 × ₦1,800 from QA Contact Co → **PO-2026-00038** "Sent to the manager for approval", Needs approval, on Tunde's Approvals
  and in his bell; Tunde declined it ("QA 91 test order, not needed") → Cancelled.
- Count: Laundry store counted with no difference → Tunde's bell "Stock count to approve · Laundry store", its link opened the
  count (/dashboard/inventory?screen=counts&open=…); approved → Jide's bell "Your count was approved · Laundry store" (link
  /dashboard/counts?open=…).
- On order: Jide ₦290,010 "6 orders still to arrive" = Femi ₦290,010 "6 orders still to arrive"; Stock value ₦6,399,162 on both.
- Bed sheet (4 pcs in Housekeeping store): Stop stocking window "Bed sheet still has 4 pcs in Housekeeping store · count it out or
  move it first", button greyed; "QA Stop test SM5475" (0 held) stopped. Minimum 10 / Reorder up to 5 refused on screen.
- Segun's unpaid sale B-0012 and its Charge to room panel at 1024 and 1440 wide: nothing covers the buttons; API button bottom left.
