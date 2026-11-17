# QA script · Outlets serving each other (staging)

## Purpose

A hotel opens a second bar, the **Patio Lounge**, that sells drinks plus starters the Kitchen cooks (pepper soup, suya).
The guest gets one bill at the patio; the kitchen sees only what it has to cook, as a ticket, and marks it ready; the patio
serves it and takes the money on its own POS. Works the same for any hotel and any pair of outlets.
See hospio-backend fnb-service (feature/outlet-kitchen-tickets).

## Links

- Hotel app: https://web-staging.hospio360.com
- Users: a manager, a bar user (Edit), a kitchen user (Edit), a kitchen user with Full access (head chef).
- The hotel already has a **Kitchen** (KITCHEN) with starters on its menu and a **Bar** (BAR) with drinks, and at least one
  POS terminal.

## 1. Create the Patio Lounge (manager)

1. Hotel setup → **Restaurants & tables** → **Add outlet**: name *Patio Lounge*, kind **Bar**, the bar's store,
   **POS terminal**: pick a terminal (the list shows every terminal of the hotel; offline ones say *Offline*). Save.
2. The card reads *Bar · draws from … · pays on <terminal>*. **Add a table**: *Patio 1*, *Patio 2*.
3. Edit the outlet, set **POS terminal** to **Use the role's terminal**, save: the *pays on* part disappears. Set it back
   to the terminal.

## 2. Copy the menus (manager)

1. Menus → pick **Patio Lounge** → **Copy menu from…** → *Kitchen*. The categories load as pills with their item counts;
   pick *Starters*. **Keep them made at Kitchen** is on by default (the source is a kitchen). **Copy items**.
2. Toast: *N added, 0 already on the menu*. The starters show with a blue **Made in Kitchen** tag.
3. **Copy menu from…** → *Bar*: the switch is **off** by default (a bar's drinks are poured here). Leave every category
   unpicked (copies all) → toast *M added, 0 already on the menu*. Drinks have no tag.
4. Copy *Kitchen · Starters* again: *0 added, N already on the menu* (names are matched in any case).
5. Edit *Pepper soup* on the patio: **Made at** shows *Kitchen*. Change it to **This outlet**, save: the tag goes. Set it
   back to *Kitchen*. The hint under the field says the item goes to the kitchen as a ticket.

## 3. Order at the patio (bar user)

1. With more than one bar the sidebar shows **Serving at** under the branch card: pick **Patio Lounge** (remembered on
   this device; Tabs, Menu and Stock follow it; see QA 44).
2. Open a tab on *Patio 1* with 2 Chapman (drink) and 1 Pepper soup. Tabs → the tab card shows *Pepper soup* with
   **Sent to Kitchen**.
3. Add another Pepper soup from **Add drinks**: toast *Added to the tab · sent to Kitchen*.

## 4. The kitchen cooks it (kitchen user)

1. Kitchen → Orders: the *Cooking* column has a card **From Patio Lounge · Table Patio 1** listing only the pepper soups,
   no amount, no *to pay*, and a **Ready** button.
2. Open it: the panel says Patio Lounge keeps the bill; lines have their own **Ready**; there is no total, no Take payment,
   no Charge to room, no Close ticket, no Cancel.
3. Mark one line **Ready**, then **All ready** (or **Ready** on the card): the card moves to *Ready to serve* and reads
   *Waiting for Patio Lounge to collect*.
4. The kitchen's own orders behave as before: New order → Start → Ready → Served → Take payment → Close ticket.

## 5. The patio serves and gets paid (bar user)

1. Refresh Tabs: the pepper soup reads **Ready in Kitchen · collect**; the tab panel shows a **Served** button on it.
   Tap **Served**: it reads *Served*. The kitchen's card leaves its board on the next refresh.
2. **Close & pay**: one bill with the drinks and the pepper soups. Card: the **Patio Lounge terminal** is preselected
   (while it is online; offline → the bar's own terminal as before). Pay.
3. Sales (bar or manager) → filter **Patio Lounge**: the sale is there with every line; the Kitchen's sales don't include it.

## 6. Edge cases

1. **Made at another hotel's outlet**: the Made at list only offers this hotel's outlets; an API call with another hotel's
   outlet id is refused (404 *The outlet that makes it isn't one of this hotel's*).
2. **Kitchen can't serve**: the ticket has no Served button; a kitchen-only user calling
   `PUT /fnb/orders/{id}/lines/{lineId}/status?status=SERVED` on it gets 403.
3. **Bar can't mark the kitchen's lines ready**: the patio screens show only the status; a bar-only user calling
   `POST /fnb/orders/{id}/stations/{kitchenId}/ready` gets 403.
4. **Copy skips duplicates**: step 2.4.
5. **Copy needs a manager or Full access**: a bar or kitchen user with Edit has no **Copy menu from…** button; calling
   `POST /fnb/outlets/{id}/menu/copy` as them gets 403. A head chef (Full) on the kitchen sees the button.
6. A single bar and a single kitchen (most hotels): no **Serving at** switcher, no **Made at** field when there is no other outlet,
   no **Copy menu from…**; everything else as before.

## What to report

- A ticket that shows money or a payment action on the kitchen board.
- A line made at the kitchen that never reaches the kitchen, or a kitchen card that stays after the patio served it.
- The wrong terminal preselected, or a sale counted under the kitchen.
