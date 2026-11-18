# QA script · Venue dashboards and reports (venue type, phase 2) (staging)

## Purpose

A lounge, bar or restaurant now has its own dashboards and reports, built only from real data
(hospio-backend `docs/plan-venue-type.md`, phase 2):

1. **Owner dashboard.** For every location without rooms, a "… today" section (one venue, or a picker with **All venues** when
   there are several): Sales today (with "▲/▼ x%" against the same weekday last week **by the same time**, only when something was
   sold that day; otherwise "no sales the same day last week to compare"), Money taken today, Open tabs (with "N over 4h"), Voids
   today; Money taken by method (cash, card per POS terminal, transfer); Sales by outlet; Top 5 items today (the same item at two
   outlets counted once); Tills (open with expected cash, closed with counted and over/short); Staff on shift now (clocked in, and
   how many are on today's rota); Voids & cancellations today (who, when, why, how much). With a venue chosen in the branch box,
   the top "Sales today" card shows the same figure.
2. **Manager dashboard at a venue.** The same section for the location, and "Needs your action" adds tabs open over 4 hours,
   sales still to pay, price changes waiting, stock counts waiting for approval and items running low. The rota-by-role and
   "Money today" cards are left out (the section has both).
3. **Reports** (owner and manager → Reports, area "Outlets"; listed first for a business without rooms; hotels get them for their
   restaurant and bar): Sales by outlet, Sales by item, Sales by category, Sales by staff (with voids they made), Sales by hour,
   Payments by method & POS, Voids & discounts (and complimentary sales), Stock used vs sold (recipes against what the stores gave
   out). Any period up to 3 months, one location or all; **Download CSV** and **Save as PDF** (the browser's print dialog). They
   are not scheduled or emailed. Tips are not recorded in Hospio360, so there is no tips report.
4. **Honest empty states.** "No sales yet today", "Nothing voided or cancelled today", "No till opened today", "Nobody is clocked in
   right now", "Nothing in this period". No sample numbers in demo mode either.

## Links

- Hotel app: https://web-staging.hospio360.com · Contract / tracker: hospio-backend `docs/plan-venue-type.md`
- API: `GET /fnb/sales/today`, `GET /fnb/sales/report?from&to[&outletId]`, `GET /payment/payments/by-terminal?from&to`,
  `GET /inventory/usage/items?from&to` (managers, owners, finance)

## Accounts

Password `Hospio123!`. Use only the QA venues; pay with cash or the **Bar test terminal** (logging POS) only.

| Who | Email | Location |
|---|---|---|
| QA Lounge owner / manager / bar / kitchen | `owner.lounge.qhye@` / `manager.lounge.qhye@` / `bar.lounge.qhye@` / `kitchen.lounge.qhye@hospio-qa.test` | QA Lounge Wuse Bar (Main Bar, VIP Lounge, Kitchen) |
| Mixed owner | `owner.mixed.cvt5@hospio-qa.test` | QA Venue Mixed cvt5 Hotel + Lounge |
| Hotel regression | `qa.pin.front@` / `qa.pin.bar@hospio-qa.test` | Simpas Ikeja |

## 1 · Make a day of trade (QA Lounge)

1. **Do:** bar, kitchen and manager clock in. Bar opens a till with a float.
2. **Do:** sell at least: Main Bar 2 Star + 1 Coke (cash); VIP 2 Chapman + 1 Star (card, Bar test terminal); Kitchen suya +
   peppered chicken (transfer on the test terminal); manager opens a Main Bar sale, bar takes cash; a tab with 2 Star left open;
   a sale with Coke + Chapman where Chapman is voided ("Guest changed mind"); a VIP sale cancelled before sending ("Rang up twice").
3. **Do:** bar closes the till (counted = expected), opens a new one.

## 2 · Owner dashboard

1. **Expect:** "QA Lounge Wuse Bar today". Sales today = sum of today's sales not cancelled (tabs included); the hint names the
   number of sales. No ▲/▼ unless the same weekday last week had sales.
2. **Expect:** Money taken by method: Cash, Card (POS) with "Bar test terminal" under it, Transfer; the KPI is their sum.
3. **Expect:** Sales by outlet per outlet with paid / to pay / cancelled; Top 5 with Star Lager and Coke counted across outlets.
4. **Expect:** Open tabs 1 (the open tab's amount "still to pay"); Voids today 3 with the cancelled sales and the voided Chapman,
   each with Bisi Bar Staff, the time and the reason.
5. **Expect:** Tills "1 open · N closed today", the open one "expected ₦…", closed ones "counted ₦… · balanced" (or over/short).
6. **Expect:** Staff on shift now lists the three clocked-in people "since …".
7. **Tablet:** at 1024 and 820 wide no sideways scrolling.

## 3 · Manager dashboard

1. **Expect:** the same section; "Needs your action" shows "N sales still to pay", and (when they exist) "Tab … open since …"
   for tabs older than 4 hours, price changes waiting, "Stock count of … waiting for approval", "N items running low".
2. **Expect:** no Occupancy, New booking, Room status, rota-by-role or "Money today" cards. Tablet widths as above.

## 4 · Reports

1. **Do:** Reports → Sales by outlet → Yesterday / This month / From-To today. **Expect:** rows per outlet; the numbers match the
   dashboard for today.
2. **Do:** open each outlet report. **Expect:** Sales by item (category, quantity, revenue), Sales by category, Sales by staff
   (sales opened, sold, paid, their sales cancelled, voids they made), Sales by hour (Lagos hours with sales), Payments by method &
   POS (cash, transfer, card per terminal; a note if the POS total and the outlets' card total differ), Voids & discounts (sale
   cancelled / item voided / discount / complimentary with who and why), Stock used vs sold (per stock item: sold by recipes, drawn
   by sales, the difference, by hand, wasted, count difference; an unsettled sale has not drawn yet).
3. **Do:** Download CSV and Save as PDF. **Expect:** the CSV opens in a spreadsheet with plain numbers; the print dialog shows the
   table with the maroon title.
4. **Expect:** no Schedule or Email me on outlet reports; hotel reports (Daily summary, Occupancy …) still have them.

## 5 · Mixed business and hotels

1. **Mixed owner:** hotel in the branch box → hotel KPIs (Occupancy tonight) plus "QA Venue Mixed cvt5 Lounge today" with
   "No sales yet today"; lounge in the branch box → the lounge's section first and the top Sales today card from it.
2. **Simpas Ikeja (hotel):** front office and bar dashboards as before; bar still offers Charge to a room; no venue section.

## Negative cases

- Bar or kitchen staff calling `GET /fnb/sales/report` or `/fnb/sales/today` → 403 (management and finance only).
- `GET /fnb/sales/report?from=2026-01-01&to=2026-11-18` → 400 "Choose up to 93 days at a time"; an outlet of another location → 403.
- A venue with no trade: every card says so ("No sales yet today", "No till opened today"), nothing shows ₦0 as a comparison.
