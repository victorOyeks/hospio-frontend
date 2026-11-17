# QA script · Why a POS payment was declined (staging)

## Purpose

When the POS declines a card or transfer, the desk sees the reason the provider gave, such as "Insufficient funds" or
"Incorrect PIN". It shows on the take-payment screen and in My payments. The backend now asks the provider about waiting
payments every 15 seconds (it used to be 30), and logs every call it makes to Moniepoint and OPay.

## Links

- Hotel app: https://web-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`. Bar `segun@royalsuites.ng` (or any desk with a Moniepoint or OPay terminal);
front office `victor@royalsuites.ng`.

## 1. A decline shows its reason

1. Take a small payment (₦100) with **Card on the POS**. On the terminal, use a card with too little money on it, or cancel.
2. Within about 15 seconds the screen turns red: **The payment was declined**.
3. Under it, a red box reads **Reason: Insufficient funds** (or whatever the provider said: Incorrect PIN, Expired card,
   Cancelled on the POS, Timed out on the POS).
4. The note still says nothing was charged and offers **Try again on POS** or cash.

## 2. My payments

1. Open **My payments**. The declined payment shows **Declined** with the reason in small red text under it.
2. Open it. The detail list has a **Reason** row.
3. A declined or unanswered **transfer** also has **Try again on POS** (it used to be card only).

## 2b. Payments pages (front desk, manager, owner)

1. **Payments** (front desk) and the manager's Payments list show the reason under **Declined**.
2. Open the payment: a red note reads "Declined: Insufficient funds. Nothing was taken from the guest", and the detail list has a
   **Reason** row. The owner's payment detail has the Reason row too.

## 3. The provider refuses the request

1. Assign a terminal with a wrong serial and take a payment on it.
2. The screen says the payment didn't go through, and the reason reads "Moniepoint refused the payment: …" in Moniepoint's
   words. The terminal is not marked offline.

## 4. Which POS it went to

1. Take a card or transfer payment. The terminal picker starts on the POS assigned to your desk (front office, bar, …).
2. Pick a different terminal and send. The screen reads **₦… sent to <that terminal's name>**, the panel title **Sent to
   <name>**, and a line under it **POS: <name> · serial <serial>**.
3. That terminal (and only that one) rings. Before this fix the picker was ignored and the desk's assigned POS was used.
4. My payments → the payment's **Terminal** row shows the terminal's name, not an id.
5. **Try again on POS** goes to the same terminal as the first attempt.

## 5. Logs (developer)

1. On the VPS, `journalctl -u hospio-payment-service -f | grep -E "Moniepoint|OPay"` while a payment is taken.
2. Each push shows a `->` line (terminal, amount in kobo, reference) and a `<-` line (HTTP status, time, answer). Each status
   check every 15 seconds shows the status, code and message. No API key appears.

## What to report

- A decline with no reason when the terminal showed one.
- A reason that disagrees with what the terminal printed.
- A waiting payment that takes much longer than 15–30 seconds to settle after the terminal answers.
- Any key or secret in the logs.
- A payment that rang a different POS from the one named on screen.
