# QA script · Admin invite link and tablet layout (staging)

## Purpose

1. **Admin invite link.** Hospio360 team members (super admin, support, finance admin) and marketers are invited to the
   **admin portal**: their email says `https://admin-staging.hospio360.com/accept-invite?token=…`. That page only existed in the
   hotel app, so the link showed "404 – Page Not Found". The admin portal now has the same "Set up your account" page as the hotel
   app (one shared screen): it shows who the invite is for, you choose a password (8–72 characters), and you are signed in and
   land on your home (marketers on the marketer portal with the Referral partner agreement, team members on the admin dashboard).
   A used or expired link and a wrong link show a readable message with **Back to sign in** and how to get a new invite.
2. **Tablet layout.** On tablets (768–1180 px wide, portrait and landscape) pages were wider than the screen: the header and the
   quick-action cards ran off the right edge and the page scrolled sideways. Now, below 1280 px the left menu starts as a narrow
   **icon rail** (hover an icon for its name; the **menu button** at the top left of the header opens the full menu), the search
   box shrinks, page actions and the bar's quick-action cards wrap onto a second line, and two-column screens stack. Nothing scrolls
   sideways; wide tables scroll inside their own card. Desktop (1280 px and wider) looks as before.

## Links

- Admin portal: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com

## Accounts

Password `Hospio123!`. Super admin `amoria@hospio360.com`. Hotel: owner `owner.lounge.qhye@hospio-qa.test`, manager
`manager.lounge.qhye@hospio-qa.test`, front office `qa.pin.front@hospio-qa.test`, bar `bar.lounge.qhye@hospio-qa.test`, kitchen
`kitchen.lounge.qhye@hospio-qa.test`, housekeeping `qa.hon.hk@hospio-qa.test`. Invite only `@hospio-qa.test` addresses (no email
is sent to them): copy the invite link from the screen the invite shows. Open invite links in a **private window**.

## 1 · Admin team member invite

1. **Do:** as amoria, Admin team → Invite, a new name and `qa.team.<anything>@hospio-qa.test`, role Support. Copy the invite link.
   **Expect:** the link starts `https://admin-staging.hospio360.com/accept-invite?token=`.
2. **Do:** open the link in a private window. **Expect:** "Set up your account", "Support · Hospio360 / The Hospio360 admin
   portal", the name and the locked email.
3. **Do:** type `short` in both password boxes, Accept and continue. **Expect:** "At least 8 characters".
4. **Do:** type the same 8+ character password twice, Accept and continue. **Expect:** "Welcome, …" and the admin dashboard.
5. **Do:** open the same link again (another private window). **Expect:** "This invite has expired or was already used" with
   Back to sign in and "Ask for a new invite" (Team → Resend invite). No 404.

## 2 · Marketer invite

1. **Do:** as amoria, Marketers → Invite a marketer with a `qa.mk.<anything>@hospio-qa.test` email. Copy the invite link.
   **Expect:** admin-staging link.
2. **Do:** open it in a private window. **Expect:** "Marketer · Hospio360 / The Hospio360 marketer portal".
3. **Do:** choose a password. **Expect:** the marketer dashboard ("Hello …") with the Referral partner terms modal and the
   agreement card; accepting the terms works as in QA 59.
4. **Do:** open the link again. **Expect:** the "expired or was already used" message.

## 3 · Wrong or cut-off links

1. **Do:** open `https://admin-staging.hospio360.com/accept-invite?token=abc`. **Expect:** "This invite link is not valid".
2. **Do:** open `https://admin-staging.hospio360.com/accept-invite`. **Expect:** "This invite link is incomplete".
3. **Do:** the same two on the hotel app (web-staging). **Expect:** the same messages (the hotel app's page is unchanged).
4. **Do:** with the admin portal installed as an app (QA 56), open an admin invite link. **Expect:** the page loads (no 404, no
   offline page).

## 4 · Tablet layout (hotel app and admin portal)

Use a tablet, or desktop Chrome → DevTools → device toolbar (Responsive) at **768, 820, 834** wide (portrait) and **1024, 1180**
(landscape). At each width, open every page in the menu for each account above, and the admin portal's pages as amoria.

1. **Expect on every page:** no sideways scroll (swipe or shift-scroll left/right: the page does not move); nothing cut off at
   the right edge.
2. **Expect the header:** menu button, search box (narrower), help, bell and your avatar on one row inside the screen.
3. **Expect the menu:** a narrow rail of icons; hovering shows the page name; the menu button opens the full menu with the branch
   box (and, for bar/kitchen with several outlets, Serving at); tapping it again closes it.
4. **Bar → Today:** the five quick actions (New sale, Open tabs, Charge to a room, Count stock, Close shift) wrap onto two rows
   instead of running off the screen.
5. **Owner → Financials, Admin → Support:** the side card sits under the main card below 1280 px.
6. **Tables** (Bookings, Folios, Staff, Businesses, …): a wide table scrolls left/right inside its card, the page itself does not.
7. **Desktop (1280 px and wider):** the full menu shows as before.
8. **Phone (390 px):** unchanged: the menu button opens the menu as a drawer.
