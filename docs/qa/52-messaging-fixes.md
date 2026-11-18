# QA script · Messaging fixes from the 18 Nov audit (staging)

## Purpose

Re-test the five fixes that came out of QA 51 (email, WhatsApp and SMS audit):

1. **WhatsApp only where an approved template exists.** The stay summary, folio, typed guest messages and staff messages have
   no WhatsApp template, so the app no longer offers WhatsApp for them and the backend never queues one (it is recorded
   *Skipped*, not *Failed*). Check-out asks for the stay summary by email only. Receipts really do go on WhatsApp to a guest
   with a phone and no email, and the screens now say so.
2. **No codes in the logs.** identity-service no longer writes the phone verification code to its log.
3. **Business and hotel emails must be addresses.** My business (and every other place a business or hotel email is saved)
   refuses "0000000", "wuse@", "info@hotel" with a sentence.
4. **Delivery tracking.** Brevo's webhook moves an email to *Delivered* or *Failed* (bounce, block); Termii's reports work once
   its secret key is set; the admin portal's Connection checks show each channel's last outcome.
5. **Owner acceptance tells people.** When an owner accepts the handover, the account manager and every super admin get it in
   their bell, and the owner gets a short welcome email.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com → Integrations → Connection checks; Notifications
- Contract: hospio-backend `docs/sms-whatsapp.md` ("Which messages can go on WhatsApp"), `docs/email.md` ("Delivery
  tracking"), `docs/integrations.md`, `docs/onboarding.md` (`/handover/accept`)

## Accounts

| Who | Email | Notes |
|---|---|---|
| Super admin | amoria@hospio360.com | Integrations, Connection checks, Notifications |
| Support | kola@hospio360.com | Account manager of the QA business in step 5 |
| QA owner B | qa.ownerb.fcekd@hospio-qa.test | QA B Ikoyi fcekd (rooms, cash allowed) |

Password `Hospio123!`. Emails only to `…@hospio-qa.test`. WhatsApp and SMS only to **09035911994** (the staging allow-list);
at most one SMS. Don't change the shared accounts' roles, passwords or 2-step; don't touch "Patio Lounge".

## 1. Check-out sends no WhatsApp stay summary

1. As QA owner B at QA B Ikoyi fcekd, make a walk-in booking for today for a guest with a made-up phone (0800 000 0004) and
   **no email**; check in.
2. Check out. The check-out goes through; nothing about WhatsApp is offered.
3. (Admin) Messaging deliveries / database: no WhatsApp (and no *Failed* row) for that guest's phone after the check-out.
   Before the fix every check-out recorded a failed "Stay summary" WhatsApp.
4. Folios → that folio → **Print or email the folio**: only *Print / copy* and *Email* (no greyed "WhatsApp · Coming soon").
5. Bookings → Message guest, and Messages → New message: *Send by* shows **Email** only; for a guest without an email the
   note says a typed message can't go on WhatsApp (approved templates only). Staff messages show no "WhatsApp copy" switch.

## 2. A receipt still goes on WhatsApp

1. Hotel setup → Guest messages **On** for QA B Ikoyi (turn it back Off at the end).
2. Take a cash payment for a guest with name and phone **09035911994** and no email. On the receipt step the **WhatsApp**
   choice is enabled ("Sent to … with the receipt template"); pick it → **Send on WhatsApp & record**.
3. The toast says "Receipt sent on WhatsApp to 09035911994". The delivery record is WHATSAPP, kind RECEIPT, template
   `hospio_payment_receipt_v2`, then `SENT` (`whatsapp:<id>`); Infobip's report turns it `FAILED` "Account issue
   (EC_ACCOUNT_ISSUE)" until Infobip clears the account (expected, the send side works).
4. Payments → the payment → **Send receipt again** says "Receipt sent on WhatsApp to …" for a phone-only guest. Nowhere says
   "WhatsApp receipts are coming soon".

## 3. No phone code in the logs

1. Send one phone code (Check your phone, or `POST /identity/auth/phone/send-code`) to the account that owns 09035911994.
2. On the server: `journalctl -u hospio-identity-service | grep "Phone verification"` shows "Phone verification code issued for
   user <id> by SMS (valid until …)" and **no code**.

## 4. My business refuses an email that is not an address

1. As an owner, My business → Email `0000000` → Save: **"Business email must be a valid email, like name@hotel.com"**, nothing
   saved. Same for `wuse@` and `info@hotel`. Hotels → edit a hotel's email: the same rule ("Hotel email must be …").
2. Data: on staging the business "0000" (email `0000`), the hotel "000000" (`wuse@`) and THEWISEMAN's hotel "thewiseman"
   (`0000000`) now have no email (set to empty on 18 Nov, nothing invented).

## 5. Delivery tracking and Connection checks

1. (Admin) Settings · Integrations → Brevo: **Webhook key** is set (masked). Brevo → Transactional → Settings → Webhook lists
   `https://api-staging.hospio360.com/messaging/webhooks/brevo`.
2. Add a staff member with a new `qa.msgfix.<n>@hospio-qa.test` email. Within a few minutes its emails go from `SENT` to
   `FAILED` "Bounced (soft): … hospio-qa.test" (the domain has no mail server) — the bounce came from Brevo's webhook.
3. A post to the webhook without the key (or a wrong one) is **401** and changes nothing.
4. Integrations → **Connection checks**: WhatsApp says "Last message: failed … ago — … Account issue (EC_ACCOUNT_ISSUE)" with
   the 7-day counts and is **error** while the newest three failed; Email shows its last result and bounce rate; SMS shows the
   last code and, until Termii's secret key is saved, "Termii's delivery reports aren't believed until its secret key is set".
   Running the checks sends nothing.

## 6. Owner acceptance

1. (Admin) Create a business with owner `qa.msgfix.owner.<n>@hospio-qa.test`, account manager Kola, finish onboarding, send
   the handover.
2. The owner signs in, sets a password and **accepts the handover**: the business is Live.
3. Amoria's and Kola's **Notifications** show "<business> accepted the handover" (opens the business). The owner gets
   **Welcome to Hospio360 · <business> is live** by email (no SMS, no WhatsApp). Accepting again sends nothing more.

## Expected results

- No WhatsApp is ever queued or failed for a stay summary, folio, typed message or staff message; receipts and booking
  messages still go as their `_v2` templates.
- No code, temporary password or token in any service log.
- No business or hotel email that isn't an address can be saved.
- Brevo bounces and deliveries reach the delivery log; Connection checks show the last outcomes and stay read-only.
- An accepted handover reaches the account manager, the super admins and the owner (email only).
