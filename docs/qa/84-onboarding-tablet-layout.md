# QA script · Onboarding wizards on a tablet (staging)

## Purpose

The owner tested the hotel self-serve onboarding wizard on a tablet: **Save and finish later** and the Back / Continue
footer were badly arranged. On a portrait tablet (768–834 px) the five step names in the top bar took the whole width, so
"Save and finish later" was squeezed into a 34 px column of one word per line that ran off the right edge (the page also
scrolled sideways at 768 and 810 px). This is now fixed in both wizards, with the same layout and colours as before:

- **Hotel wizard:** below 1280 px the step bar has its own row under the logo (short names: Business, Hotel, Rooms, Manager,
  All set; on a phone only the open step shows its name), so **Save and finish later** stays on one line at the top right.
  Step footers: on a tablet Back is on the left with the note, then Skip and the main button on the right; on a phone the
  note comes first, the main button is full width, and Back and Skip share the last row. Every button is at least 44 px tall.
  On a phone, form fields stack in one column, the rooms table becomes one small card per room type with its own labels,
  and "What needs your OK" no longer squeezes its text.
- **Admin wizard (Onboarding → a business):** below 1024 px the 10-step list (which pushed the form about 570 px down) is one
  row of steps that scrolls sideways, with the open step scrolled into view. The footer note has its own line; Back is on
  the left, and the extra buttons and the main button stay together on the right (the main button ends the last line
  when they wrap). On a phone the main button is full width on top. Step 9's **Guest messages · opt in?** shows each
  location as a card when the table doesn't fit, so **Prices** and **Put on hold…** are no longer hidden off the right
  edge (the same cards show in the hotel drawer).

Nothing else changed: no new data and no new rules.

## Links and accounts

- Hotel app: https://web-staging.hospio360.com · Admin: https://admin-staging.hospio360.com
- Hotel wizard: sign up a new owner (`qa.<you>.<n>@hospio-qa.test`, a made-up phone number; staging accepts code `159753`),
  or sign in as the test owner `qa-tablet-2011@hospio-qa.test` / `Hospio123!` (business **QA Tablet Layout Hotels**).
- Admin wizard: Support `kola@hospio360.com` / `Hospio123!`. Use a QA business (e.g. **QA UI Abuja Palms betjb**); only
  look at the steps, don't save them.

Test on a real tablet in portrait and landscape, or in the browser's device mode at **768×1024, 810×1080, 820×1180,
834×1194, 1024×768, 1180×820, 1194×834**, then **390×844** (phone) and **1440×900** (desktop).

## 1 · Hotel wizard: top bar

1. **Do:** open Step 1 (Your business) at 768×1024. **Expect:** the logo on the left and **Save and finish later** on the
   right, on one line; under it a row with ① Business — ② Hotel — ③ Rooms — ④ Manager — ⑤ All set. No sideways scrolling.
2. **Do:** the same at every tablet size, portrait and landscape. **Expect:** the same; nothing overlaps or is cut off.
3. **Do:** 1440×900. **Expect:** as before: the step bar with full names sits in the top bar between the logo and Save and
   finish later.
4. **Do:** 390×844. **Expect:** the step row shows the numbers (done steps ticked) and only the open step's name.
5. **Do:** tap a finished step in the row. **Expect:** that step opens. Tap **Save and finish later**. **Expect:** as before:
   saved, signed out, the sign-in page says the setup was saved.

## 2 · Hotel wizard: footers on every step

1. **Do:** go through Steps 1–4 and All set at 768×1024 and 1024×768. **Expect:** Back on the left, the grey note next to it
   (two lines at most), **Skip for now** (Step 4) and the main button on the right, all on one row; buttons at least 44 px tall.
2. **Do:** the same at 390×844. **Expect:** the note, then the main button the full width of the card, then Back on the left
   and Skip for now on the right. Nothing wraps one word per line.
3. **Do:** tap into a field near the bottom of a step on a tablet so the keyboard opens. **Expect:** the page scrolls; the
   footer is not stuck behind the keyboard (nothing in the wizard is pinned to the bottom).

## 3 · Hotel wizard: forms on a phone and tablet

1. **Step 2** at 390×844: fields one per row; Check-in from and Check-out by side by side, with the times readable.
2. **Step 3** at 390×844: each room type is a small card: Room type with the bin on the right, then Guests and How many,
   then Price / night and First room no., each with a label. At 768 px and wider, the usual table with column headings.
3. **Step 4** at 390×844: "What needs your OK" with "Change later in … → Approval limits" under it, not squeezed.
4. A lounge, bar or restaurant business (Step 3 is Outlets) at 390×844: name, kind and the bin fit on one row.

## 4 · Admin wizard

1. **Do:** open a QA business's onboarding at 768×1024. **Expect:** under the title a single row of steps that scrolls
   sideways, with the open step (highlighted) in view; the form starts right under it. At 1024 px and wider, the
   list on the left as before.
2. **Do:** tap a step in the row. **Expect:** it opens and scrolls into view in the row.
3. **Do:** Step 6 (Hotel setup) at 768×1024. **Expect:** the note on its own line above the buttons; Back on the left;
   **Continue without re-applying** and **Apply to … and continue** together on the right.
4. **Do:** Step 10 (Logins & handover) at 768×1024. **Expect:** Back on the left; Preview handover pack and Copy passwords on
   the right, and **Send handover** under them on the right (not alone on the left).
5. **Do:** Step 9 (Go-live checklist) at 768×1024 and 1024×768. **Expect:** Guest messages · opt in? shows each location as a
   card: name and status, the WhatsApp and Email switches, prices, this month, unpaid, and **Prices** (and Put on hold… when
   subscribed). At 1440×900 the table as before, with Prices visible.
6. **Do:** every step at 390×844. **Expect:** no sideways scrolling of the page; the main button full width on top, Back
   under it; Step 8's device payment choices one per row.

## Known limits

- The grey **API** badge (staging only) floats bottom-right and can sit over part of a card; it is not on production.
