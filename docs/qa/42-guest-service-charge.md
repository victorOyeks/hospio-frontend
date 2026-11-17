# QA script · Guests pay the Hospio fee (service charge) (staging)

## Purpose

The owner chooses per hotel whether guests pay the Hospio fee. On: every bill carries "Service charge (x%)" at the business's
fee rate and the hotel keeps its full price. Off (default): the hotel pays the fee as before. The device fee is never passed on.

## Steps

1. As the **manager**: Hotel setup → Money & payments → **Guests pay the Hospio fee** is read-only (the switch is greyed out
   and can't be clicked); saving other payment fields still works.
2. As the **owner**: switch it on and save. The hint names the rate (e.g. 1.5 %).
3. Post a charge on a folio (or check in a guest): the folio shows "Service charge (1.5%) · …" next to each charge; voiding a
   charge voids its service charge; moving a charge moves it too.
4. Bar/kitchen: a new order shows **Service charge** in its totals (1.5 % of the bill before VAT) and the total includes it.
   Charge it to a room: the folio gets the order without it plus its own service charge line (never twice).
5. Laundry paid directly includes it; charged to a room, the folio adds it.
6. Next morning's daily fee: sales do not include any service charge.
7. Switch it off: new charges and orders have no service charge; earlier ones keep theirs.

## What to report

- A service charge on a hotel that has it off, or charged twice on a room-charged order.
- Sales on Hospio fees that include the service charge.
