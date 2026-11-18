# QA script · Money and stock fixes: POS terminal in onboarding, stock for dishes made elsewhere, cash needs an open till (staging)

## Purpose

Three fixes from the lounge test run, for every hotel:

1. **Onboarding → Connections: Add terminal works.** A Hospio360 admin adding a POS terminal to a hotel got "Something went wrong"
   (the terminal was saved without the hotel's business). The terminal now belongs to the hotel and its business; a hotel that
   doesn't exist is refused ("Hotel not found").
2. **A dish sold at one outlet and made at another takes its stock.** Peppered chicken sold at the Main Bar and cooked in the
   Kitchen (Made at: Kitchen) took no chicken. The rule now:
   - Made where it is sold: the item's own recipe, from the selling outlet's store (as before).
   - Made at another outlet: the stock comes from the **preparing outlet's store** (the kitchen's chicken is in the Kitchen store).
     The recipe is the sold item's own when it has one; when it has none, the recipe of the dish with the **same name on the
     preparing outlet's menu** (the dish a copied item came from). No such dish: nothing is drawn.
   - Each line is drawn once, and the order once (paying twice or retrying never draws again).
3. **Cash at the front office, bar or kitchen needs that desk's till open.** Bar staff took ₦22,400 cash with no till open. Now:
   picking **Cash** with the till closed shows **"Open your till first"** with an Opening float field, an **Open the bar till**
   button and a link to the Till page; **Count cash** stays disabled until it is open. The server refuses too: "Open your till
   first: cash taken at the bar goes into the bar till, and it isn't open…". Card, transfer and charge to room are unchanged.
   Not asked: laundry (hands its cash in, no till page) and managers and owners taking cash on Sales, Payments or bookings (no till
   of their own; their cash still shows on Today's money as "cash taken with no till").

## Links

- Admin portal: https://admin-staging.hospio360.com/admin/onboarding
- Hotel app: https://web-staging.hospio360.com
- Contracts: hospio-backend `docs/restaurant-bar.md` (stock for a dish made at another outlet), `docs/operating-day.md` (Tills)

## Accounts

| Who | Email | Used for |
|---|---|---|
| Super admin | amoria@hospio360.com | onboarding Connections |
| QA Lounge bar | bar.lounge.qhye@hospio-qa.test | cross-outlet sale, cash and till |
| QA Lounge kitchen | kitchen.lounge.qhye@hospio-qa.test | kitchen ticket |
| QA Lounge manager | manager.lounge.qhye@hospio-qa.test | stock levels, manager cash |
| Simpas Ikeja bar / kitchen / front office | the usual Simpas accounts | regression only |

Password `Hospio123!`. Never change shared accounts' roles, passwords or 2-step. Use the **Test terminal** provider only. Never add or
charge a real Moniepoint/OPay terminal. Don't touch "Patio Lounge".

## 1. Add a terminal in onboarding (Super admin)

1. Admin portal → Onboarding → a QA business (e.g. "QA Lounge qhye") → step 8 **Connections**.
2. Add a terminal: Name "QA test POS", Provider **Test terminal**, reference "TEST-QA-01", Desk **Laundry** (or No desk yet).
3. Expect the toast "Terminal added". The terminal appears in the hotel's list, with no error page.
4. Sign in to the hotel app as that hotel's manager → Payments → Terminals: the same terminal is there.
5. Remove the test terminal afterwards (Payments → Terminals → Remove) unless the hotel needs it.

## 2. A dish made at another outlet takes its stock once

Setup (once): at QA Lounge, the Main Bar sells "Peppered chicken" with **Made at: Kitchen** and no recipe; the Kitchen's own
"Peppered chicken" has the recipe 1 × Chicken portion. Note the Chicken portion level in the **Kitchen store** (manager → Inventory).

1. Bar (Serving at: Main Bar) → new sale → 1 Peppered chicken → send. The kitchen board shows the ticket.
2. Take payment by card on the test terminal (or cash with the bar till open). The order closes.
3. Within a few seconds, Kitchen store → Chicken portion is **1 lower**. The Bar store is unchanged.
4. Stock movements for the kitchen store show one "Sold on order B-…" line for it, not two.
5. A bar item made at the bar (e.g. Coke) still takes its stock from the Bar store.

## 3. Cash needs the desk's till open

1. Bar: make sure the bar till is closed (Till page shows "Open till").
2. Take payment for an order → **Cash**. Expect the yellow note "Open your till first", the Opening float field, the button **Open
   the bar till** and the link **Go to the Till page**. **Count cash** is disabled.
3. Switch to **Card on the POS**: the note goes and the card goes to the test terminal as before.
4. Back to **Cash** → leave the float blank (the hotel's usual float) or enter one → **Open the bar till**. Toast "Bar till opened ·
   Float ₦…"; the note goes and **Count cash** works. Record the cash.
5. Till page: the till shows the cash payment, expected cash = float + the payment. Close (count) the till: the count matches.
6. The same at the kitchen (Kitchen till) and front office (Front office till).
7. Manager → Sales or Payments → take cash: no till note (managers have no till).
8. Laundry → take cash: no till note ("Count it and hand it in").

## 4. Regression (Simpas Ikeja)

1. Bar sale paid by card on the test terminal; a tab opened and settled.
2. Kitchen ticket sent, marked Ready, served.
3. Front office takes a payment on a folio (card; cash only with the front office till open).
4. Nothing above shows an error page; amounts and receipts are as before.
