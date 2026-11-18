# QA script · Screen and access fixes from the lounge test run (staging)

## Purpose

Re-test what the lounge-only test run (18 Nov) found on screens every hotel uses: the manager's Departments board showed
made-up teams and names, people added in admin onboarding all got Full access (so a bartender's price change skipped the
manager), typing a price added to the old one (₦25,003,000), the menu item form hid that Category is required, and a few
wordings (1 seats, drinks for food, room service with no rooms, "Assigned" for the account manager, room prices with no
rooms).

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com
- Contract: hospio-backend `docs/admin-portal.md` (platform `GET /platform/departments/live`), identity `POST /identity/users`

## Accounts

| Who | Email | Notes |
|---|---|---|
| Super admin | amoria@hospio360.com | onboarding wizard, business page |
| QA Lounge manager | manager.lounge.qhye@hospio-qa.test | lounge only: no rooms |
| QA Lounge bar / kitchen / owner | bar.lounge.qhye@…, kitchen.lounge.qhye@…, owner.lounge.qhye@… | existing accounts keep Full; do not change them |
| Simpas Ikeja manager / bar / kitchen | tunde@royalsuites.ng, segun@royalsuites.ng, mariam@royalsuites.ng | a hotel with rooms |

Password `Hospio123!`. Never change the shared accounts' roles, levels, passwords or 2-step. Don't touch "Patio Lounge".

## 1. Manager → Departments shows the hotel's real teams

1. As the QA Lounge manager open **Departments**. Only the teams this business runs appear (Kitchen and Bar for a lounge; no
   Front office, Housekeeping or Laundry when there are no rooms and nobody in those roles). No "Rooms ready to sell" card.
2. Each card: "N on shift · nobody on today's rota" (or "N scheduled"), the team's open work (orders open, tabs and sales open),
   actions in the last hour, the time and text of the last action, or "—" and "Nothing recorded in the last 24 hours".
3. No made-up names or rooms anywhere (no "Ngozi Okonkwo · B110", "A210 ready", "14 of 16 on shift").
4. "Staff on shift" says "N of M" when there is a rota today, otherwise "N clocked in" with "Nobody on today's rota →".
5. Make a bar sale as the bar user, wait a minute (the page re-reads every minute) or reload: the **Bar** card's actions last hour
   and last action change. A bar order no longer lands on the Kitchen card.
6. As tunde at Simpas Ikeja: all eight teams with real numbers (arrivals left, rooms to clean, laundry orders, open repairs,
   orders open, tabs, store requests, tills open), Maintenance red when a repair is urgent or overdue.
7. Open any card: the team page shows the same numbers, its people and its live activity; no page error.

## 2. Admin onboarding → People: the level is chosen, staff start at Can edit

1. As the super admin open Onboarding → QA Lounge → step 7 People. The table has a **Level** column (Full / Can edit / View only).
2. **Add a person**: Role Manager shows Access level **Full (usual for this role)**. Change Role to Bar: the level follows to
   **Can edit (usual for this role)** with the hint that the manager approves price changes.
3. Add a bar person (email `…@hospio-qa.test`) without touching the level: the row says **Can edit**.
4. Add a kitchen person and pick **Full** yourself: the hint warns that Full skips the manager; the row says **Full**.
5. Picking a level by hand keeps it when you change the role again; after adding, the next person starts from the role's usual
   level.
6. Existing people keep the level they had (the lounge's bar and kitchen users stay Full).
7. Paste a staff list: managers come in at Full, everyone else at Can edit.

## 3. The new bar person's price change goes to the manager

1. Sign in as the new bar person (temporary password from step 7, then choose a password). Open **Menu**.
2. **Change price** on an item: click into the prefilled price and type `3000`. The field shows **3,000**: the old amount is
   selected on entry and replaced, never added to.
3. Type `30000` for a ₦1,500 item and **Save price**: a warning "₦30,000 is more than 10 times the current ₦1,500. Check the
   number…" and the button reads **Yes, ₦30,000 is right**. Correct it to `3000` (the warning goes) and save.
4. Toast "Price change sent to the manager"; the row shows the old price and "₦3,000 awaiting approval".
5. As the manager open **Approvals**: "Change Star Lager (Main Bar) from ₦1,500 to ₦3,000", asked by the new person. **Approve**:
   the price is ₦3,000 on the menu.
6. Ask again for another item and **Decline** it with a reason: the old price stays and "awaiting approval" goes.
7. A manager (or a Full user) changing a price still applies it at once; the 10× question also appears for them.

## 4. Menu item form: Category is required

1. As the manager open Menus → an outlet with categories → **Add item**: Category has the red required star.
2. For an outlet with no categories (no items and none added): Category reads "No categories yet" with "Add a category below
   first", and a box offers **New category / Add category** in the form. Add one: it is picked and Save can be used.

## 5. Wording

1. Hotel setup → Restaurants & tables: a table with one seat says "1 seat"; Kitchen new order's table picker the same.
2. Bar menu of a hotel with a kitchen: the header button is **Add item**; the form says **Add drink** while Made at is this bar
   and **Add item** when Made at is the kitchen; the toast follows ("Drink added" / "Item added").
3. Bar → New sale with the kitchen's peppered chicken: "Pick the items…", footer "1 item · ₦4,500" (drinks only: "drinks");
   the tab panel's list is titled Items when it holds food.
4. Kitchen board at the lounge: "Kitchen · 0 open · …" and New order offers Dine-in and Takeaway only; at Simpas: "Restaurant and
   room service · …" with Room service.
5. Admin → business → Contract & activity (and Overview, wizard, fees): Account manager shows the person's name, not
   "Assigned".
6. Owner's handover acceptance: with rooms, "N rooms · Room types and prices set"; with 0 rooms, "0 rooms · No rooms: bars,
   restaurants and lounges only".

## 6. What is a bug

- Any demo name, room or number on Departments, or a team shown that the hotel does not run.
- A new non-manager person created at Full without the admin picking it; an existing person's level changed.
- A price change by a Can edit user applied without the manager; typing into a price adding to the old amount.
- Save on the item form silently disabled with no categories.
- A page error or the 500 page on any screen above.
