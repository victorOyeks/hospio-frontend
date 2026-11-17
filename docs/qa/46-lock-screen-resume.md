# QA script · Resume after the lock screen (staging)

## Purpose

When a shared tablet locks (the idle lock or **Lock**), or someone's session ends and they sign in again, the same person
goes back to the page they were on, and the forms they were half-way through come back filled in ("drafts"). Anyone else
who unlocks or signs in on that tablet lands on their own home page and never sees the other person's draft.

Drafts are kept only in this browser tab (sessionStorage), never sent to the server, and are deleted when the form is
saved, cancelled or closed, at sign-out, when someone else unlocks or signs in, and after 4 hours. PINs, passwords, card
details and money amounts are never kept, and **Take payment is never restored**: the payment is always taken again.

Forms that keep a draft:

| Where | Form | Kept | Not kept |
|---|---|---|---|
| Front desk → Bookings | **Check in** | room, "ID seen" | the payment |
| Front desk → Bookings, Manager → Bookings | **New booking** | guest, dates, room type, guests, plan, company, arrival, notes, walk-in room | the special rate, the payment |
| Manager → Bookings | **Check in** | room, "ID checked" | the payment, "without payment" |
| Bar → Today | **New sale** (the cart before it is sent) | seat, name, drinks with choices and notes, how they pay, room | Take payment |
| Kitchen → Orders | **New order** | dine-in / takeaway / room service, table, guest, items, how they pay | Take payment |
| Front desk → Till | **Hand over** | colleague, note | the cash counted |
| Housekeeping → My rooms | **Report a problem** | where, what's wrong, priority, out of order | the photo |

## Links

- Hotel app: https://web-staging.hospio360.com (a tablet, or a desktop browser window about 1024 px wide)
- Hotel used: Royal Suites Ltd → Simpas Ikeja
- Related: 06-shared-devices.md (setting up a shared device, PINs)

## Accounts

Password for every account: `Hospio123!`

| Role | Name | Email |
|---|---|---|
| Manager | Tunde Bakare | `tunde@royalsuites.ng` (sets up the tablet) |
| Bar | QA PIN Kemi l184h | `qa.pin.kemi.l184h@hospio-qa.test` |
| Bar | QA PIN Ada l184h | `qa.pin.ada.l184h@hospio-qa.test` |
| Kitchen (Full access) | Mariam Bello | `mariam@royalsuites.ng` |
| Front office | Victor Adeyemi | `victor@royalsuites.ng` |

To "unlock" use the person's PIN if you know it, or **Sign in with email instead** on the lock screen: both go to the
same place. Don't guess PINs on shared accounts (five wrong tries lock that PIN for 15 minutes). Use people with **one**
role for the "same page" checks: someone with two roles (Segun: Bar and Front office) who signs in with email is asked
to choose a role and then starts on that role's home page (a PIN unlock picks the device's role and does go back).

Name test guests and orders "QA 46 …" and cancel them when you finish. Never complete a card payment.

## 1 · Set up a shared tablet (Tunde)

1. **Do:** sign in as Tunde, account menu → **Use this device as a shared device**: name "QA 46 tablet <initials>", roles
   **Bar** and **Kitchen**, Lock after **1 minute** → **Set up device**. **Expect:** the lock screen with QA PIN Kemi, QA PIN
   Ada and Mariam among the tiles.

## 2 · The same person goes back to the same page (Kemi)

1. **Do:** unlock as Kemi. Open **Sales** and search for something so the address has a query (e.g. `?q=qa46`).
   **Lock**. **Expect:** the lock screen.
2. **Do:** unlock as Kemi again. **Expect:** Sales with the same search, not Today.
3. **Do:** stay on Sales and don't touch the tablet for a minute. **Expect:** the 30-second warning ("What you are typing
   comes back when you unlock"), then the lock screen with "Locked after 1 minute without use. Unlock with your PIN to
   carry on where you were."
4. **Do:** unlock as Kemi. **Expect:** back on Sales.

## 3 · Someone else goes to their own home page (Kemi → Ada)

1. **Do:** as Kemi, open **Sales** → **Lock**. Unlock as **QA PIN Ada**. **Expect:** Bar today (Ada's home), not
   Sales.
2. **Do:** Lock, unlock as Kemi. **Expect:** Bar today too: Ada was the last person, so Kemi's page is forgotten.

## 4 · Bar: the sale being built comes back (Kemi)

1. **Do:** unlock as Kemi → **New sale** → add 2 drinks (one with a choice, one with a note), pick a seat, type a name
   "QA 46", choose **Open a tab**. Don't press the button. **Lock**.
2. **Do:** unlock as Kemi. **Expect:** the New sale panel open with the same seat, name, drinks (choices, notes,
   quantities) and **Open a tab**; a small line at the top: "Restored what you were typing · Clear". Prices are today's
   menu prices.
3. **Do:** press **Clear**. **Expect:** the cart and fields empty; the line goes. Add a drink again, Lock, unlock as Kemi:
   the drink is back.
4. **Do:** press **Cancel**, Lock, unlock as Kemi. **Expect:** Today with no New sale panel (cancelled = draft gone).
5. **Do:** New sale → a drink → **Open a tab** → **Open a tab**. **Expect:** "Tab opened". Lock, unlock as Kemi, open
   New sale. **Expect:** an empty cart, no "Restored" line (sent = draft gone). Cancel the QA tab afterwards.
6. **Do:** New sale → a drink → **Pay now** → **Take payment**, and Lock while the payment step shows. Unlock as Kemi.
   **Expect:** the payment step is **not** shown again and nothing is restored; the sale is under Recent sales / Sales,
   unpaid. Cancel it (don't take a card payment).

## 5 · Another person never sees the draft (Kemi → Ada)

1. **Do:** as Kemi, New sale → add a drink, type "QA 46 Kemi" → **Lock**. Unlock as **Ada**. **Expect:** Bar today; open
   **New sale**: an empty cart, no "Restored" line.
2. **Do:** Lock, unlock as Kemi → New sale. **Expect:** empty too (Ada unlocking cleared Kemi's draft).

## 6 · Kitchen order (Mariam)

1. **Do:** unlock as Mariam, **Orders** → **New order** → Takeaway, two items, name "QA 46" → **Lock** → unlock
   as Mariam. **Expect:** New order open with the same items, Takeaway and name, and the "Restored" line.
2. **Do:** **Cancel**, Lock, unlock as Mariam. **Expect:** no New order panel.

## 7 · Signing in again after the session ends (Victor, no shared device)

Use a different browser window (not the shared tablet) for this section.

1. **Do:** sign in as Victor → **Bookings** → **New booking**: type a guest name "QA 46 Guest", a phone, 2 adults, a
   note. Don't save. In the browser's developer tools delete the cookies of web-staging.hospio360.com except
   `hms.device` (or wait until the session ends), then reload. **Expect:** the sign-in page.
2. **Do:** sign in as Victor. **Expect:** Bookings with **New booking** open and the guest, phone, adults and note
   filled in, and the "Restored" line.
3. **Do:** **Cancel**, reload the page. **Expect:** no draft.
4. **Do:** open a booking that is arriving → **Check in** → pick a room, tick **ID seen**. Delete the session cookies again,
   reload, sign in as Victor. **Expect:** the Check in panel for the same booking with the room and the ID tick.
5. **Do:** repeat 4 but sign in as **another user** (e.g. Tunde). **Expect:** Tunde's own home page; then signing out and
   back in as Victor shows no draft.
6. **Do:** with a draft open, account menu → **Sign out**, sign in as Victor. **Expect:** the dashboard, no draft.

## 8 · Till handover and housekeeping report

1. **Do:** as Victor with an open till → **Till** → **Hand over**: choose a colleague, type a note. Delete the session
   cookies, reload, sign in as Victor → **Till**. **Expect:** the Hand over modal opens with the colleague and note; the
   cash counted box is empty (amounts are never kept). Cancel.
2. **Do:** as a housekeeping user → **My rooms** → **Report a problem**: a room, "QA 46 dripping tap". Session ends,
   sign in again. **Expect:** the panel opens with the room and text; the photo must be chosen again. Cancel.

## 9 · Safety checks

1. **Do:** open `https://web-staging.hospio360.com/auth?from=//example.com` and
   `…/auth?from=https://example.com` and `…/auth?from=/dashboard//example.com`, and sign in. **Expect:** the dashboard
   each time, never another site.
2. **Do:** while a draft exists, open the browser's developer tools → Application → Session Storage. **Expect:** keys
   `hms.draft:<user id>:<form>` and `hms.resume` only; no PIN, password, card number or amount in the values. Network tab:
   nothing is sent when you type.
3. **Do:** in a private window with storage blocked (or Safari private mode), use New sale and Lock/unlock. **Expect:**
   everything works as before; there is simply no restore.

## 10 · No regressions

1. Normal Lock / unlock, wrong PIN ("Wrong PIN. 4 tries left …"), "No PIN yet" tiles and **Sign in with email instead**
   behave as in 06-shared-devices.md.
2. A normal sign-in on a fresh browser lands on the dashboard (or the role picker for two roles).

## What to report

- The same person not going back to their page or form, or a form coming back after it was saved, cancelled or
  signed out.
- Another person seeing someone else's page or typing.
- A payment step coming back after unlock, or any amount, PIN or card detail in Session Storage.
