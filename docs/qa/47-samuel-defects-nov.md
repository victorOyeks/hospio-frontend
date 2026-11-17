# QA script · Defect log fixes DEF-076 to DEF-086 (staging)

## Purpose

Re-test the eleven defects logged on 16–17 Nov (Restaurants & tables, Kitchen orders, Menus, Bar menu, Room service,
Known limits). Each section names the defect, what was wrong, what changed and the steps to confirm it. The house rule
from DEF-041 applies everywhere: a number field with no value starts **empty**; the grey text is a hint, never a value.

## Links

- Hotel app: https://web-staging.hospio360.com
- Users: a manager, a kitchen user with Full access (head chef), a kitchen user with Edit (cook), a bar user, a front
  office user. Simpas Ikeja has all of them.

## 1. Restaurants & tables (manager)

**DEF-076 · Add a table: number pre-filled.** Seats started at *4*.

1. Hotel setup → **Restaurants & tables** → on the *Restaurant* card, **Add a table**.
2. **Seats** is empty and shows the hint *e.g. 4*. **Save** stays off until a table name and a seat count are typed.
3. Type *0* or *-2*: the field reads *Seats is a whole number from 1* and Save stays off. Type *4*: Save works.
4. The API refuses the same (400) when `seats` is below 1.

**DEF-077 · Add outlet: "store it draws stock from" does nothing.** In a hotel with no stores the field was greyed out
and read *Nothing to choose yet*, with no way forward. (In a hotel that has stores, such as Simpas Ikeja, the list opens
and a store can be picked.)

1. **Add outlet** → name, kind → open **Store it draws stock from**: the hotel's stores are listed, plus **No store**.
   Pick *Kitchen store*, Save: the card reads *draws from Kitchen store*.
2. Edit that outlet → pick **No store** → Save: the card reads *no store linked, so no stock is drawn*.
3. In a hotel with no stores yet: the field reads *No store yet · add one in Inventory first* and the hint under it links
   to **Inventory**, where **Add a store** creates one. Back on Add outlet, the new store is in the list.

## 2. Kitchen orders (kitchen user)

**DEF-078 · Cancelled order still shows "All ready" and says "ready · waiter called".** **DEF-085 · Cancelled order stays
on the board.** The order's only dish was taken off with ✕. The order stayed *Cooking*, worth ₦0, and **All ready** said
*K-0002 ready · waiter called* although nothing was marked.

1. **New order** → Takeaway → one dish → **Send to kitchen**. Open its card → ✕ on the dish → reason → **Cancel item**
   (head chef, or a manager, since it was already sent).
2. Toast: *<dish> cancelled · nothing is left, so K-00xx is cancelled*. The panel closes and the card leaves the board;
   after a refresh it is still gone. The order is *Cancelled* in Sales.
3. An order with two dishes: ✕ one of them: the order stays on the board with the other dish (only the one is crossed out).
4. **Cancel order** on a card in the *New* column (a room-service order from front office): *Order cancelled*; the card
   leaves the board and stays gone after a refresh.
5. A bar **tab** whose only drink is removed stays open (more drinks can be added); a bar sale that is not a tab is
   cancelled like a kitchen order.

**DEF-079 · Room picker for Room service does not work.** Not reproduced: in Simpas Ikeja the list opens with every
checked-in guest, and a room can be picked by the Full and the Edit kitchen user, by mouse and by touch. When nobody is
checked in, the field now says so instead of looking broken.

1. **New order** → **Room service** → open **Room**: the checked-in guests are listed (*A205 · guest name*). Pick one,
   add a dish: **Send to kitchen** turns on.
2. In a hotel with nobody checked in, the field reads *Nobody is checked in right now* with a hint that front office
   checks guests in first.

## 3. Menus (kitchen, bar, manager)

**DEF-080 · Add item: quantity pre-filled.** **DEF-082 · Add drink: choices and stock used pre-filled.** The recipe
quantity started at *1* and a choice's price difference at *0*.

1. Kitchen → Menu → **Add item** → **Add stock used**: **Quantity** is empty with the hint *e.g. 0.2*.
2. Bar → Menu → **Add drink** → **Add a group of choices**: the price difference beside the choice is empty (hint *+₦0*);
   empty means no difference. **Add stock used**: the quantity is empty.

**DEF-081 · Edit item: a quantity of -12 is accepted.** The row with -12 was dropped without a word and the item saved
without that ingredient.

1. Manager → Menus → an item with a recipe → set its quantity to *-12*: the field reads *Above 0* and **Save** is off.
   Empty: *Enter how much*. A quantity with no stock item: *Pick the stock item*.
2. A positive quantity (*0.5*) saves and the recipe keeps it.
3. The API refuses the same (400 *Every recipe line needs a stock item and a quantity above zero*).

**DEF-086 · Cook's price change shows no "awaiting approval" and a second one can be asked.**

1. As a cook (Edit), Menu → *Pancakes* → **Change price** → *3,800*, a reason → **Save price**: *Price change sent to the
   manager*. The row reads *₦3,500* with **₦3,800 awaiting approval**, and still does after a refresh.
2. **Change price** again: the panel says *₦3,800 is already waiting for the manager's approval* and **Save price** is
   off. The API answers 400 with the same sentence.
3. Manager → Approvals → **Decline** it: the cook's row loses the tag (refresh) and a new change can be asked. A manager
   or head chef (Full) still changes the price at once.

## 4. Room service (front office)

**DEF-083 · Tapping "order ready" opens Today's dashboard.**

1. Room service → new order for a checked-in guest → send it. The kitchen marks it **Ready**.
2. Notifications → *Order K-00xx is ready* → **Open →**: Room service opens with that order's panel.

## 5. Known limits

**DEF-084 · The manager has no New sale (bar) or New order (kitchen).** By design for now. The manager's web screens are
oversight: Menus, prices and approvals, Restaurants & tables, and every outlet's Sales (where a manager can take payment,
charge to a room or cancel a sale). Selling is done from the bar and kitchen desks, where the cash goes into that
person's till; a manager has no till, so cash they took would belong to no till. A manager who needs to sell is given the
Bar or Kitchen role as well and switches to it (the API already lets a manager act on any outlet's orders).

## What to report

- Any number field that opens with a value already in it.
- A card on the kitchen or bar board with every item crossed out, or a *ready* toast for an order with nothing on it.
- A price change that does not show *awaiting approval*, or a second request accepted while one waits.
- A notification that opens a page without the order.
