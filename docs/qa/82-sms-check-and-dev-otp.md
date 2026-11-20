# QA script · SMS codes and the fixed staging code 159753 (staging)

## Purpose

1. **"SMS is not going through" (20 Nov 2026).** Checked end to end. Termii works: the balance is ₦2,779, the sender ID
   **OE Alert** is active, codes go on the DND route, and a code sent to 09035911994 today was delivered to the handset in
   about 2 seconds (Termii's delivery report came back DELIVERED). The codes that never arrived today were sign-ups with other
   numbers. Staging only texts **09035911994** (the allow-list), so every other number is "Held back" on purpose and nothing
   is sent. Production has no allow-list.
2. **One fixed code on staging.** Every one-time code on staging is now **159753**, and it is always accepted:
   - the phone code after sign-up (and **Verify phone**). It is still sent by SMS (or WhatsApp) with 159753 in it, so delivery
     can still be tested on 09035911994. On any other number nothing arrives; just type 159753;
   - the 2-step sign-in code, and the code asked when turning 2-step on or off or getting new recovery codes (it stands in for
     the authenticator app's code). Recovery codes still work as before.
   - `123456` no longer works.
   The forgotten-password link and a manager's **Reset PIN** have no code, so they are unchanged. The fixed code is never
   on production: the service refuses to start if it is set there.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Don't change the shared accounts (tunde, godwin, segun, mariam and the others listed in the README). Use a new or QA account.

| Who | Email | Password |
|---|---|---|
| Owner, phone 09035911994 (phone already confirmed on 20 Nov) | qa.terms.self.q5mec@hospio-qa.test | `Hospio123!` |
| A new sign-up of your own | `<anything>@hospio-qa.test` | your choice |

## Before you start

- Texts on staging go **only** to 09035911994. Use that number when you want to see the SMS arrive; use any other number to
  check that 159753 works without an SMS.
- Keep SMS tests to a few: each one is a real, paid text.

## 1 · Phone code after sign-up (number not on the allow-list)

1. **Do:** sign up a new business with a `@hospio-qa.test` email and a phone number that is **not** 09035911994.
   **Expect:** "Check your phone" opens with "We sent a 6-digit code to …". The blue box says "Every code on staging is
   159753". No SMS arrives (this number is held back on staging).
2. **Do:** type **111111**.
   **Expect:** "That code is wrong. 4 tries left". The boxes clear.
3. **Do:** type **159753**.
   **Expect:** "Phone confirmed" and the setup wizard continues.

## 2 · Phone code to the allow-listed number (one real SMS)

1. **Do:** sign up another new business with a `@hospio-qa.test` email and **09035911994**.
   **Expect:** the phone gets one SMS from **OE Alert** within seconds: "Your Hospio360 verification code is 159753. This code
   expires in 10 minutes. Do not share with anyone."
2. **Do:** type **159753**.
   **Expect:** "Phone confirmed".
3. **Do:** press **Send again** before the minute is up.
   **Expect:** nothing is sent; the page counts down ("Send again in 0:4x").

## 3 · 2-step sign-in with 159753

1. **Do:** sign in with your new account from section 1 → **My profile & security** → **Security** → **Turn on 2-step**. Skip
   the QR code and type **159753** as the first code.
   **Expect:** 2-step is on and 10 recovery codes are shown.
2. **Do:** sign out, then sign in with the email and password.
   **Expect:** the **2-step sign-in** step asks for a code.
3. **Do:** type **000000**.
   **Expect:** "That code is wrong" and you stay on the step.
4. **Do:** type **159753**.
   **Expect:** you are signed in.
5. **Do:** sign out and in again with 159753.
   **Expect:** it works again (unlike an app code, it is not used up).
6. **Do:** **Security** → **Turn off 2-step** with your password and **159753**.
   **Expect:** 2-step is off.

## 4 · Admin portal

1. **Do:** sign in to the admin portal as a platform admin → **Settings** → **Integrations** → **SMS**.
   **Expect:** "Termii accepted the key: balance … NGN; Termii is on, sender OE Alert", and the last code reads delivered.

## Clean up

- Turn 2-step off on any account where you turned it on (section 3, step 6).

## What to report

- A phone code to 09035911994 that doesn't arrive within a minute, or that isn't 159753.
- 159753 refused anywhere a code is asked.
- Any code other than 159753 being sent on staging.
