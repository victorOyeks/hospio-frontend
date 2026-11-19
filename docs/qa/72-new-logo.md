# QA script · The new Hospio360 logo (staging)

## Purpose

Hospio360 has a new logo (owner's choice "Option C", 19 Nov 2026). The old mark, a white **bed** on a maroon square, is gone
everywhere it stood for Hospio360. The colours did not change (maroon #4C091E and white).

- **Wordmark**: lowercase **hospio** in bold with **360** beside it in the same colour but lighter (62%). Maroon on light
  backgrounds, white on maroon. It replaces "Hospio360" next to the bed wherever the product name was shown as a logo.
- **Icon**: a white lowercase **h** on a maroon rounded square. It is the browser-tab icon, the installed-app icon and the small
  square in the app's own notices. The admin portal's installed-app icon has the **h** with a white **ADMIN** tag under it.

Bed pictures that mean **rooms** (the Rooms menu item, room tiles, "Charge to room" buttons, the booking page's Room row) are
**not** logos and stay as they are. A business's own logo (Hotel setup → Brand & colours) still shows where it did.

## Links

- Website: https://hospio360.com (and /features, /partners/apply, /legal, a /stay/… booking link)
- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Share images: https://hospio360.com/opengraph-image · https://hospio360.com/whatsapp/hospio360-banner.png ·
  https://hospio360.com/whatsapp/hospio360-logo.png
- The logo files for emails: https://hospio360.com/brand/hospio360-wordmark-white@2x.png (and `-maroon@2x.png`)
- Contracts: hospio-backend `docs/email.md` (email layout), `docs/plan-monthly-invoices.md` (invoice and receipt PDFs)

## Accounts

| Who | Email | Password |
|---|---|---|
| Owner with invoices (QA debit-rate business) | qa.debitrate.rrydw@hospio-qa.test | `Hospio123!` |
| Any Royal Suites manager or staff account from script 15/16 | as listed there | `Hospio123!` |
| Hospio360 admin (super admin or support) | as listed in script 15 | `Hospio123!` |

Never change the roles of the shared accounts. Don't suspend a business to see the suspended screen (see section 6).

## 1 · Website

1. **Do:** open https://hospio360.com on a computer. **Expect:** top left shows the maroon wordmark **hospio360** (no bed
   square, no capital H). Clicking it goes to the home page.
2. **Do:** look at the dashboard picture under the hero buttons. **Expect:** its maroon sidebar starts with the white wordmark.
3. **Do:** scroll to the footer. **Expect:** the maroon wordmark above "One system for hotels, lounges, bars and restaurants".
4. **Do:** open /features, /partners/apply, /legal, any legal document and a page that doesn't exist (e.g. /nothing-here).
   **Expect:** the same wordmark in the top bar and the footer on each.
5. **Do:** repeat 1–4 on a phone (or 390 wide) and a tablet (768 wide). **Expect:** the wordmark fits beside **Get started** and
   the menu button; the page never scrolls sideways.
6. **Do:** open a guest booking link (/stay/… from a WhatsApp or email booking message) for a hotel with **no** logo or colour
   set. **Expect:** the wordmark at the top. For a hotel with its own logo or colour: the hotel's logo and name, as before.

## 2 · Browser tab and share images

1. **Do:** look at the browser tab of the website, the hotel app and the admin portal. **Expect:** a small maroon square with a
   white **h** on all three (not "H360"). A hard refresh (Ctrl/Cmd+Shift+R) may be needed the first time.
2. **Do:** open https://hospio360.com/opengraph-image. **Expect:** maroon card with the white wordmark at the top, then
   "Every room, every table, every till, on one screen."
3. **Do:** open https://hospio360.com/whatsapp/hospio360-banner.png and https://hospio360.com/whatsapp/hospio360-logo.png.
   **Expect:** the banner shows the white wordmark and "Your stay, confirmed and in your pocket."; the square shows the white
   **h** above the wordmark. No bed on either. (Older WhatsApp messages and emails that point at these addresses now show the
   new pictures too.)
4. **Do:** open https://hospio360.com/whatsapp/banner?c=1f6f5c&n=Ivory%20Court. **Expect:** the hotel's green banner with
   "Ivory Court"; bottom left reads "Booked with" followed by the small wordmark.

## 3 · Hotel app

1. **Do:** sign out and open https://web-staging.hospio360.com/auth in a private window (no remembered hotel). **Expect:** the
   maroon panel on the left starts with the white wordmark. On a phone the maroon wordmark sits above the form.
2. **Do:** sign in as a Royal Suites account, sign out, and open the sign-in again in the same browser. **Expect:** the
   remembered hotel's own logo (or a building icon if it has none) and its name, not the Hospio360 wordmark. **Use the
   Hospio360 look** brings the wordmark back.
3. **Do:** sign in and look at the sidebar. **Expect:** it starts with the branch box (the hotel's logo or a building icon) as
   before; there is no bed anywhere at the top.
4. **Do:** as a new owner (sign-up) look at the setup pages header. **Expect:** the maroon wordmark top left.
5. **Do:** in Chrome or Edge, open the profile menu → **Install Hospio360** (or wait for the install banner on a phone).
   **Expect:** the banner's square is the maroon **h** icon. After installing, the app icon on the desktop or home screen is
   the **h** (on Android it fills the shape the phone uses). An app installed before this change may keep the bed until the
   browser refreshes its icons (usually within a day); reinstalling shows the new one at once.
6. **Do:** go offline (DevTools → Network → Offline) and reload. **Expect:** "You're offline" with the maroon **h** square.

## 4 · Admin portal

1. **Do:** open https://admin-staging.hospio360.com/auth on a computer. **Expect:** white wordmark and "Platform console" on the
   maroon panel. On a phone: maroon wordmark above the "Platform console" tag.
2. **Do:** sign in. **Expect:** the sidebar starts with the white wordmark and a small **ADMIN** tag.
3. **Do:** install the admin portal as an app. **Expect:** the icon is the white **h** with a white **ADMIN** tag under it, so
   it can't be confused with the hotel app.
4. **Do:** open a business in onboarding at step 10 (handover) → the handover pack (Print). **Expect:** the maroon wordmark at
   the top of the pack and of the printed page.

## 5 · Invoice and receipt PDFs

1. **Do:** as the owner with invoices, open Billing & invoices, open an invoice and download its PDF, then a receipt PDF.
   **Expect:** the letterhead reads "OYEKS GLOBAL LIMITED" / "Hospio360 is a product of Oyeks Global Limited" in the middle and
   the maroon wordmark on the right, crisp when zoomed in. The rest of the PDF is unchanged.
2. **Do:** download the same files from the admin portal (Business → Money). **Expect:** the same letterhead.

## 6 · App notices and the suspended screen

1. **Do:** keep a page of the hotel app open while a new version is deployed (or ask the developer when one goes out).
   **Expect:** the "Reload Hospio360 to carry on" notice shows the small maroon **h** square on its left.
2. **Do:** sign in as an account of a business that is **already** suspended on staging (ask the developer which one; don't
   suspend a business for this). **Expect:** at the bottom of "This account is suspended": the small maroon wordmark, then
   "· Oyeks Global Ltd".

## 7 · Emails

1. **Do:** have Hospio360 send you an email of its own (an admin invite from Team, a password reset for a Hospio360 admin, or a
   monthly invoice email) to a real inbox (not `.test`, which is never sent). **Expect:** the maroon band at the top shows the
   white wordmark (no "H3" circle and no "Hospio360" in plain text).
2. **Do:** open an email a hotel sends (booking confirmation or receipt from Royal Suites). **Expect:** the hotel's band with
   its logo or its initials and its name, as before. Hotel emails don't carry the Hospio360 wordmark at the top.
3. **Do:** open the same email in Gmail on a phone. **Expect:** the wordmark is sharp, not blurred or stretched.

## Negative cases and what is not a bug

- A bed icon next to **Rooms**, **Charge to room**, room counts or the booking page's Room row is expected.
- A business's own logo replacing the wordmark on its sign-in and in its emails is expected.
- An already installed app or a pinned tab still showing the bed for a while is the browser's cache; reinstall or clear the
  site data. Report it only if a fresh install shows the bed.
- Report as a bug: a bed or a capital "H360" square anywhere it stands for Hospio360, a wordmark cut off, squashed or on the
  wrong colour (maroon on maroon, white on white), or any page that scrolls sideways at phone or tablet width.
