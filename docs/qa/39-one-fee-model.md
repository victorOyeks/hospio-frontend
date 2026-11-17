# QA script · One fee model: a share of daily sales (staging)

## Purpose

Hospio360 charges one way: a share of each day's sales (1.5 % unless agreed otherwise), debited each morning from the hotel's
Moniepoint or OPay account. Only the rate varies per business. "% of payments", "Per room night" and "% of bookings" are gone
from every screen, the backend refuses them, and every existing business was moved to the daily-sales model on 17 Nov.

## Links

- Admin portal: https://admin-staging.hospio360.com

## 1. New business

1. Businesses → **Set up a business**. The fee section is **Hospio360 fee**: one line explaining the model and **Share of daily
   sales (%)** already filled with 1.5. No model cards.
2. Create it: the business shows "% of daily sales, debited daily · 1.5%".

## 2. Edit business, onboarding, fee rules, settings

1. A business → Edit (Fee & contract): only **Share of daily sales (%)**.
2. Onboarding → the fee step is **Hospio360 fee** with the share (1.5 by default); it no longer offers % of payments.
3. Fees & billing → Fee rules → Change: the modal is **Fee rate** (share + applies from), button **Save rate**.
4. Settings → Fees: **Default fee** with **Default share of daily sales (%)** = 1.5; no model picker, no per-room fields.

## 3. Existing businesses

1. Businesses list: every business reads "% of daily sales, debited daily" at 1.5 % (Royal Suites keeps its own rate).
2. Daily fees start for a business once it is Live or At risk and has POS sales.

## 4. The hotel side

1. A new owner's handover page shows the fee as "1.5% of each day's sales, debited daily from your POS provider account".

## What to report

- Any screen still offering % of payments, per room night or % of bookings.
- A business whose fee isn't "% of daily sales".
