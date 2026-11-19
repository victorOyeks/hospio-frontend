# QA script · Fee debit removed, compact Integrations page (staging)

## Purpose

Hospio360 no longer takes its fee by debiting a hotel's Moniepoint or OPay account. Since 18 Nov 2026 every business gets **one
monthly invoice**, paid through Paystack (script 63). On 19 Nov 2026 everything left over from the old debit was **removed**:

- the admin portal's **Integrations** page no longer has the **"Fee debit (no longer used)"** section or its two cards
  (**Daily fee debit: OPay** with Debit on, Hospio360 account, Account name, Bank code, Payout type; **Daily fee debit:
  Moniepoint** with Debit API address);
- the server code behind it (the debit itself, its settings, its server variables) and any values saved for those cards.

**What stays:** the daily fee is still worked out for every day (owner's **Hospio fees**, admin **Fees & billing → Daily fees**),
the monthly invoice, the restriction when an invoice isn't paid, devices on the invoice, and the **Moniepoint POS / OPay POS**
cards (card terminals for guest payments).

The Integrations page is also **more compact** (the owner asked for less empty space):

- each provider is a short card: name, **Saved in the portal** / **Using the server's setting**, when it last changed, and
  **Test connection** and **Edit** on one row;
- **Edit** opens the provider's fields, with **Save** on the same row; rarely changed fields (addresses, webhook keys) and
  **Use the server's value** are under **Advanced**;
- from 1280 px wide the groups sit in two columns (Email · Messaging | Payments · POS); narrower, one column;
- Paystack is now labelled **Paystack (monthly invoice payments)**: owners pay their monthly Hospio360 invoice through it.

Contract: hospio-backend `docs/integrations.md` and `docs/plan-daily-fees.md` (the 19 Nov note).

## Links

- Admin portal: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com

## Accounts

| Who | Email | Password |
|---|---|---|
| Hospio360 super admin | amoria@hospio360.com | `Hospio123!` |
| Support or finance admin (any you have) | as given to you | `Hospio123!` |
| Owner with invoices (QA debit-rate business) | qa.debitrate.rrydw@hospio-qa.test | `Hospio123!` |

Do not save, clear or change any key on Integrations: the staging keys are real. **Test connection** is safe (it reads only;
nothing is sent or charged). Nothing in this script sends an SMS, WhatsApp or email, or takes a payment.

## 1 · Integrations: no fee debit

1. **Do:** sign in as the super admin → **Platform → Integrations**. **Expect:** four groups: **Email** (Brevo, SMTP),
   **Messaging** (Infobip, Termii), **Payments** (Paystack (monthly invoice payments)), **POS** (Moniepoint POS, OPay POS).
   No "Fee debit" group, no "Daily fee debit" card, no "Debit on", "Hospio360 account", "Bank code", "Payout type" or "Debit API
   address" anywhere on the page.
2. **Do:** read the Payments group. **Expect:** subtitle "Paystack: owners pay their monthly Hospio360 invoice online (card,
   transfer or USSD)". The POS subtitle says the terminals are for guest payments.
3. **Do:** press Ctrl/Cmd+F and search the page for "debit". **Expect:** no match.

## 2 · Compact cards

1. **Do:** look at the cards without clicking anything. **Expect:** every card is short: name, a status pill, "Changed … by …" (or
   "Never changed in the portal"), and a row with **Test connection** and **Edit**. No form fields are open.
2. **Do:** on a computer screen 1280 px or wider, look at the layout. **Expect:** two columns, Email and Messaging on the left,
   Payments and POS on the right; no large empty area beside or under a card. **Connection checks** runs full width underneath.
3. **Do:** make the window narrower (about 1024 px, then tablet width ~820 px). **Expect:** one column in the order Email,
   Messaging, Payments, POS; nothing runs off the right edge; no sideways scrolling.
4. **Do:** **Edit** on **Infobip**. **Expect:** the card opens: Infobip's API key, WhatsApp sender, SMS sender ID and the SMS on /
   WhatsApp on switches, then an **Advanced** row naming "base url, delivery report address, webhook key". **Save** (greyed until
   something changes) sits on the same row as Test connection and **Close**.
5. **Do:** open **Advanced**. **Expect:** Base URL, Delivery report address and Webhook key; under "Go back to the server's own
   setting for a saved field" each field saved in the portal with **Use the server's value**. **Do not tap it.** Tap **Close**.
6. **Do:** **Edit** on **Moniepoint POS**. **Expect:** its one field (API address) shows straight away, with no Advanced row.
7. **Do:** **Edit** on **Brevo**. **Expect:** its fields, Advanced (webhook key) and the **Send a test email** box. Don't send.
8. **Do:** type something in one field of any card, then **Close**. **Expect:** the card shows "Unsaved changes" with **Discard**
   and **Save**. Tap **Discard**: the note goes. (Don't save.)

## 3 · Test connection and Connection checks

1. **Do:** **Test connection** on Brevo, SMTP, Infobip, Termii, Paystack, Moniepoint POS and OPay POS (with the cards closed).
   **Expect:** each answers in plain words under the card (green or red) without opening it. Nothing is sent or charged.
2. **Do:** scroll to **Connection checks** → **Run checks again**. **Expect:** database, Kafka, POS provider, WhatsApp, email and
   SMS rows load with a status and "checked … by …". No row mentions a fee debit.
3. **Do:** sign in as a support or finance admin. **Expect:** Integrations isn't in their menu (super admin only), as before.

## 4 · The daily fee and the monthly invoice still work

1. **Do:** as the super admin → **Fees & billing → Daily fees**. **Expect:** days listed with their sales, rate and fee; no debit
   columns, no "Run debit". **Work out yesterday** still works (days already worked out are left alone).
2. **Do:** **Locations** (or **Payments & POS**) → open a hotel → its POS & Hospio fees panel. **Expect:** POS keys and the
   latest fee day show; nothing about a debit provider or "Automatic debit".
3. **Do:** sign in as the QA debit-rate owner (hotel app) → **Hospio fees** and **Billing & invoices**. **Expect:** this month's
   days and the monthly invoices (HIN-…) as before; **Pay now** is there on an unpaid invoice. **Do not pay.**

## Negative and wrong-role checks

- A super admin opening `https://admin-staging.hospio360.com/dashboard/integrations` after a deploy sees no fee-debit card even
  after **Reload**.
- A hotel user (owner/manager) can't open the admin portal's Integrations at all.

## What is a bug

- Any "fee debit", "Debit on", "Payout type" or "Debit API address" on the admin portal.
- A Test connection or a Connection check that errored before this change and now fails differently, or any that now errors.
- A card that opens with all fields by itself, a big empty area next to a card on a wide screen, or sideways scrolling at 820 px.
- Daily fees, the owner's Hospio fees or the monthly invoices missing or changed.
