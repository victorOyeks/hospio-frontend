# QA script · Defects DEF-091 to DEF-094: password eye, suspend reason, role counts, owner's Reset PIN (staging)

## Purpose

Retest of four defects from the 19 Nov 2026 sheet:

- **DEF-091** · "Your password" (Change PIN, Turn off 2-step) and every Change password field had no show/hide eye. Every
  password box in the app (hotel and admin) now has the same eye as the sign-in page. PIN boxes stay masked.
- **DEF-092** · Suspend with an empty reason. The person was never suspended (the red message was "Say why … is suspended", a
  refusal), but the button could be pressed and the message read like a success. Now **Suspend** stays greyed out until a reason
  of at least 3 characters is typed, and the service's refusal says "Enter a reason to suspend … They have not been suspended".
- **DEF-093** · Every role card on Roles & permissions showed **0 people**. The web dropped the `roleCounts` part of the request,
  so the service never sent the counts. Each card now shows how many people hold that role at the location picked in the sidebar.
  The owner's Staff screen had the same problem with `staffOnly` and now leaves the owner out of the list.
- **DEF-094** · The owner's Staff screen shows **Reset PIN** and **Remind**. This works as designed: it was added on 10 Nov 2026
  (QA 16 section 4). The "known limit" in QA 06 was out of date and has been changed.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Don't change the shared accounts (tunde, godwin, segun, mariam and the others listed in the README). Use QA accounts for anything
that changes an account.

| Who | Email | Password |
|---|---|---|
| Staff with a PIN (Simpas Ikeja, Bar) | qa.pin.bar@hospio-qa.test | `Hospio123!` |
| Manager, Simpas Ikeja | qa.owner.mgr.3kaqk@hospio-qa.test | `Hospio123!` |
| Owner B | qa.ownerb.fcekd@hospio-qa.test | `Hospio123!` |
| Test person to suspend (Simpas Ikeja, Housekeeping) | QA DEF092 Suspend Test | (not signed in) |
| Test person with a PIN (owner B, QA B Ikoyi) | QA DEF094 PIN Test · qa.def094.pin@hospio-qa.test | `Hospio123!` |

## 1 · DEF-091 · Show/hide eye on password fields

1. **Do:** sign in as QA PIN Bar → **My profile & security** → **Security** → **Change PIN**. Type in **Your password**.
   **Expect:** an eye icon at the right of the box. Click it: the password shows and the icon becomes a crossed-out eye.
   Click again: dots again.
2. **Do:** with the keyboard only, press Tab until the eye is focused (a ring shows), then Enter or Space. **Expect:** the same
   toggle. A screen reader reads "Show password" / "Hide password".
3. **Expect:** the six PIN boxes above still show dots only and have no eye.
4. **Do:** close it → **Change password**. **Expect:** **Current password**, **New password** and **New password again** each have
   their own eye; showing one does not show the others. Close and reopen: everything is hidden again.
5. **Do:** if 2-step sign-in is on for a QA account, **Turn off** → **Your password**. **Expect:** the same eye.
6. **Do:** admin portal (amoria@hospio360.com) → **My profile** → **Security** → **Change password**. **Expect:** the same eyes.
   Don't change the password.
7. **Regression:** on a bill, a request that needs a manager, approved on the same device (**Manager approval**): **Manager's PIN**
   has no eye; **Owner's password** (when the owner is picked) has one. **My shifts** → **Change PIN**: **New PIN** and **Again**
   have no eye; **Your password** has one.

## 2 · DEF-092 · A suspension needs a reason

1. **Do:** sign in as the Simpas Ikeja QA manager → **Staff** → search "DEF092" → open **QA DEF092 Suspend Test** → **Suspend**.
   **Expect:** the red **Suspend** button is greyed out and can't be pressed; under the reason: "Write the reason to suspend (at
   least 3 characters)".
2. **Do:** type two spaces, then "ab". **Expect:** still greyed out.
3. **Do:** type a real reason (e.g. "QA retest"). **Expect:** the button turns red. Press it. **Expect:** "QA DEF092 Suspend Test
   suspended" (green) and the status **Suspended**.
4. **Do:** **Resume access** → **Reinstate**. **Expect:** Active again. Always reinstate the test person.
5. **Do:** the same as the owner (owner B → Staff → row menu → **Suspend** on a QA person). **Expect:** the same greyed-out button.
6. **API (optional):** `POST /identity/users/{id}/suspend` with `{}`, `{"reason":""}`, `{"reason":"  "}` or `{"reason":"ab"}`.
   **Expect:** 400 "Enter a reason to suspend … (at least 3 characters). They have not been suspended"; the person stays Active.
7. **Not affected (by design):** **Pause for a few days** and Roles → **Pause** have an optional reason. Business suspension (admin)
   already requires a reason. The admin team's **Pause access** and **Remove from team** don't take a typed reason.

## 3 · DEF-093 · Role cards count the people who hold each role

1. **Do:** as the Simpas Ikeja QA manager → **Roles & Permissions**. **Expect:** each card shows a count, not "0 people". On
   19 Nov 2026 it showed Manager 10, Front office 28, Housekeeping 5, Laundry 1, Maintenance 2, Kitchen 11, Bar 21, Inventory 1,
   Finance 1, Waiter 1, Cashier 1 (staging data changes, so check against step 3, not these numbers).
2. **Do:** reload. **Expect:** the same counts.
3. **Do:** **Staff access** → **Any role** → pick **Bar**. **Expect:** the number of people listed equals the Bar card and the
   "Bar (n)" option. Someone with two roles (e.g. Bar and Waiter) is counted on both cards.
4. **Do:** a card → **Who holds it (n)**. **Expect:** the same n, and the list filtered to that role.
5. **Do:** owner B → **Roles & Permissions**, switch the sidebar between **QA B Ikoyi** and **QA B Abuja**. **Expect:** the counts
   change with the location (e.g. Ikoyi Front office 5, Abuja Front office 6 on 19 Nov 2026).
6. **Do:** give a QA person a role, then pause it. **Expect:** the card goes up by 1 when given, down by 1 when paused (paused roles
   are not counted).
7. **Do:** owner B → **Staff**. **Expect:** the owner is not in the list (only the people who work for them).

## 4 · DEF-094 · The owner's Reset PIN and Remind (works as designed)

1. **Do:** owner B → **Staff** → open **QA DEF094 PIN Test**. **Expect:** **PIN for shared devices**: "PIN set …" with **Reset PIN**,
   or "No PIN yet" with **Remind**.
2. **Do:** to get a PIN to reset, sign in as QA DEF094 PIN Test → **My profile & security** → **Security** → **Set PIN** (any 6
   digits that are not 111111 or 123456, with the password). Back as owner B → **Reset PIN** → confirm. **Expect:** "PIN reset";
   the panel then shows "No PIN yet" with **Remind**; the person is told "Your PIN was reset".
3. **Do:** **Remind**. **Expect:** "Reminder sent to QA DEF094 PIN Test".
4. **Refused:** the owner has no PIN actions on their own row; a manager can't reset the owner's or another manager's PIN; owner B
   can't act on Simpas Ikeja's staff.
5. **Expect:** QA 06 "Known limits" no longer says the owner has no Reset PIN. Log a defect only if Reset PIN or Remind shows but
   fails.

## Regression

- Sign-in, accept invite and reset password pages keep their own eye (unchanged).
- Admin → Integrations: secret keys get the eye; saved keys still show masked until replaced.
- Owner's Staff tabs (All, Active, Invited, Paused or suspended) and their counts still add up.
- Manager → Staff: Suspend with a reason, Pause for 7 days and Reinstate still work.
