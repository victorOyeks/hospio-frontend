# QA script · Devices & internet packages (staging)

## Purpose

Hospio360 can supply tablets, a router and a data plan to a hotel and be paid for them: from transactions (2.5 % of each day's
sales with the daily fee until paid off), monthly (1–6 instalments, invoiced and debited), one time (at installation), or not
at all (own devices). See hospio-backend docs/plan-device-packages.md.

## Links

- Admin portal: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com

## 1. Catalogue (Super admin)

1. Settings → **Device catalogue**: tablet ₦180,000, router ₦65,000, receipt printer ₦85,000, data plan ₦30,000 a month.
2. **Add item** with an empty name or price: Save stays disabled. A negative price is refused.
3. **Change** a price; **Hide** an item: it is no longer offered for new packages (old packages keep their prices).

## 2. Put a package together (onboarding or the hotel panel)

1. Onboarding → Connections → **Devices & internet**, or Hotels → a hotel → **Devices**.
2. Choose **From transactions**, tick 2 tablets and the router: devices total ₦425,000; share 2.5 %.
3. Validations: no device ticked → "Add the devices supplied…"; share 25 → "at most 20"; **Monthly** with 7 months is impossible
   (1–6 only); **Own devices** with a tablet ticked → the tablet is greyed out.
4. Save: status **Agreed · not installed**; **Change package** still works; **Remove package** removes it.

## 3. Install and collect

1. **Mark installed** (a future date is refused): status **Paying off**.
2. From transactions: the next daily fee (00:05) shows a **Devices** column/line at 2.5 % of the day's sales, capped at what is
   left; the 06:00 debit pays the Hospio fee first, then devices; the package's payments list shows "From the daily debit".
3. One time: **Record payment** (money roles): more than is left is refused; a used reference is refused; paying the rest
   → **Paid off**.
4. Monthly: the first instalment invoice is issued on the install day; **Fees & billing → Devices → Run now** (Super admin)
   issues and debits; **Mark paid** needs a reference. Marking an instalment paid in the hotel panel updates the package's
   paid / left bar and its payments list straight away (no reload).
5. A package with money on it can't be removed.

## 4. Overdue (monthly)

1. Unpaid 3 days: reminder email; 7 days: an alert on the dashboard; 14 days: POS payments paused for the hotel.
2. Paying (Mark paid or Paystack) lifts the pause unless the daily fee also paused POS.

## 5. Owner and manager

1. Hospio fees → **Devices & internet**: what was supplied, how it is paid, progress and expected finish; **Device invoices**
   with **Pay** (Paystack), confirmed on return.
2. A manager sees only their hotel. The handover page lists the devices and the ownership terms.

## What to report

- Any amount that doesn't add up (instalments, caps, daily device line, ledger vs package paid).
- A validation that lets a wrong value through.

## 6. The data plan after installation

1. Hotel panel → Devices on an installed package with a data plan: a **Data plan** box shows Running, the price, the next invoice
   (the first due day not invoiced yet: on a due day whose invoice is out, next month) and "No renewal recorded yet".
2. **Mark renewed with provider** (any admin): pick a day → "Renewed through … · <you>". A past day is refused.
3. Finance or Super admin: **Change price** (0 or empty refused) → later invoices use the new price; issued ones keep theirs.
4. **Stop data plan** (the confirm names the day it takes effect: the first due day after today, even when today's invoice is still to come) → Stopped from that day; no more data plan invoices; invoices already issued stay owed. **Start data plan
   again** → billed from the next due day; the stopped months are never billed. A package with no data plan offers **Add a data plan**.
5. Support sees the box and Mark renewed, but not Change price / Stop / Start.
6. Fees & billing → Devices → **Data plan renewals**: running plans whose subscription runs out within 7/14/30 days (never recorded
   first); Mark renewed removes them from the 7-day list.
7. Owner's Hospio fees: "Data plan: ₦… a month · next invoice …" or "Data plan stopped from …".
