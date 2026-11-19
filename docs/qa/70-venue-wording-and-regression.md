# QA script · Venue wording and regression (venue type, phases 5 and 6) (staging)

## Purpose

The last two phases of lounges, bars and restaurants (hospio-backend `docs/plan-venue-type.md`):

1. **Wording (phase 5).** A lounge, bar or restaurant reads its own word everywhere: "Lounge setup", "Locations", "Remove from
   lounge", "This lounge doesn't take cash"; nothing about rooms, bookings, check-in or folios. A business that is not hotels only
   reads "locations" on the owner's pages. **A hotel reads what it read before.**
2. **Regression (phase 6).** A hotel works as before; a lounge works end to end; a business with a hotel and a lounge follows the
   location chosen in the branch box.

One page for sales and onboarding: `docs/hospio360-for-lounges-bars-restaurants.md`.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Tracker: hospio-backend `docs/plan-venue-type.md` ("Phase 5: wording", the log of 19 Nov 2026)
- Earlier scripts: 61 (venue type), 62 (dashboards and reports), 65 (setup, waiters, cashiers), 67 (the bill), 68 (landing page)

## Accounts

Password `Hospio123!`. QA venues only; pay with cash or the **Bar test terminal** (logging POS). Nothing is sent to `.test` emails.

| Who | Email | Location |
|---|---|---|
| Lounge owner / manager | `owner.lounge.qhye@` / `manager.lounge.qhye@hospio-qa.test` | QA Lounge Wuse Bar (Lounge) |
| Lounge bar / kitchen / waiter / cashier | `bar.` / `kitchen.` / `waiter.` / `cashier.lounge.qhye@hospio-qa.test` | QA Lounge Wuse Bar |
| Mixed business owner | `owner.mixed.cvt5@hospio-qa.test` | QA Venue Mixed cvt5 Hotel + QA Venue Mixed cvt5 Lounge |
| Hotels-only owner | `qa.owner.uuxcq@hospio-qa.test` | QA Referred Hotel uuxcq |
| Hotel staff | `qa.pin.front@` / `qa.pin.bar@` / `qa.pin.kitchen@` / `qa.pin.waiter@` / `qa.pin.cashier@hospio-qa.test` | Simpas Ikeja (hotel) |
| Restaurant owner still signing up | `owner.resto.yrio@hospio-qa.test` | QA Venue Resto yrio |
| Super admin | `amoria@hospio360.com` | admin portal |

Don't touch "Patio Lounge", real customers or the shared real-person accounts.
- **Accept invites in a private window**, not the owner's browser; accepting signs the invited person in on that browser.
- **Staging is redeployed often.** After a deploy, a "Reload Hospio360" banner appears once on open pages; that is expected, not a defect.
- **SMS is only for sign-in codes; WhatsApp is live. Staging texts only allow-listed numbers**; other numbers show "Held back: not on this environment's allow-list" (expected). Phone codes on staging are `123456`.
- **Card payments can't complete on staging** except on the Bar test terminal. Test cash, transfer and charge to room.
- **Don't change the shared accounts** (tunde, godwin, victor, grace, segun, mariam, femi, jide): no role, password or 2-step changes.

## 1 · A lounge reads "lounge" (owner and manager)

1. **Do:** sign in as the lounge **manager**. **Expect:** the menu ends with **Lounge setup** (not Hotel setup); no Rooms, Bookings,
   Folios or Organizations.
2. **Do:** open **Lounge setup**. **Expect:** the title "Lounge setup", "…your lounge's own lists, times and rules · changes apply to
   this lounge only"; sections **Lounge basics** (opening hours), Money (no "Deposit to hold a booking"), Restaurant & bar,
   Taxes ("Prices include tax"), Approval limits (no "Room price changes need the owner"), Brand & colours (the preview shows
   Sales, Menus, Reports and "New sale"), Danger zone: **Pause this lounge**, **Close this lounge** ("Pausing shows the lounge as
   paused; closing removes the lounge from every screen").
3. **Do:** Staff → a person's menu. **Expect:** "Remove from lounge". Roles → **Roles**: no Front office or Housekeeping card; the
   "Only a manager" list has no folio, late checkout or room lines and ends "Lounge setup: outlets, tables, lists and prices".
4. **Do:** Financials, Night audit, Messaging, Billing & invoices, Help. **Expect:** "Sales today" with no "on rooms"; the night
   audit's links are Financials and Payments; Billing says "…card/transfer POS payments and new sales pause…" (no bookings, no
   check-out); Help says "lounge" and "Lounge setup", with no guide about rooms, bookings, folios or charging to a room.
5. **Do:** sign in as the lounge **owner**. **Expect:** the menu has **Locations** (not Hotels); the header says "Owner"; the
   Locations page has **Add a location**, the kind under each name, no Rooms or Occupancy column, "Money received · month to
   date"; Staff, Users, Payments and Financials say "All locations" and "Location".
6. **Do:** Locations → **Add a location** (don't finish; close it). **Expect:** "Kind of location" first (Lounge chosen), "Lounge
   name", "Phone", no check-in times on step 2, step 3 says a lounge has no rooms to add, the review lists the kind.
7. **Do:** on every menu page of both, search the page (Ctrl+F) for hotel, room, check-in, folio, booking. **Expect:** none, except
   the allowed places at the end of this script.

## 2 · Bar, kitchen, waiter, cashier at the lounge

1. **Do:** sign in as each and open every menu page and Help. **Expect:** no hotel, room, check-in, folio or booking wording;
   Sales has four tiles (no "On rooms"); a missing outlet or table says "…in Lounge setup → Restaurants & tables".
2. **Do (bar):** ring up 2 Star Lager, pay cash. **Expect:** Approved, the sale closes; the bill offers no "Charge to room".
3. **Do (waiter):** open a tab with a drink and Peppered chicken; try to pay. **Expect:** the kitchen board shows the ticket;
   "Waiters don't take payment here: the cashier does. A manager can allow it in **Lounge setup** → Restaurant & bar".
4. **Do (kitchen):** mark it ready. **Do (cashier):** take the tab by card on the Bar test terminal; the waiter marks both served.
   **Expect:** Approved; the tab closes once everything is served.
5. **Do (bar):** a ₦3,800 sale → Split the bill → equally in 2 → cash, then transfer. **Expect:** two parts of ₦1,900, a receipt
   each, closed with the last part.
6. **Do (manager):** Night audit, Reports → Sales by outlet (today). **Expect:** two checks only (tills, open tabs and unsettled
   orders); the sales of steps 2 to 5; nothing "on rooms".

## 3 · A hotel reads what it read before

1. **Do:** sign in as `qa.pin.front@` (Simpas Ikeja). **Expect:** Today, Bookings, Rooms, Folios, Room service as before; Till says
   "set in Hotel setup → Money"; Help says "hotel"; no "lounge" or "location" as the place's word anywhere.
2. **Do:** New booking (walk-in, pay at check-out) → Check in → as `qa.pin.bar@` open a tab and **Charge to room** → as front office
   take a laundry order charged to the room → Folios: the room night, the bar charge and the laundry → take cash for the balance →
   Check out. **Expect:** each step as before; a room that hasn't been cleaned says "Room … hasn't been cleaned yet. A manager can
   check the guest in anyway"; the room goes to housekeeping (Dirty) after check-out.
3. **Do:** sign in as `qa.owner.uuxcq@` (hotels only). **Expect:** menu **Hotels** and **Hotel setup**; "Hotel owner"; the Hotels page
   with **Add new hotel**, Rooms and Occupancy; "Money received · month to date" (the only changed label); Hotel setup with Rooms &
   stay rules, Housekeeping, check-in times, "Pause new bookings".

## 4 · A business with a hotel and a lounge

1. **Do:** sign in as `owner.mixed.cvt5@`, pick **QA Venue Mixed cvt5 Hotel** in the branch box. **Expect:** menu **Locations**,
   Bookings, **Hotel setup**; the Locations page lists both with their kind, Rooms shows "—" for the lounge; Help includes the
   booking guides.
2. **Do:** pick **QA Venue Mixed cvt5 Lounge**. **Expect:** **Lounge setup**, no Bookings; setup has no Rooms & stay rules or
   Housekeeping; Help has no booking guides. The owner's pages still say "locations".

## 5 · Sign-in, sign-up and onboarding

1. **Do:** open /auth signed out. **Expect:** "Run your business from one place." "For hotels, lounges, bars and restaurants: …",
   "Create your account". /sign-up: "For owners of hotels, lounges, bars and restaurants".
2. **Do:** sign in as `owner.resto.yrio@` (still in the wizard). **Expect:** "Your first restaurant", step 3 **Outlets**, the
   manager step "A manager is given a restaurant…", "Runs the restaurants you give them: sales, tabs, tills, menus…", "Change
   later in Restaurant setup → Approval limits".
3. **Do (admin):** Customers → **Locations**. **Expect:** a **Kind** column, an "All kinds" filter (Lounge lists only lounges),
   "—" under Rooms for a lounge. Businesses → **Set up a business for them**: "What kind of business?" above the name. Open a
   lounge in onboarding: steps Locations, Rooms "Not needed", Setup with Outlets, People without front office.
4. **Do:** install the app (QA 56). **Expect:** still named "Hospio360".

## 6 · Emails (rendered, not sent)

`.test` addresses are skipped, so the texts are rendered by the tests: hospio-backend, `-Dvenue.email.texts=<folder>` on the
tenant, platform and messaging tests (handover pack, welcome, day closed, invoice issued / reminder / final warning / restricted).
**Expect** for a lounge: "Your business is ready on Hospio360", "LOCATIONS … · Lounge", outlets and menus (not rooms and
bookings), "Hospio360 · lounge management by Oyeks Global" in the footer, invoices without "new bookings" or "check-out".

## Negative cases

- A rooms page opened by address at the lounge (/dashboard/bookings) → "Not used at a lounge" ("If you add rooms later in Lounge
  setup, room pages come back on their own").
- POST charge-to-room at the lounge → 400 "Charging to a room is switched off here (it needs rooms: a lounge, bar or restaurant has none)".
- A location name already used: lounge "This business already has a location called …"; hotels-only business "…a hotel called …".
- Another business's location: lounge "You don't have access to that location. Pick one of your locations or sign in again";
  hotel staff "…that hotel. Pick one of your hotels…".
- 820 and 1024 wide: no sideways scroll on any menu page of the six lounge roles.

## Allowed places for the hotel words at a lounge

- "Not used at a lounge" explains "This page is for rooms and stays".
- "A hotel has rooms; a lounge, bar, restaurant or club sells at its outlets" under "Kind of location", and the kind "Hotel" in
  the pickers.
- A name someone typed (a location, outlet, item or person called "…Hotel…", "Room 5 table").
- Notifications and activity stored before 19 Nov 2026.
- "On rooms" on Sales only when a past sale really was charged to a room.
