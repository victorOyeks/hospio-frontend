# QA script · Retest: Operating day defects DEF-068 to DEF-075 (staging)

## Purpose

Sam's operating-day run (16 Nov 2026) logged 8 defects. Each was reproduced against the code and fixed, or explained.
Retest each one with the steps below and set its status in the sheet.

| Defect | Test case | Outcome |
|---|---|---|
| DEF-068 | STF-019 | Fixed |
| DEF-069 | TIL-008 | Fixed |
| DEF-070 | TIL-012 | Fixed |
| DEF-071 | TIL-015 | Fixed (all number fields in Hotel setup) |
| DEF-072 | NAU-015 | Fixed |
| DEF-073 | FIN-014 | Fixed |
| DEF-074 | FIN-015 | Fixed |
| DEF-075 | GEN-001 | Not a defect: staging was redeployed about 30 times that day |

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Finance | `femi@royalsuites.ng` |

## DEF-068 · Number of days (Add to the rota)

1. Manager → Staff → All staff → a person's row menu → **Add to the rota**.
2. **Number of days** is empty with the hint "e.g. 5". **Add shifts** stays disabled until a shift and a number are chosen.
3. Type 2, then delete it: "Enter the number of days" shows. Type 20: "Between 1 and 14 days".

## DEF-069 · The note on a short till reaches the manager and finance

1. Front office: open a till, then **Count & close** it ₦500 short with a note, e.g. "Gave change twice by mistake".
2. Manager → **Financials**, till table: under "₦500 short" the note shows in quotes.
3. Finance (Femi) → **Tills**: the closed till shows "short ₦500" and the note under it.
4. Both the manager and Femi get a bell notification: "Till short ₦500 · front office", with the expected and counted
   amounts, who closed it and the note. The manager's notification opens Financials; Femi's opens Tills.

## DEF-070 · Pay out needs a real reason

1. Front office → Till → **Pay in / out** → Pay out with an amount.
2. A reason of "1234567-0-=-" or "x": the field says "Say what the cash was for, in words" and **Pay out** stays
   disabled. "Diesel 20L" works.
3. The same rule applies to the "What happened" note when closing a till short or over.

## DEF-071 · Hotel setup number fields start empty

1. Manager → Hotel setup → **Money & payments**: **Deposit to hold a booking** and **Default till float** are empty with
   the hint "None". Nothing has to be deleted before typing.
2. Type a value, save and reload: it stays. Clear it, save and reload: empty again (saved as none).
3. Every other number field in Hotel setup with a "none" default behaves the same.

## DEF-072 · Finance is told when the day is closed

1. Manager closes the day (Night audit).
2. Femi's bell shows "Day closed · <date>" with the revenue and who closed it; it opens Femi's Night audit.

## DEF-073 / DEF-074 · Organization staff

1. Manager → Organizations → an account → **Staff** → **Add staff**.
2. "0000" as the name: "Enter the person's full name". "0000" or "0000 000 0000" as the phone: "Enter a real phone
   number". "ada@" as the email: "Enter a real email address". **Add** stays disabled.
3. Add Ada with 0803 555 0192. Add another person with 0803 555 0192, or +234 803 555 0192: refused with "… is already
   on this account for Ada …". The same email in another case is refused too.
4. **Import staff** with two rows sharing one phone: "Row 2: … is already on this account for …", and nobody is added.

## DEF-075 · Reload message

Not a defect. The message appears only when a new version has been deployed since the page was loaded, or when the
session has expired. On 16 Nov staging was redeployed about 30 times, so it kept appearing. Retest on a day with no
deploys: use the app for 10 minutes and no message appears. After a deploy it shows once, and **Reload** clears it.
