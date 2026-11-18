# QA script · Email, WhatsApp and SMS end to end (staging)

## Purpose

Check that every message Hospio360 sends goes out on the right channel and reaches the provider: email through Brevo,
WhatsApp through Infobip as an approved template, SMS through Termii and only for the phone verification code. Also re-test
the 18 Nov fix: a hotel whose saved email is not a real address ("0000000", "wuse@") no longer loses every email it sends
(invites, temporary passwords, booking emails); the email goes with the business's email, or no Reply-To, instead of failing
"Missing final '@domain'".

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com → Integrations → Connection checks
- Contract: hospio-backend `docs/email.md`, `docs/sms-whatsapp.md`, `docs/guest-message-billing.md`

## Accounts

| Who | Email | Notes |
|---|---|---|
| Super admin | amoria@hospio360.com | Integrations, Connection checks |
| QA owner B | qa.ownerb.fcekd@hospio-qa.test | owner of QA B Ikoyi fcekd and QA B Abuja fcekd (rooms, cash allowed) |

Password `Hospio123!`. Never change the shared accounts' roles, levels, passwords or 2-step. Don't touch "Patio Lounge".

**Who may receive what.** Emails only to new `…@hospio-qa.test` addresses (Brevo takes them and then soft-bounces: the domain
has no mail server; that still proves the send). WhatsApp and SMS only to **09035911994**, the one number on staging's
allow-list (`TEXTS_ALLOW_ONLY`); any other number is recorded "Held back" and nothing leaves. Keep WhatsApp to a handful and
SMS to one code.

## 1. Connection checks

1. As the super admin open **Integrations** and scroll to **Connection checks**. WhatsApp, Email and SMS (sign-in codes only)
   say **connected**: Infobip sender +2348148849797 with 10 of 10 templates approved, Brevo from no-reply@oyeksglobal.com,
   Termii sender ID **OE Alert** on channel dnd. "Only 1 allow-listed number receives texts on this server. Echo off."
2. **Connected means the key works, not that messages arrive.** Step 4 is the real test for WhatsApp.

## 2. Staff emails (free, always sent)

1. As QA owner B, pick QA B Ikoyi fcekd and add a staff member (Front office) with a new `qa.msgaudit.<n>@hospio-qa.test`
   email. Two emails go: **Your Hospio360 temporary password** and **You're invited to Hospio360**.
2. Staff → that person → **Reset password**: **Your Hospio360 password was reset** goes.
3. (Admin) Messaging → Deliveries, or the database: each is `SENT` with a Brevo message id `<…@smtp-relay.mailin.fr>`.
   In Brevo → Transactional → Logs each shows *Sent* then *Soft bounce · Unable to find MX of domain hospio-qa.test*.

## 3. Guest emails (only while Hotel setup → Guest messages is On)

1. Hotel setup → **Guest messages** → turn **On** for QA B Ikoyi. Off, every guest email and WhatsApp is recorded
   "Guest messages are off for this hotel" and not sent; turn it back Off at the end.
2. New walk-in booking for today, guest with a `@hospio-qa.test` email and a made-up phone (08000000003): **Your booking … is
   confirmed** by email; the WhatsApp to the made-up number is "Held back: not on this environment's allow-list".
3. Check in, take cash, check out: **Your receipt** and **Your stay summary** by email.
4. Messages → new message to the guest by Email: the email goes from the hotel's name.

## 4. Guest WhatsApp (to 09035911994 only, 4 messages)

1. Booking a few weeks ahead (not tomorrow: the arrival reminder would fire) for a guest with a `@hospio-qa.test` email and
   phone **09035911994**: email plus WhatsApp **hospio_booking_confirmation_v2** with the banner and **View booking**.
2. Change the dates: email plus **hospio_booking_changed_v2**. Cancel: email plus **hospio_booking_cancelled_v2**.
3. Take a cash payment with no booking, guest name and phone 09035911994 only (no email): WhatsApp
   **hospio_payment_receipt_v2** (no email to send to, so the receipt goes on WhatsApp).
4. The phone receives all four. Each delivery goes `SENT` (`whatsapp:<id>`) and, within a minute, `DELIVERED` from Infobip's
   report. **18 Nov:** all four came back `FAILED` "Message sent not delivered - Account issue (EC_ACCOUNT_ISSUE)" from
   Infobip (error 7011, permanent); the send side worked. Re-run once the Infobip / WhatsApp account issue is cleared.

## 5. SMS: the phone code only

1. Sign up (hotel app → Create account) with a new `@hospio-qa.test` email and phone 09035911994 (the number can belong to one
   account only; free it from an older QA account first). One SMS from **OE Alert**: "Your Hospio360 verification code is
   123456. This code expires in 10 minutes. Do not share with anyone." Word for word, nothing else.
2. Termii → SMS history: *Delivered*, type dnd. The delivery record stays `SENT` (Termii's reports need `TERMII_SECRET_KEY`).
3. Nothing else is ever an SMS: an invite, reset, receipt or statement asked for by SMS is recorded "Not sent: SMS is only used
   for sign-in codes".

## 6. A hotel email that is not an address (the fix)

1. (Database, QA hotel only) set QA B Ikoyi fcekd's email to `0000000`, wait a minute, send the guest an email from Messages.
2. The email goes: `SENT`, Reply-To empty (the business has no email) or the business's email. Before the fix it failed with
   "Missing final '@domain'".
3. Put the hotel's email back (`frontdesk.ikoyi.fcekd@hospio-qa.test`).

## Expected results

- Every email: `SENT` with a Brevo id; Brevo shows it.
- Every WhatsApp: an approved `_v2` template, never free text (the `oyeks_otp` code template is not on the sender, so "Send on WhatsApp instead" stays hidden); to the allow-listed
  number only.
- SMS: only `PHONE_CODE`, through Termii, the exact approved text.
- A hotel with a bad saved email still sends its emails.
