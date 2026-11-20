# QA script · Admin onboarding: required fields (staging)

## Purpose

Sam's report (21 Nov 2026): the back-office onboarding wizard (admin console → Onboarding → a business) let you continue
without key details. Now each required field shows a message under it, turns red, the page scrolls to the first one and puts
the cursor in it, and **Save and continue** does nothing until it is filled. The API refuses the same (400 with a sentence),
so a step can't be completed another way.

| Step | Required to continue | Optional, but checked when typed |
|---|---|---|
| 1 Business & legal | Trading name, **registered name** (the trading name if not registered yet), **business type**, **head office address**, city, and the business **email or phone** (at least one) | CAC number (RC/BN/IT + digits; "Add it later from the business page") |
| 2 Owner & contacts | Owner's name, email and **phone** (used for sign-in checks and WhatsApp) | Second contact: leave all blank, or give a **name plus a phone or an email** |
| 3 Fee & contract | Fee as before | **Charges start on stays optional by design**: empty = free until a date is set (devices are still billed) |
| 4 Locations | At least one location, and an **address on every location** | Location email and phone |

New: **Save and finish later** on steps 1 and 2 keeps what you typed (only the format of a typed value is checked) without
completing the step, and goes back to the Onboarding board. Step 9 (Go-live checklist) shows **Charges start: not set
(free)** in amber when there is no date. Sending the handover asks for the same details ("Before the handover: …"), so an
older business that skipped them is told what is missing. No existing business is changed.

The hotel app's own sign-up wizard (owner self-serve) already required these fields; it now also checks the format of a typed
RC number.

## Links and accounts

- Admin console: https://admin-staging.hospio360.com
- Support `kola@hospio360.com` / `Hospio123!` (2-step backup code on staging `159753`).
- Create your own QA business for this: **Onboarding → Set up a business for them**, name it `QA Validation <your initials>
  <n>`, owner email `qa.validation.<n>@hospio-qa.test`. Don't use a real business.

## 1 · Step 1 Business & legal

1. **Do:** open your QA business's wizard at step 1. Clear Registered name, leave Business type on "Choose…", clear Head
   office address, Email and Phone. Press **Save and continue**. **Expect:** red messages under Registered name ("Enter the
   registered name"), Business type ("Choose the business type"), Head office address ("Enter the head office address"),
   Email ("Enter the business email or phone (at least one)…") and Phone ("Or enter the business phone"); the boxes have red
   borders; the page scrolls to Registered name with the cursor in it; the footer says "Fix the fields marked in red to
   continue."; you stay on step 1.
2. **Do:** type in Registered name. **Expect:** its message goes at once; the others stay.
3. **Do:** type `ABC123` as the CAC number and press Save and continue. **Expect:** "Enter the CAC number as on the
   certificate, like RC 1873402 or BN 3456789". Clear it. **Expect:** no message: the CAC number is optional (hint "Not
   registered yet? Add it later from the business page").
4. **Do:** type only a phone (`0803 555 0192`) and leave Email empty; fill the rest. **Expect:** Save and continue moves to
   step 2. (Only an email, no phone, works the same.)
5. **Do:** type `hello@` as the email. **Expect:** "Enter a valid email, like name@example.com".

## 2 · Step 2 Owner & contacts

1. **Do:** clear the owner's Phone and press Save and continue. **Expect:** "Enter the owner's phone: it is used for sign-in
   checks and WhatsApp", red, cursor there. `12345` → "Enter a real phone number, like +234 803 555 0192".
2. **Do:** with the owner's phone filled, type only a second-contact Phone. **Expect:** "Enter the contact's name, or clear
   their phone and email" under Full name.
3. **Do:** type only a second-contact Full name. **Expect:** "Enter a phone or an email for this contact, or clear their name"
   under the contact's Phone.
4. **Do:** second contact email `hadiza@`. **Expect:** "Enter a valid email…". Clear all three second-contact fields.
   **Expect:** Save and continue moves on (the second contact is optional).

## 3 · Step 3 Fee & contract

1. **Do:** leave **Charges start on** empty. **Expect:** under it, in amber: "Leave empty to keep this business free until you
   set a date. Devices are still billed." and the green **Free** tag. Save and continue is **not** blocked.

## 4 · Step 4 Locations

1. **Do:** Add a location and leave Address empty. **Expect:** "Enter the address" in red, cursor there; the location is not
   added until it is filled.
2. **Do:** type `bad@` as the location email. **Expect:** "Enter a valid email…". Clear it. **Expect:** fine (optional).
3. **Do (older data):** a location saved before this change with no address shows "Missing · required" in red in the Address
   column, and Save and continue shows "Add an address to <name> to continue: press Edit on it." in red. Edit it, add the
   address. **Expect:** Save and continue works.

## 5 · Go-live checklist and handover

1. **Do:** with Charges start on empty, open step 9. **Expect:** under the checklist, amber: "Charges start: not set (free).
   No platform fee until a date is set; devices are still billed. Set it in Fee & contract." Tapping it opens step 3. With a
   date set it shows "Charges start: <date>" in blue.

## 6 · Save and finish later

1. **Do:** on step 1, clear Registered name and Head office address, change the trading name, press **Save and finish
   later**. **Expect:** "Saved. Pick it up again from Onboarding." and the Onboarding board opens; the business's next action
   says "Finish step 1 · Business & legal". Open it again. **Expect:** the trading name you typed is there; step 1 is not ticked
   in the step list (it is if it was already completed before).
2. **Do:** on step 2, type only a second-contact name and press Save and finish later. **Expect:** saved (no message about a
   phone or email). Bad formats still stop it: `hadiza@` → "Enter a valid email…".
3. **Do:** on the board, change a business's **Next action** and save. **Expect:** saved, even for an older business missing
   some of the new required fields.
