# QA script · Hospio's daily fee and the hotel's own POS (staging)

> **Out of date for the debit (19 Nov 2026).** Nothing is debited any more: each day goes on the monthly invoice (script 63), and
> the debit switch, "Run debit now" and the Fee debit integration cards are removed (script 74). Skip section 5; the POS sections
> still apply.

## Purpose

Hospio360 takes **1.5 % of what each hotel sells every day** (VAT excluded). The rate is set per business in the admin portal.

- **After midnight:** the day is worked out and the owner gets a statement by email.
- **At 6am:** the fee is debited from the hotel's own Moniepoint or OPay account, but only once automatic debit is switched on for that hotel. Until then the hotel is in **shadow mode**: statements only, nothing taken.
- **If a day isn't debited:** it is tried again that day and moves into the next day's fee.
- **After 3 unpaid days:** card payments to the POS pause until a debit goes through. Cash and transfers keep working.

**What counts as sold:**
- folio charges (room nights, one per night stayed; extras; minibar);
- less discounts and voids;
- plus restaurant, bar and kitchen amounts paid at the counter;
- plus guest laundry paid directly;
- plus deposits kept on a no-show.

Anything charged to a room counts once, on the folio. A deposit kept on a cancellation is the guest's credit, so it doesn't count.

**Each hotel's Moniepoint or OPay keys:**
- A Hospio360 super admin enters them in the admin portal.
- The hotel's managers and owner see them masked in Hotel setup → POS.
- With keys in, the hotel's card payments go to its own terminals. Without keys, nothing changes.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: the admin portal on staging → Businesses → Royal Suites Ltd → Hotels → Simpas Ikeja

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Owner (Royal Suites) | `godwin@royalsuites.ng` |
| Manager | `tunde@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Super admin | the staging super admin |

## 1. Rate per business

1. Admin portal → **Fees & billing** → set the fee model for Royal Suites Ltd: **% of daily sales**, value `1.5`.
2. The business page shows "% of daily sales, debited daily".
3. Monthly statements: generating them skips this business, noted "billed daily (percent of sales), no monthly statement".

## 2. A day worked out (shadow mode)

1. On a test day, as front office:
   - check a guest in (2 nights at ₦35,000);
   - post a ₦5,000 room-service charge to the room;
   - sell ₦3,000 at the bar for cash (not to a room);
   - take a ₦2,000 laundry payment directly.
2. The next day, admin portal → the hotel → **Hospio fee collection** → **Work out yesterday**.
3. **Daily fees** shows the day with **Statement only**. Open it:
   - Room nights ₦35,000 (one night, not two);
   - Other charges on folios ₦5,000;
   - Restaurant, bar and kitchen ₦3,000 less VAT (about ₦2,790.70 at 7.5 %);
   - Guest laundry ₦2,000;
   - the fee is 1.5 % of the total.
4. The owner's email has the statement with the same lines and "Nothing is debited yet".
5. Owner → **Hospio fees**: the same day, same numbers, with the "Automatic debit isn't on yet" note.
6. Run **Work out yesterday** again: nothing changes (each day is worked out once).
7. The next day the second night counts. A charge voided on day 3 that counted on day 1 shows as a negative "Charges voided" line on day 3.

## 3. Stay changes reach the folio

1. Extend an in-house guest by one night. The folio gets "Room … · 1 more night" for one night's rate, and the booking's balance goes up by the same amount.
2. Shorten a stay by one night. The folio gets "· 1 night fewer" as a negative line.
3. Move an in-house guest to a room at another rate. The folio gets the difference as "new room rate".

## 4. POS keys (super admin)

1. Admin portal → Hotels → the hotel → **POS & Hospio fees** → **POS providers**. There's a block for **Moniepoint** and one for
   **OPay**, each "Not added".
2. Moniepoint → **Add keys**: paste the API key and webhook secret and **Save keys**. The Moniepoint block shows each key masked
   (e.g. `••••••3456`) and **Complete**.
3. OPay → **Add keys**: paste a PKCS#1 private key (`BEGIN RSA PRIVATE KEY`). It's refused, with how to convert it
   (`openssl pkcs8 …`). With proper keys, OPay shows **Complete** too. **Moniepoint's keys are still there**: a hotel holds both.
4. Moniepoint → **Remove**: only Moniepoint's keys go. OPay's stay.
5. As the manager, Hotel setup → **POS** shows a block per provider with **Connected** and the masked keys. Nothing can be edited.
6. Each card payment goes through its terminal's provider. A Moniepoint terminal uses the Moniepoint keys, an OPay terminal the
   OPay keys. A terminal of a provider without keys keeps the server's POS setting.

## 5. The debit switch (super admin)

1. **Hospio fee collection** → **Debit from**: pick the provider.
2. The provider boxes say whether its debit is configured on the server and whether the hotel's keys are in.
3. With the debit not configured, the **Automatic debit** switch can't be turned on.
4. With OPay configured on the server and the hotel's OPay keys in, turn it on. The next worked-out day shows **Debit at 6am**, and **Run debit now** debits it: **Debited**, or **Not debited** with OPay's reason.
5. Turn it off: days go back to **Statement only**, and a POS pause is lifted.

## 6. Your POS device test (Moniepoint or OPay)

Before you start:
- The hotel's keys are saved (section 4).
- In the provider's dashboard, the webhook URL is set:
  - Moniepoint: `https://api-staging.hospio360.com/payment/webhooks/pos/moniepoint`
  - OPay: `https://api-staging.hospio360.com/payment/webhooks/pos/opay`
- Moniepoint only: the server has `MONIEPOINT_BASE_URL`, and the terminal app is version 1.7.2 or later with ERP integration enabled.

Steps:
1. Manager → Hotel setup → **POS** → add a terminal: name it, set the provider, put the **terminal serial number** as the reference, and assign it to Front office.
2. As front office, take a card payment of ₦100 on a booking.
3. The terminal shows the ₦100 request within a few seconds. Pay with a card.
4. Within seconds the desk screen shows approved, the payment is in **Payments** as Card, and the folio balance drops by ₦100.
5. Send another ₦100 and decline it, or let it expire. The desk screen shows declined, and nothing is posted.
6. Close the webhook (or turn off the terminal's network) after paying. Within 30 seconds the payment is still confirmed: the backend asks the provider itself.

## What to report

- A day whose lines don't match what was done (room nights on the wrong day, a room charge counted twice, VAT included).
- A statement or debit for a hotel in shadow mode, or a day worked out twice.
- A key shown in full anywhere, or a manager able to change keys.
- A POS payment that never reaches the terminal, or one approved on the terminal but not in Hospio360 after a minute.
