# QA script · Card payments at the POS: the screen follows the payment (staging)

## Purpose

When the desk sends a card payment to the POS, the screen asks **our backend** for the payment's status every 4 seconds.
It never contacts the POS provider itself. It switches to ✓ **Approved** or ✗ **Declined** as soon as the backend knows.
After 3 minutes with no answer, the spinner stops: "Still waiting for the POS", with **Check again** and **Continue to
receipt**.

Behind it:

- the POS provider tells our backend the result (a webhook);
- if that is late or lost, the backend asks the provider itself every 30 seconds, for up to 30 minutes.

**On staging no real POS is connected** (`POS_PROVIDER=logging`): nothing answers by itself. Moniepoint and OPay are
placeholders for now: choosing them refuses card payments with "… POS is not connected yet".

## Links

- Hotel app: https://web-staging.hospio360.com
- How it works: hospio-backend `docs/payments.md`

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Front office | `victor@royalsuites.ng` |

## 1. Waiting, then "Still waiting for the POS"

1. Front office → a guest's folio or **Take a payment** → **Card** → send ₦100 to the terminal.
2. "Sent to the POS": the spinner turns, the text says it is checking with the POS every few seconds, and **Continue to
   receipt** is available.
3. Leave it open for 3 minutes. The spinner stops, a clock shows, and the title says **Still waiting for the POS**, with
   **Check again** and **Continue to receipt**.
4. **Check again**: it goes back to checking for another 3 minutes.

## 2. The answer arrives (ask the developer to play the provider)

While a payment is on "Sent to the POS", the developer posts the provider's answer to staging:

- **Declined:** within about 4 seconds the screen shows ✗ "The bank declined this card". Nothing is charged.
- **Approved** (only on a test folio): within about 4 seconds the screen shows ✓ "₦… approved", and the folio shows the
  payment.

## 3. Moniepoint / OPay placeholders (developer only)

With `POS_PROVIDER=moniepoint` (or `opay`) on a test environment, a card payment shows "Moniepoint POS is not connected
yet. Take cash or a bank transfer for now." The terminal stays online in Payments → Terminals.

## What to report

- The spinner going for more than 3 minutes.
- An approved or declined payment that the screen doesn't show within a few seconds.
- Any request from the browser to a provider's address (open the browser's network tab; every call should go to
  `web-staging` or `api-staging`).
