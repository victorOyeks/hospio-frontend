# QA script · SMS only for sign-in codes (staging)

## Purpose

SMS now carries one thing: the **phone verification code**. Codes go through Termii (DND route, sender ID Hospio360)
once Termii is switched on; until then they go through Infobip as before.

Every other message goes by **WhatsApp or email only**, never by SMS:

- bookings and receipts;
- folios and statements;
- guest messages and staff notices;
- invites, temporary passwords and purchase orders.

A WhatsApp that can't go (for example, its template is still in review) is no longer swapped for an SMS. It is recorded as
not sent, with the reason.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Front office | `godwin@royalsuites.ng` |
| Platform admin | see `00-README.md` |

## Before you start

Staging only texts **09035911994**. Use the guest **Victor SMS Check** (that number, no email) for anything that would
text.

## 1. The phone code still comes by SMS

1. Sign up a new account with your own email and the allow-listed number (or use **Verify phone** on an account with that
   number).
2. **Check your phone** sends the code by SMS. It arrives as one page: "Your Hospio360 code is …".
3. Enter it: the phone is verified.

## 2. Nothing offers SMS any more

Check each of these. None should offer SMS, show "SMS · coming soon", or say a message will "go as an SMS":

- **Take a payment:** the receipt choices are Email, Print and WhatsApp.
- **Hotel setup → Payments:** the default receipt choices. **Hotel setup → POS:** the default receipt channel.
- **Message a guest**, and the guest inbox's channel filter and reply box.
- **Hotel setup → Guest messages:** prices and usage show email and WhatsApp only.
- **Invite staff** (owner, manager, onboarding): the hint says invites go by email.
- **Suppliers:** purchase orders are emailed.
- **Profile → Notifications:** no SMS column. 2-step uses the authenticator app.
- **Admin portal → Guest messages:** no SMS price.
- **Admin portal → Settings → Integrations:** "SMS (sign-in codes only, Termii)".

## 3. Messages that used to fall back to SMS

1. Make a booking for **Victor SMS Check**.
   - If the WhatsApp booking templates are approved, the WhatsApp arrives.
   - If they're still in review, **nothing** arrives by SMS. That's expected; before this change an SMS came.
2. Take a cash payment for Victor SMS Check: the receipt goes by WhatsApp, or not at all while its template is in review,
   and **never by SMS**.
3. Reset the password of an account of your own (never a shared one). The temporary password comes **by email only**.

## Clean up

- Cancel the test booking.

## What to report

- Any SMS that isn't a sign-in code.
- Any screen that still offers SMS or says something will "go as an SMS".
- A phone code that doesn't arrive while other SMS tests on the same number do.
