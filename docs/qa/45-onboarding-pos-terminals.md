# QA script · Onboarding → Connections: POS terminals (staging)

## Purpose

The admin onboarding's terminal form matches how terminals work today: Moniepoint or OPay (plus a test terminal that moves no
money), the right reference for each device, the desk the terminal serves, and whether the hotel's keys for that provider are saved.

## Steps (admin portal → Onboarding → a business → Connections)

1. Provider offers **Moniepoint**, **OPay** and **Test terminal**. There is no Paystack terminal.
2. The terminal reference placeholder and hint change with the provider: Moniepoint serial (e.g. C5BP008D071J7555), OPay device SN
   (e.g. S6805370059963).
3. **Desk** offers Front office, Bar, Kitchen & restaurant, Laundry or No desk yet (default Front office). Add a terminal: the list
   shows "· Moniepoint · <serial> · Front office".
4. In the hotel app (manager → Payments → Terminals) the terminal is already given to that desk; a card payment from that desk goes to
   it.
5. As a Super admin or Finance admin: with Moniepoint chosen, a green line says the hotel's Moniepoint keys are saved, or an amber line
   says they aren't yet, with a link to the hotel's POS & Hospio fees. Support (no access to keys) sees neither line.
6. Name or reference empty: Add terminal stays disabled.

## What to report

- A terminal added here that isn't on its desk in the hotel app.
- A provider in the list that payments can't go through.
