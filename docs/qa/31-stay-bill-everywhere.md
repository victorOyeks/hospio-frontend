# QA script · A stay's bill reads the same on every screen (staging)

## Purpose

Once a guest checks in, the folio is the stay's bill: room, extras (room service, laundry, bar), tax and discounts, and every
payment and refund. Every screen now shows the folio's numbers for that stay:

- the bookings list (**Total** and "₦… due" or "Paid");
- the booking's panel (**Total**, **Paid** and **Balance** at the top, and the **Folio** box);
- the folio list and the folio itself;
- the cards at the top of Bookings ("unpaid", "paid this month").

Before check-in, the booking's own total and payments count, as before.

Other fixes:

- A payment taken on a folio (**Record payment**, check-out) now also counts on its booking.
- **Open full folio** (on a booking) and **Open folio** (on a payment) open that folio, even after check-out when it's closed.

## Links

- Hotel app: https://web-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Front office | `godwin@royalsuites.ng` |
| Manager | `tunde@royalsuites.ng` |

## 1. Extras show in the booking's total

1. Front office → **Bookings** → **In-house**. Pick a guest, or check one in, and note the **Total**.
2. Post an extra to the guest's folio, e.g. a ₦5,000 room-service order charged to the room.
3. Within a few seconds, the row's **Total** has gone up by the extra plus tax, and its "₦… due" matches the folio's
   **Balance**.
4. Open the booking. **Total**, **Paid** and **Balance** at the top match the **Folio** box below: Charges, Payments and Balance.

## 2. A payment clears the balance everywhere

1. On the same booking, **Record payment** → cash for the full balance.
2. The panel shows **Balance ₦0**, and the Folio box shows the same.
3. Close the panel and reload the page. The row says **Paid**, not "₦… due".
4. **Folios**: the guest's folio shows the same Paid and Balance ₦0, with **Paid up**.
5. Manager → **Bookings**: the row's Amount and its payment pill (**Paid**) agree. The **unpaid** card at the top no longer
   counts this guest.

## 3. After check-out

1. Check the guest out.
2. **Bookings** → **All**, search the guest. The row says **Paid**, and the panel's top cards show the folio's total and
   payments (not ₦0 paid).
3. **Payments** → open the payment → **Open folio →**. The folio opens (status closed) with its lines.

## 4. Open full folio

1. Open an in-house booking → **Open full folio →**. The Folios page opens with that guest's folio already open.

## 5. Before check-in nothing changes

1. Make a booking with a 50% deposit and take the deposit.
2. The row says "₦… due" for the other half; the panel shows Total = the room price, Paid = the deposit.

## What to report

- Any screen where a stay's total, paid or balance differs from its folio (after a few seconds and a reload).
- A row saying "₦… due" when the folio's balance is ₦0, or "Paid" when the folio still has a balance.
- **Open folio** or **Open full folio** landing on the list without the folio open.
