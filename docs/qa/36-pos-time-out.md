# QA script · POS payments time out after 5 minutes (staging)

## Purpose

A card or transfer sent to the POS that gets no final answer (approved or declined) within 5 minutes is marked **Timed out**.
The provider is still asked about it for 30 minutes, so if the guest did pay, it turns **Approved** on its own.

## Links

- Hotel app: https://web-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`. Front office `segun@...` as used for POS tests, or any desk with a terminal.

## 1. A payment nobody finishes times out

1. Take a payment with **Card on the POS** and do nothing on the terminal (or send to a test terminal with no device).
2. After 3 minutes the screen shows "still waiting". At about 5 minutes (within 15 seconds of it), the screen changes to
   **<POS name> timed out**, with a note to check the terminal.
3. **Payments** and **My payments** show the payment as **Timed out** (amber), not Processing. The detail has a note and
   the reason "Timed out: no final answer from the POS within 5 minutes".
4. **Try again on POS** / **Retry on POS** and **Check with provider** are offered on it.

## 2. Old stuck payments

1. The three 12:46, 12:47 and 12:59 payments on 17 Nov (sent to the dummy Front desk POS) show **Timed out** within a
   minute of the deploy. The "waiting" count drops.

## 3. A late approval still counts

1. Send a payment, let it time out, then complete it on the terminal within 30 minutes (if the terminal still allows it).
2. Within about 15 seconds it turns **Approved** and posts to the folio.

## What to report

- A payment still Processing more than 6 minutes after it was sent.
- A payment that timed out while the guest was still paying normally (tell us how long it took).
- A paid payment that stayed Timed out.
