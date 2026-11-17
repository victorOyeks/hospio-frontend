# QA script · Hospio fees for the owner and the manager (staging)

## Purpose

The 1.5 % daily fee is taken automatically from the hotel's Moniepoint or OPay account at 6am, so there is no invoice and
nothing to pay. The owner (every hotel) and now the manager (their hotel, read-only) can see each day's sales, the fee, and
how and when it was taken.

## Links

- Hotel app: https://web-staging.hospio360.com → **Hospio fees** in the menu (owner and manager)

## Accounts

Password for every account: `Hospio123!`. Owner of Royal Suites; manager of Simpas Ikeja.

## 1. Owner

1. Menu → **Hospio fees**. The header has a period picker: Last 30 days, then the last 12 months.
2. The cards show sales, fees and debited for the period. While automatic debit is off, a note says nothing is taken and
   there is nothing to pay; once it is on, a line says the fee is taken automatically at 6am.
3. Each row: day, sales, fee, debited, **From** (Moniepoint or OPay, with the time), status.
4. Open a day: what was sold by line, the fee, carried in, due, statement emailed, debited at, **debited from**, **debit
   reference**, attempts. A failed or part debit shows the provider's reason and when it is retried.
5. No Pay button or payment link anywhere.

## 2. Manager

1. Signed in as the manager: **Hospio fees** is in the menu (after Payments).
2. It shows only the manager's own hotel, with the same detail. The notes say the statement is emailed to the owner.

## 3. Admin portal · business Money tab

1. Admin portal → Businesses → Royal Suites Ltd → **Money**. Royal Suites is on the daily 1.5 % fee, so the first card reads
   **Hospio fees this month** (with "statement only, not debited yet" while debit is off, or the amount debited) and the
   left panel is **Daily fees · this month**: one row per day and hotel with sales, debited, fee and status.
2. **Daily fees →** opens Fees & billing → Daily fees filtered to the business.
3. No "Fee statements" or "Fees outstanding ₦151k" any more (the two seeded test statements were removed on 17 Nov, and the
   staging seed no longer creates them).
4. The cards read: **Payments received this month** (with the cash / desk transfer / POS split), **Into the hotel's POS
   accounts**, **Hospio fees debited**. The right panel is **Where the money goes** (POS payments land in the hotel's own
   Moniepoint/OPay account; Hospio360 debits its fee), not Settlements.
5. **Payments received by how they were paid** lists Cash, Bank transfer (recorded at desk), Moniepoint POS, OPay POS — no
   "logging". Payments & POS → "By how it was paid" uses the same names.
6. A business on a monthly fee model (% of payments, per room night, % of booking value, flat) still shows its fee statements.

## What to report

- A manager seeing another hotel's fees.
- A Pay button or payment link anywhere on these pages.
- Days missing compared with the admin portal's daily fees for the same hotel.
