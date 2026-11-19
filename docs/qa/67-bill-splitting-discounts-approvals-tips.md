# QA script · Splitting a bill, discounts, approvals from the floor, tips, outlets per person (venue type, phase 4) (staging)

## Purpose

Phase 4 of lounges, bars and restaurants (hospio-backend `docs/plan-venue-type.md`), for hotels' restaurants and bars too:

1. **The bill.** Every open tab or sale has a **Bill**: what is still to pay is always on it. From the bill whoever takes the
   payment can **split** it (equally between people, by item, or by amount), take each part its own way (cash into the right
   till, card or transfer on the outlet's POS, a room at a hotel), send a WhatsApp receipt per part, and **undo the split** while no
   part is paid. The parts always add up to the bill to the kobo: ₦10,000 between three is ₦3,333.33 + ₦3,333.33 + ₦3,333.34;
   VAT and the service charge are shared in proportion. The tab closes by itself when the last part is paid. A split sale is
   still one sale in every report.
2. **Discounts and complimentary items.** On a line or on the whole bill, as a percentage or an amount, or **Free**
   (complimentary), always with a reason from Hotel setup → Reasons & lists. Managers and owners give any. The roles ticked in
   Hotel setup → Restaurant & bar → **Who gives a discount without asking** (cashier and bar staff by default) give up to the
   **Discount limit** in Approval limits (10 %). Anything bigger, any free item, or anyone else is sent to a manager.
3. **Requests to a manager.** A waiter, cashier or bar/kitchen person asks from the bill for a **void** (an item already sent,
   or the whole sale) or for the discount they can't give. The manager and the owner get a notification and decide it from
   **Needs your action** / Approvals, or on the spot: **Manager is here** on the bill, the manager picks their name and types
   their own PIN (the owner, who has no PIN, their password). The requester sees the outcome on the bill and in their bell.
4. **Tips** (off by default). Hotel setup → Restaurant & bar → **Record tips**. When on, the payment step offers **Tip
   (optional)**; the guest pays bill + tip, the tip is kept against whoever served, is never a sale, and shows in Reports →
   Tips and as **Cash tips held** on the till. When off, nothing about tips shows anywhere.
5. **Outlets per person.** Add / Edit staff (and onboarding People) has an optional **Outlets** list for waiters, cashiers, bar
   and kitchen staff. Empty = every outlet, as before. With a list, "Serving at" only offers those outlets and the server
   refuses the others.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Contract / tracker: hospio-backend `docs/plan-venue-type.md` (Phase 4), `docs/restaurant-bar.md` (The bill)

## Accounts

Password `Hospio123!`. QA venues only; pay with cash or the **Bar test terminal** (logging POS). Nothing is sent to `.test`
emails. Don't touch "Patio Lounge", real customers or the shared real-person accounts.

| Who | Email | PIN | Location |
|---|---|---|---|
| Manager (Tunde) / owner (Kemi) | `manager.lounge.qhye@` / `owner.lounge.qhye@hospio-qa.test` | manager 864201 | QA Lounge Wuse Bar |
| Bar (Bisi) / kitchen (Chidi) | `bar.lounge.qhye@` / `kitchen.lounge.qhye@hospio-qa.test` | | Main Bar, VIP Lounge, Kitchen |
| Waiter 1 (Wale) / waiter 2 (Kemi) | `waiter.lounge.qhye@` / `waiter2.lounge.qhye@hospio-qa.test` | 514273 / 628451 | QA Lounge Wuse Bar |
| Cashier (Chika) | `cashier.lounge.qhye@hospio-qa.test` | 937264 | QA Lounge Wuse Bar |
| Hotel bar / waiter / cashier / front office | `qa.pin.bar@`, `qa.pin.waiter@`, `qa.pin.cashier@`, `qa.pin.front@hospio-qa.test` | | Simpas Ikeja (hotel) |

Menu at Main Bar: Star Lager ₦1,500, Chapman ₦2,500, Peppered chicken ₦4,500 (made in the Kitchen), Coke ₦800. Prices include
7.5 % VAT. Open the Bar till and the Cashier till first (Till → Open till): cash needs the right till open.

## 1 · Split equally: ₦10,000 between three

1. **Do (bar):** Tabs → New tab "Table of three" → 4 Chapman → open and send. Open the tab → **Split or discount**.
   **Expect:** the bill: Total ₦10,000, **Still to pay ₦10,000**, the items each with Discount / Free, buttons **Split the bill**
   and **Take ₦10,000**.
2. **Do:** Split the bill → **Equally** → 3 people. **Expect:** "2 × pay ₦3,333.33", "The last person pays ₦3,333.34", "Adds up
   to ₦10,000". Split. **Expect:** three parts, each with **Pay**, and **Undo the split**.
3. **Do:** Pay part 1 → Cash. **Expect:** "Taking ₦3,333.33"; cash received 3,334 → change ₦0.67; done → back to the bill: part 1
   **Paid** (Cash, your name), Still to pay ₦6,666.67, no Undo ("A part is paid, so the split stays").
4. **Do:** Pay part 2 → Card on the POS → Bar test terminal. Pay part 3 → Bank transfer on the POS.
   **Expect:** after the last one the bill says **Paid in full**, the tab leaves the board; Payments lists three payments, each
   with its part and its own **Receipt** (the receipt line reads "… · Part 2 of 3").
5. **Expect elsewhere:** Sales shows one sale of ₦10,000, Paid; Reports → Payments by method counts cash ₦3,333.33, card
   ₦3,333.33, transfer ₦3,333.34; Sales by staff counts one sale; the Bar till went up by ₦3,333.33.

## 2 · Split by item, with a shared item and a service charge

Turn on Hotel setup → Money & payments → guests pay the Hospio360 fee (service charge 1.5 %) for this section, then off again.

1. **Do (cashier):** on a tab with 1 Star Lager, 1 Chapman and 1 Coke (₦4,800 + ₦66.98 service charge = ₦4,866.98): To pay →
   open it → **Split or discount** → Split the bill → **By item** → 2 bills. Tap Guest 1 for the Star Lager, Guest 2 for the
   Chapman, and **both** for the Coke. **Expect:** while an item is on nobody's bill: "Not on anyone's bill yet: …" and Split is
   greyed out. Each guest shows "about ₦…".
2. **Do:** Split. **Expect:** Guest 1 ₦1,926.51 (Star Lager, Coke (1/2)), Guest 2 ₦2,940.47 (Chapman, Coke (1/2)); they add up to
   ₦4,866.98 exactly.
3. **Do:** pay Guest 1 by transfer and Guest 2 by cash (the cash goes into the **cashier** till). **Expect:** paid in full.

## 3 · Split by amount, undo, and what a split locks

1. **Do (bar):** a tab of ₦3,800 → Split the bill → **By amount** → Part 1 ₦1,000, add another part ₦1,500.
   **Expect:** "Rest of the bill (the last part) ₦1,300". Typing more than the bill: "That is ₦… more than the ₦3,800 to pay".
2. **Do:** Split, then **Undo the split**. **Expect:** "Split undone. The bill is whole again"; Take ₦3,800 is back.
3. **Do:** split it again equally in two; go back to the tab and try **Add drinks**. **Expect:** "B-… is split. Undo the split to
   add to it (a split can be undone until one of its parts is paid)". On the board the tab's button reads **Open the split
   bill**, and Close & pay opens the bill, not one payment.

## 4 · A void needs a manager (and a split sale can still be voided)

1. **Do (bar, the split tab from 3):** the bill → **Ask to void the sale** → pick a reason → Send to a manager.
   **Expect:** "Sent to a manager to approve"; the bill lists the request "Waiting for a manager" with **Manager is here**.
2. **Do (manager):** the bell shows "Approval needed: void"; dashboard → **Needs your action** lists "Bisi …: Void the whole sale
   (₦3,800) on B-… at Main Bar" → open → Approve. **Expect (bar):** the tab is cancelled, the split is gone, the request reads
   Approved by Tunde, and the bell says "Approved: Void the whole sale…". Reports → Voids & discounts lists it under Bisi with
   "… · approved by Tunde Lounge Manager".
3. **Do (waiter):** a sent item on your own tab → the bill → **Ask to void** on the line. An item **not yet sent** has no Ask to
   void (take it off yourself, as before).
4. **Do:** split a tab, pay one part, then ask to void the sale. **Expect:** refused: "₦… is already paid on B-…. Collect the rest,
   or a manager refunds it first".

## 5 · Discounts: within the limit, over it, complimentary

1. **Do (cashier):** a ₦8,500 tab → the bill → **Discount the bill** → Percentage 10 → reason → **Give the discount**.
   **Expect:** done at once: total ₦7,650, "10 % off the bill: ₦850 · reason · by Chika Cashier", with Remove.
2. **Do:** Remove, then Discount the bill → 25 %. **Expect:** the note "That is over your 10 % limit. It goes to a manager…" and
   the button reads **Send to a manager**; nothing changes on the bill; the request waits.
3. **Do:** **Manager is here** → choose Tunde Lounge Manager → a wrong PIN. **Expect:** "Wrong PIN. 4 tries left". The right PIN
   → Approve. **Expect:** within a few seconds the bill reads ₦6,375, "by Chika Cashier", request Approved by Tunde.
4. **Do (waiter):** on your own tab, Discount 5 % on a line. **Expect:** always "Send to a manager" (waiters aren't in "Who gives
   a discount"). The manager **declines** it from Approvals with a note. **Expect:** nothing changed; the bill and the waiter's
   bell say Declined with the note.
5. **Do (bar):** **Free** on a Star Lager → reason "Sent back or spilled". **Expect:** a free item always goes to a manager.
   Approve it as the **owner** from the owner dashboard (Approvals waiting). **Expect:** the line reads "Complimentary · reason ·
   by Bisi, approved by Kemi Lounge Owner" and costs ₦0.
6. **Do (manager):** on any open bill give 40 % or **Whole bill free**. **Expect:** done at once, no request; a bill made free
   closes as complimentary.
7. **Expect:** Reports → Voids & discounts lists each with Given by hand, Complimentary items and worth, the reason, By and
   Approved by. A bill that is split can't be discounted until the split is undone.

## 6 · Tips (optional, off by default)

1. **Expect with Record tips off:** no Tip field in any payment step, no Tips report, no "Cash tips held" on any till.
2. **Do (manager):** Hotel setup → Restaurant & bar → **Record tips** on → Save.
3. **Do (cashier):** take payment for Wale's ₦3,000 tab → Cash. **Expect:** **Tip (optional)** "Not part of the sale. Recorded for
   Wale Waiter". Type 500. **Expect:** Bill ₦3,000, Tip ₦500, The guest pays ₦3,500; cash step "Amount due (with the ₦500 tip)
   ₦3,500".
4. **Expect after:** the sale is ₦3,000 paid (not ₦3,500); the bill shows "Tips (not part of the bill) ₦500"; Till: expected cash
   up by ₦3,500 with **Cash tips held ₦500 (in the drawer, not takings)** and a "Cash tip" entry; Reports → **Tips**: ₦500 under
   Wale Waiter, today; Sales and Payments by method still say ₦3,000.
5. **Do:** a card payment with a ₦200 tip on the Bar test terminal. **Expect:** the POS is asked for bill + tip; Tips shows it
   under card/transfer.
6. **Do:** switch Record tips off again. **Expect:** as in step 1 (the Tips report hides; earlier tips stay recorded).

## 7 · Outlets a person works

1. **Do (manager):** Staff → Kemi Waiter → Edit → **Outlets** → tick only VIP Lounge → Save. **Expect:** her profile reads "Works
   at: VIP Lounge".
2. **Do (Kemi, after signing in again):** "Serving at" offers only VIP Lounge; her board and sales show only VIP Lounge.
   Opening a tab at Main Bar by address or API is refused: "You aren't assigned to Main Bar. A manager can add it to your
   outlets (Staff → Edit)". A cashier kept to VIP Lounge can't take payment for a Main Bar sale either.
3. **Do (manager):** set her back to **All outlets**. **Expect:** Main Bar is offered again.
4. **Admin:** Onboarding → People for a venue with 2+ outlets: a waiter, cashier, bar or kitchen person has the same optional
   Outlets list.

## 8 · Hotel regression (Simpas Ikeja, `qa.pin.*` only, cash only)

1. **Do (qa.pin.bar):** Bar → a tab with 2 Coca-Cola (₦2,400) → Split or discount → Split equally in 2 → part 1 → **Room** →
   a QA guest in house (A102). **Expect:** "Part 1 (₦1,200) charged to room A102"; the guest's folio gets "Bar · B-… (part 1 of a
   split bill)" for ₦1,200. Pay part 2 in cash. **Expect:** the tab closes; Sales shows it as on a room with ₦1,200 paid at the
   bar.
2. **Do (qa.pin.waiter / qa.pin.cashier):** waiter opens a tab; cashier opens its bill, gives 10 %, takes cash.
3. **Expect:** front office, folios, charge to room of a whole tab and the night audit are as before; with Record tips off
   nothing about tips shows.

## 9 · Layout

At 820 and 1024 wide: the bill, the split, discount and manager approval windows, the payment step with a tip, Reports → Tips
and Voids & discounts, and the till with tips have no sideways scroll.

## Checked by SQL when this shipped

For one day at QA Lounge Wuse Bar: `fnb.order_payments` adds up to the sales paid (a split sale's parts add up to its total);
`fnb.order_tips` holds the tips and they are in neither `order_payments` nor `finance.revenue_entries`; the daily fee base
(`fnb-service GET /internal/sales/daily`, what `DailyFeeService` charges 1.5 % on) is the money paid less VAT, unchanged by a
split or a tip and lower by exactly the discount (less its VAT) on a discounted sale.
