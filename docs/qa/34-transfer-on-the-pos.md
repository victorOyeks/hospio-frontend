# QA script · Bank transfer goes to the POS (staging)

## Purpose

Card and bank transfer both go to the POS. The POS asks the guest how they want to pay: card, or a transfer to the account the
terminal shows. The payment is approved when the POS confirms it. Only cash is recorded at the desk.

## Links

- Hotel app: https://web-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`. Bar `segun@royalsuites.ng` (or any desk with a POS assigned); front office
`victor@royalsuites.ng`.

## 1. Transfer on the POS

1. Take a payment anywhere: a bar sale, Record payment on a booking, or check-out. Choose **Bank transfer on the POS**.
2. Its hint reads "Sent to the POS · the guest chooses transfer there and pays to the account it shows". A **Terminal** picker
   appears, as for card.
3. The button reads **Send to POS** (no "Show transfer details" any more). Tap it.
4. The screen waits for the POS. The note says the guest chooses transfer on the POS. With a real terminal, the guest picks
   transfer and pays.
5. When the POS confirms, it shows approved. The payment is in My payments as **Transfer**, and the folio balance drops.
6. A desk with no terminal: card and transfer say the hotel has no terminal linked; take cash.

## 2. Card and cash are unchanged

1. **Card on the POS** → Send to POS: it works as before.
2. **Cash** → Count cash → Cash received: approved at once, into the till.

## 3. Try again

1. A transfer the POS declined or didn't answer: **Try again on POS** sends a new transfer request. It stays a transfer, not a
   card.

## What to report

- "Show transfer details" or a hotel bank account on screen anywhere.
- A transfer approved before the POS confirmed it.
- A transfer recorded as Card (or the other way round).
