# QA script · Lounges, bars and restaurants (venue type, phase 1) (staging)

## Purpose

A business can now be a **hotel, lounge, bar, restaurant or a mix** (a hotel and a lounge under one owner). Each location has a
kind; room features follow whether the location **has accommodation** (it is a hotel, or it has rooms), never the label alone:

1. **Admin onboarding.** Step 1 asks "What kind of business?" (Hotel / Lounge / Bar / Restaurant / Mixed). Step 4 is
   **Locations** (not Hotels) for a non-hotel business, with "What kind of place?" per location; check-in/out times only for a
   hotel. Step 5 Rooms reads **Not needed** when no location has rooms and Continue just moves on. Go-live has no "Every hotel has
   rooms" check for such a business. The handover pack and the owner's acceptance list the location as "Lounge", never "0 rooms".
2. **Owner sign-up wizard.** Step 1 asks the kind; step 2 adds "your first lounge/restaurant" without check-in times; step 3 is
   **Outlets** (at least one: name + Bar / Restaurant / Kitchen) instead of "Rooms & prices".
3. **Hotel app at a location without rooms** (gated on the location chosen in the branch box): no Rooms, Bookings, Folios,
   Organizations, Rooms out of order, Inspect in the menu; those pages, opened from a bookmark, say **"Not used at a lounge"**
   with Back to the dashboard (not a 404). No New booking / Check in / Room status / occupancy on the dashboards; no Charge to a
   room / Charged to rooms at the bar and kitchen; night audit checks only tills and open tabs; Hotel setup has no stay rules,
   housekeeping, check-in times or "Guests can charge to their room"; Front office isn't offered when adding staff.
4. **Hotels are unchanged.** Every existing customer is a hotel. A lounge that adds rooms gets the room features back.

## Links

- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com
- Contract / tracker: hospio-backend `docs/plan-venue-type.md`

## Accounts

Password `Hospio123!`.

| Who | Email | Location |
|---|---|---|
| Super admin | `amoria@hospio360.com` | admin portal |
| QA Lounge owner / manager / bar / kitchen | `owner.lounge.qhye@` / `manager.lounge.qhye@` / `bar.lounge.qhye@` / `kitchen.lounge.qhye@hospio-qa.test` | QA Lounge Wuse Bar (Lounge) |
| Hotel regression (front office / bar / kitchen) | `qa.pin.front@` / `qa.pin.bar@` / `qa.pin.kitchen@hospio-qa.test` | Simpas Ikeja (Hotel) |

Name test data "QA Venue …" and use only `@hospio-qa.test` emails (nothing is sent to them). Don't touch "Patio Lounge" and don't
change the shared real-person accounts (tunde, godwin …). Phone codes on staging are `123456`; staging texts only allow-listed
numbers, so use a number that isn't anyone's (the code screen then says it was held back, which is expected) or stop before it.

## 1 · Admin onboards a lounge

1. **Do:** amoria → Onboarding → Set up a business "QA Venue <your initials+time>", owner `owner.venue.<x>@hospio-qa.test`.
   **Expect:** the wizard opens on step 1.
2. **Do:** step 1, pick **Lounge** under "What kind of business?", save. **Expect:** step 4 in the left list reads **Locations**,
   step 5 **Rooms · Not needed**.
3. **Do:** step 4, Add a location "QA Venue <x> Bar", city Abuja. **Expect:** "What kind of place?" is Lounge; there are no
   check-in/check-out fields; the row shows "Lounge" and "Not used" for times.
4. **Do:** step 5. **Expect:** "QA Venue <x> Bar is a lounge: no rooms needed"; Continue moves on with nothing to fill.
5. **Do:** step 7 People, Add person at the lounge. **Expect:** no Front office or Housekeeping in the role list.
6. **Do:** step 9 Go-live. **Expect:** no "Every hotel has rooms" line; everything you completed is green without rooms.
7. **Do:** step 10, send the handover. **Expect:** the pack lists "QA Venue <x> Bar · Lounge", never "0 rooms".
8. **Do:** sign in as the new owner (temporary password from the screen), tick the boxes, review. **Expect:** the handover review
   shows "1 location: QA Venue <x> Bar (Lounge)" and its outlets (or "Outlets are added in Hotel setup → Restaurants & tables"),
   never "0 rooms" or "Room types and prices set". Accept → dashboard.

## 2 · What the lounge's people see (QA Lounge accounts or the business from 1)

1. **Owner:** menu has no Bookings. Dashboard: "N locations" (no rooms), **Sales today** instead of occupancy, branch card
   "Abuja · Lounge · …". Reports: no Occupancy or Guest list. **Bug:** "vs 72% last month" anywhere.
2. **Owner:** open `/dashboard/bookings` from the address bar. **Expect:** "Not used at a lounge" with Back to the dashboard.
3. **Manager:** menu has no Rooms, Bookings, Folios, Organizations. Dashboard: no New booking, no Check in/Check out, no Room
   status, no Today's guests; KPIs Sales today, Money taken today, Open tills, Cancelled today. `/dashboard/rooms` → "Not used at a lounge".
4. **Manager → Night audit:** only "Every till counted and closed" and "No open tabs or unsettled orders at the outlets"; no
   occupancy, arrivals, departures or "mark as no-shows". Open a tab at the bar first: the tab check turns red naming the outlet.
5. **Manager → Hotel setup:** no Rooms & stay rules, Housekeeping, check-in/out times or "Guests can charge to their room".
6. **Manager → Staff → Add:** no Front office role.
7. **Bar:** Today tiles New sale, Open tabs, Count stock, Close shift; **no** "Charge to a room"; no "Charged to rooms" in Tonight
   so far or on Close shift; New sale offers Pay now and Open a tab only.
8. **Kitchen:** no "Room service" order type, no "Charge to room" in an order.

## 3 · Owner sign-up as a restaurant

1. **Do:** web-staging → Sign up, owner `owner.venue.<x>@hospio-qa.test`, a phone number that isn't anyone's, accept both boxes.
   Code `123456` (if the code is held back, stop here and note it; it's the staging allow-list).
2. **Do:** step 1, pick **Restaurant**, fill and Continue. **Expect:** step bar Your business · Your first restaurant · Outlets ·
   Your first manager.
3. **Do:** step 2. **Expect:** "Add your first restaurant", no check-in/out times.
4. **Do:** step 3. **Expect:** "Outlets at …" with "<name> dining" (Restaurant) and Bar pre-filled; removing both and Continue
   says to add at least one. Continue → "Outlets saved". Hotel setup → Restaurants & tables later shows them with their stores.
5. **Do:** finish. **Expect:** All set lists the outlets, no "0 rooms".

## 4 · Mixed business (hotel + lounge)

1. **Do:** onboard "QA Venue Mixed <x>" as **Mixed** with a Hotel location (check-in times asked, rooms step for it) and a Lounge
   location (no times, no rooms).
2. **Expect (owner/manager):** with the hotel chosen in the branch box, Rooms/Bookings/Folios and room cards show; switch to the
   lounge and they disappear (pages say "Not used at a lounge"); switch back and they return.

## 5 · Hotels unchanged (Simpas Ikeja)

1. Front office: Today, Bookings, Rooms, Folios as before; new booking, check-in, post a charge to the folio.
2. Bar (`qa.pin.bar`): "Charge to a room" still there and works on a checked-in room; "Charged to rooms" tile and close-shift row present.
3. Manager/finance night audit: arrivals, departures, tills, balances, open tabs checks as before.
4. Owner/manager dashboards: occupancy, arrivals, room status as before (no "vs 72% last month" text).

## Negative cases

- A lounge charging to a room through the API: `POST /fnb/orders/{id}/charge-to-room` → 400 "Charging to a room is switched off here …".
- A lounge that adds a room type and rooms in Hotel setup: room menus and charge-to-room come back (within a minute).
- Front office user at a lounge (if one exists): the home page says "Not used at a lounge".
