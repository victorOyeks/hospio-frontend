# QA script · Venue setup, waiters and cashiers (venue type, phase 3) (staging)

## Purpose

Phase 3 of lounges, bars and restaurants (hospio-backend `docs/plan-venue-type.md`):

1. **"Lounge / bar / restaurant" setup.** Every location without rooms starts from it by itself, in admin onboarding and in the
   owner's sign-up (hotels keep the Standard hotel setup). It sets: tabs on with a ₦100,000 limit, a tab flagged when open over 4
   hours, a tab needs the guest's name or a table, waiters don't take payment, cash/card/transfer, till float ₦10,000, receipts
   on WhatsApp, VAT 7.5 % included, no service charge, guest messages receipts only, opening hours 10:00 to 02:00, a receipt footer, the
   day closing at 04:00, and reasons for voids, cancellations and discounts that fit a sale. It stores **nothing** about stays
   (stay rules, housekeeping, check-in times, charge to a room): a venue that adds rooms later gets the hotel defaults for those and
   keeps everything else.
2. **Outlets in admin onboarding.** Step 6 (Hotel setup) shows, for each location without rooms, what the setup fills in and an
   **Outlets** card: name + Bar / lounge, Restaurant or Kitchen. Continue creates them, each linked to the store of its kind, so the
   owner's review lists the outlets instead of "Outlets are added in Hotel setup".
3. **Waiter.** Opens a tab at a table, adds items (sent to the bar or kitchen at once), marks them served, moves the tab. Sees only
   the tabs and sales they opened (Full access = head waiter sees everyone's). Can't mark a dish ready, can't take anything off once
   it is sent, can't change the menu or prices, has no till. Takes payment only when Hotel setup → Restaurant & bar → **Waiters
   take payment** is on, and cash only when **Waiters can take cash** is on too (it goes into the cashier's till).
4. **Cashier.** Sees every open tab and sale at every outlet ("To pay"), takes the payment (cash into the cashier till, card or
   transfer on the outlet's POS), sends receipts on WhatsApp, opens, closes and hands over the till. Can't ring anything up, add or
   remove items, or change the menu or prices.
5. Both roles are offered to hotels too (restaurant and bar), start at **Can edit**, have PIN tiles on shared devices, and show in
   Roles & Permissions, Add staff, onboarding People, the rota and Sales by staff.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Contract / tracker: hospio-backend `docs/plan-venue-type.md` (Phase 3), `docs/restaurant-bar.md` (Waiters and cashiers)

## Accounts

Password `Hospio123!`. QA venues only; pay with cash or the **Bar test terminal** (logging POS). Nothing is sent to `.test` emails.

| Who | Email | PIN | Location |
|---|---|---|---|
| Super admin | `amoria@hospio360.com` | | admin portal |
| Manager / owner | `manager.lounge.qhye@` / `owner.lounge.qhye@hospio-qa.test` | | QA Lounge Wuse Bar (Main Bar, VIP Lounge, Kitchen) |
| Waiter 1 (Wale) / Waiter 2 (Kemi) | `waiter.lounge.qhye@` / `waiter2.lounge.qhye@hospio-qa.test` | 514273 / 628451 | QA Lounge Wuse Bar |
| Cashier (Chika) | `cashier.lounge.qhye@hospio-qa.test` | 937264 | QA Lounge Wuse Bar |
| Kitchen / bar | `kitchen.lounge.qhye@` / `bar.lounge.qhye@hospio-qa.test` | | QA Lounge Wuse Bar |
| Hotel waiter / cashier | `qa.pin.waiter@` / `qa.pin.cashier@hospio-qa.test` | 246813 / 975318 | Simpas Ikeja (hotel) |

Don't touch "Patio Lounge", real customers or the shared real-person accounts.

## 1 · The setup reaches a new venue by itself

1. **Do:** amoria → Onboarding → set up "QA Venue <x>" as a **Lounge**, add a location (step 4).
   **Expect:** nothing to pick at step 6 ("Choose a template" is not shown): a card **Lounge / bar / restaurant setup** lists what
   it sets, ending "Left out: Stay rules, housekeeping, check-in times and charge to a room".
2. **Do:** in **Outlets at …** tap **Add an outlet**, type "Main bar" (Bar / lounge), add "Kitchen" (Kitchen), Continue.
   **Expect:** "Lounge / bar / restaurant setup applied to 1 location"; coming back to the step, both outlets are listed with a
   green tick and the card reads "setup applied". Two outlets with the same name are refused.
3. **Do:** sign in as that venue's manager → Hotel setup. **Expect:** Restaurant & bar: Bar tabs allowed on, Tab limit ₦100,000,
   Flag a tab open longer than 4, **A tab needs a name or a table** on, **Waiters take payment** off, **Waiters can take cash** off.
   Location basics: Opens at 10:00, Closes at 02:00, the receipt footer. Money: till float ₦10,000, receipts WHATSAPP. Guest messaging:
   only "Send receipts automatically". Reasons & lists: "Rang up twice", "Sent back or spilled"… and no "No-show".
   Restaurants & tables: the outlets with Bar store / Kitchen store.
4. **Do:** sign up as an owner on web-staging and pick **Restaurant** (QA 61 section 3). **Expect:** the same setup in Hotel setup
   once the location is made, without anyone applying a template.
5. **Hotel check:** a hotel's Hotel setup (Simpas Ikeja) still has Rooms & stay rules, Housekeeping and check-in times; Restaurant
   & bar shows the new switches off; no "Opens at".

## 2 · Add a waiter and a cashier

1. **Do:** manager → Staff → Add staff. **Expect:** Role offers **Waiter** and **Cashier**; the level starts at Can edit.
2. **Do:** manager → Roles. **Expect:** Waiter and Cashier each with what View only / Can edit / Full allows (the waiter's Full:
   "See and work every waiter's tabs (head waiter)").
3. **Do:** sign in as the new person. **Expect:** Waiter menu: My tabs, My sales, My shifts, Inbox, Notifications. Cashier menu: To
   pay, Sales, My payments, Till, My shifts, Inbox, Notifications.

## 3 · The flow: waiter → kitchen → cashier

Waiters take payment **off** (the default). Tablet at 1024 or 820 wide.

1. **Do (waiter 1):** check "Serving at" says Main Bar → **New tab** → add 2 Star Lager and Peppered chicken → **Open tab & send**
   with no table and no name. **Expect:** "Pick the table or put the guest's name on the tab".
2. **Do:** pick **Table 4** → Open tab & send. **Expect:** "Tab opened at Table 4 · sent to the bar"; the tab shows the drinks
   "Sent to the bar", the chicken "Sent to Kitchen", buttons **Move** and **Add items**, no "Close & pay", and "The cashier takes
   the payment for this tab". There is no ✕ on a sent item.
3. **Do (kitchen):** Orders shows a ticket "from Main Bar" with only the chicken → mark it ready.
   **Expect (waiter 1):** a notification; the chicken reads "Ready in Kitchen · collect it" with **Served**. Tap Served on each line.
4. **Do (waiter 2):** My tabs. **Expect:** Table 4 is not there; My sales doesn't list it.
5. **Do (cashier):** **To pay**. **Expect:** "All outlets · to pay" with the Table 4 tab, its number and "Wale Waiter". Open it: only
   **Take payment**.
6. **Do:** Take payment → Cash with the till closed. **Expect:** "Open your till first: cash taken at the cashier goes into the
   cashier till…". Open **Till** → Open till (the float is ₦10,000 from Hotel setup) → take the cash again → WhatsApp or skip the
   receipt. **Expect:** the tab leaves To pay and My tabs; Till lists "Cash payment".
7. **Do:** waiter 1 opens another tab with a name; cashier takes **Card on the POS**. **Expect:** it goes to the Bar test terminal
   (the cashier has no POS of their own, so the outlet's desk POS is used); approved → the tab closes.
8. **Do (manager):** Reports → Sales by staff, today. **Expect:** the sales are under **Wale Waiter** (who opened them), not the
   cashier. Payments by method: the cash and card as taken. Dashboard: Tills "1 open · expected ₦…" for the cashier till; Staff on
   shift lists the waiters and the cashier once they clock in.

## 4 · Waiters take payment (the switch)

1. **Do (manager):** Hotel setup → Restaurant & bar → **Waiters take payment** on, save. Wait a minute.
   **Expect (waiter):** an open tab now has **Close & pay**; Card and Transfer work; Cash says "Waiters don't take cash here: the
   cashier does…".
2. **Do:** also switch **Waiters can take cash** on, wait a minute, the waiter takes cash.
   **Expect:** approved; the cash shows in the **cashier's** till (the waiter has no till). With the cashier till closed: "The
   cashier's till isn't open: a waiter's cash goes into it…".
3. Switch both off again.

## 5 · PIN lock (shared tablet)

1. **Do:** manager → Hotel setup → Shared devices → set up a device for **Waiter, Cashier, Bar**.
   **Expect:** the lock screen shows tiles for Wale Waiter, Kemi Waiter and Chika Cashier; each unlocks with their PIN onto their
   own home (My tabs / To pay); Lock returns to the tiles.

## 6 · Hotels (Simpas Ikeja)

1. `qa.pin.waiter`: My tabs at the Restaurant or Bar (Serving at); a tab can be charged to a room ("Charge the tab to a room
   instead") for a checked-in guest. `qa.pin.cashier`: To pay, Till.
2. Front office, bar and kitchen screens are unchanged; the bar's Tabs page still shows only tabs with "Add drinks" and "Close & pay".

## Negative cases

- Waiter with the switch off calling `POST /payment/payments` (role WAITER) → 403 "Waiters don't take payment here: the cashier does…".
- Waiter cancelling a sent item → 403 "Cancelling something already sent needs a manager or Full access"; a sent tab → 403 "…needs a manager".
- Waiter marking the kitchen's dish ready → 403; serving it before the kitchen is done → 400 "The Kitchen hasn't marked … ready yet".
- Waiter 2 opening waiter 1's tab (`GET /fnb/orders/{id}`, add a line, the sale detail) → 403 "… was opened by Wale Waiter. Only they, a head waiter or a manager can work on it".
- Waiter with the switch on paying another waiter's tab → 403 "This sale was opened by another waiter…".
- Cashier `POST /fnb/orders`, adding a line, cancelling a line, `PUT /fnb/menu/{id}/price`, editing a menu item → 403.
- Cashier or waiter taking a payment that isn't for an outlet sale (a folio) → 400 "A cashier takes payment for restaurant and bar sales only".
- A waiter opening the cashier till → 403. Waiter or cashier on `GET /fnb/sales/report` → 403.
- The venue setup on a location with rooms (`apply-template {builtIn: "VENUE"}`) → 400 "The lounge, bar and restaurant template is for a location without rooms".
- Known limits: a waiter or cashier works every outlet of the location (no per-person outlet list); there is no manual discount on
  an outlet sale (happy hours only), so "who may discount, up to x %" is not a setting yet.
