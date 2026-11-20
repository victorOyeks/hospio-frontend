# QA script · Manager and owner cash into the desk's till (staging)

## Purpose

Until 20 Nov a manager's or owner's cash (Financials → Outlet sales, Payments → Record a payment, a folio's Record payment,
check-in, check-out, a booking's payment) was recorded with **no till**: it never reached a drawer, no till counted it, and it only
showed on Today's money as "cash taken with no till".

Now it goes into **the till of the desk where the sale or payment happens**, the same drawer the desk's staff use:

| What is paid | Till |
|---|---|
| A bar sale (Main Bar, VIP Lounge) | the bar till |
| A kitchen or restaurant sale | the kitchen till |
| A folio, a booking (deposit, check-in, check-out) or a walk-in on Payments → Record a payment | the front office till; at a location with no rooms walk-in cash is refused (take it on the sale screen) |
| Cashier and waiter screens | the cashier's till (as for staff; a manager sees these screens only if they also hold that role) |

- The cash counts in that till's **Should be in the drawer**, its **Cash in this till** list and its **Count & close**.
- If that till isn't open today, the cash is **refused**, as for staff: the payment step says **"Open the bar till first"** and lets
  you count a float and **Open the bar till** in place. A till left open from an earlier day says **"Count and close the old till
  first"** (managers get a link to **Financials → Tills**).
- A manager or owner may open any desk's till. The one-person-one-till rule still applies to desk staff; it does not stop a manager
  who opens the bar till and then the front office till for those desks.
- Card and transfer are unchanged. Laundry is unchanged (laundry hands its cash in; it has no till).
- Cash a manager or owner took **before** this change stays as it was (no till) and Today's money still lists it.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract: hospio-backend `docs/operating-day.md` → Tills → "Manager and owner cash"

## Accounts

Password `Hospio123!`. Venue: **QA Lounge Wuse Bar** (Main Bar, VIP Lounge, Kitchen).

| Who | Email | Use |
|---|---|---|
| Bisi (bar) | `bar.lounge.qhye@hospio-qa.test` | opens sales, owns the bar Till page |
| Manager (QA Lounge) | `manager.lounge.qhye@hospio-qa.test` | Financials → Outlet sales, Payments |
| Owner (QA Lounge) | `owner.lounge.qhye@hospio-qa.test` | Financials → Outlet sales |

Don't use Segun, Victor, Amoria, Tobi, Tunde (Royal Suites), Godwin or Mariam, or the real Patio Lounge. Don't count or close a till a
real person opened (Mariam's kitchen till at Simpas Ikeja). Pay with **cash**; receipts **Don't send**. No card pushes.

## 1. A manager's bar sale with the bar till closed is refused

Set-up: Bisi opens a bar sale and leaves it unpaid (**New sale** → a drink → close the panel, or open a tab). The bar till is closed
(Bisi: **Till** → **Count & close**, count what it says).

1. **Do:** Manager → **Financials → Outlet sales** → the sale → **Take payment** → **Cash**. **Expect:** amber note **Open the bar
   till first**: "Your cash goes into the till of the desk where it is taken: the bar for this sale, and that till isn't open. Count
   the float in its drawer and open it here, or take card or transfer instead", an **Opening float** box and **Open the bar till**.
   **Count cash** is greyed out.
2. **Do:** (API or a second tab) send the cash anyway. **Expect:** 400 "Open the bar till first: your cash goes into the till of the
   desk where it is taken (the bar for this sale), and that till isn't open…". Nothing is recorded.
3. **Bug if:** the cash is recorded while the bar till is closed, or the note names another till.

## 2. The manager opens the bar till and takes the cash: it is in the bar till

1. **Do:** in that note enter a float (e.g. ₦1,000) → **Open the bar till**. **Expect:** toast "Bar till opened · Float ₦1,000 · now
   take the cash"; the note goes and the Cash choice says "Goes into the bar till (opened by <you>)"; **Count cash** works.
2. **Do:** **Count cash** → the amount → **Cash received** → **Don't send** → **Record payment**. **Expect:** "Payment recorded … The
   cash is in the bar till."
3. **Do:** Bisi → **Till**. **Expect:** "Bar till · open since … · opened by <manager>"; **Cash taken** and **Should be in the
   drawer** include the sale; **Cash in this till** lists it ("Cash payment · <guest>").
4. **Do:** Manager → **Financials → Today**/**Tills**. **Expect:** the bar till's expected cash includes it; the payment is not added
   to "cash taken with no till". Payments lists it under the bar desk, taken by the manager.
5. **Do:** Bisi → **Count & close** the bar till, count what it says. **Expect:** "Counts match": the manager's cash is part of the
   count.
6. **Bug if:** the cash is missing from the bar till or its count, or shows as cash with no till.

## 3. The same for the owner

1. **Do:** with the bar till closed, Owner → **Financials → Outlet sales** → an unpaid bar sale → **Take payment** → **Cash**.
   **Expect:** "Open the bar till first" as in 1.1 (no Financials link: the owner has no tills page).
2. **Do:** open it in place, take the cash. **Expect:** the cash is in the bar till (Bisi's Till page shows it, opened by the owner).
3. **Do:** owner with the bar till **already open** (opened by Bisi). **Expect:** "Goes into the bar till (opened by Bisi Bar
   Staff)"; the cash lands in Bisi's till.

## 4. Front desk: folio, booking and walk-in cash go into the front office till

1. **Do:** at a **hotel** (a location with rooms; at QA Lounge see 4b), Manager → **Payments → Record a payment** → no folio, a
   walk-in name → **Cash**. **Expect:** with the front office till closed, an amber note **Open the front office till first** ("… the front office for a folio, booking or walk-in …"), a float box
   and **Open the front office till**; **Record payment** is greyed out.
2. **Do:** open it with a float → **Record payment**. **Expect:** recorded; the note becomes "The cash goes into the front office
   till (opened by <you>)" before you record. The front office till (Financials → Tills) expects the float plus the cash.
3. **Do:** at a hotel, a folio's **Record payment** and check-in/check-out cash. **Expect:** the same front office till rules.
4. **Bug if:** a folio or walk-in cash payment by a manager lands in no till or in an outlet's till.

## 4b. A location with no rooms: walk-in cash is refused

QA Lounge has no rooms, so it has no front office.

1. **Do:** Manager (or owner) → **Payments → Record a payment** → no folio, a walk-in name → **Cash**. **Expect:** amber note
   **Take this cash on the sale screen**: "Cash at a lounge is taken on the bar or kitchen sale screen, where it goes into that
   outlet's till. Open the sale there and take the cash. Card and transfer still work here". No float box or open button; **Record
   payment** is greyed out.
2. **Do:** send the cash anyway (API). **Expect:** 400 with the same sentence; nothing recorded, no till opened.
3. **Do:** pick **Card · POS** or **Transfer** instead. **Expect:** allowed as before (don't send a card to a real POS).
4. **Do:** a bar sale on Outlet sales with cash. **Expect:** unchanged: it goes into the bar till (section 2).
5. **Do:** at a hotel (a location with rooms) the same walk-in cash. **Expect:** the front office till rules in section 4.
6. **Bug if:** a lounge, bar or restaurant without rooms asks to open a front office till for walk-in cash.

## 5. Kitchen and other checks

1. **Do:** Manager → a kitchen sale → Cash with the kitchen till closed. **Expect:** "Open the kitchen till first".
2. **Do:** a desk till left open from yesterday. **Expect:** red **Count and close the old till first** with the server's sentence
   ("… Count and close it (Financials → Tills, or the bar's Till page) …") and, for a manager, **Go to Financials → Tills**.
3. **Do:** Card or transfer by a manager. **Expect:** unchanged (no till asked; staging can't complete a card anyway: don't push).
4. **Do:** Financials → Today on a day with older manager cash. **Expect:** cash taken before this change still shows as "cash taken
   with no till"; nothing moved.
5. **Do:** a cash refund of the manager's bar payment (Payments → the payment → Refund → approve). **Expect:** needs the bar till
   open ("This cash refund comes out of the bar till…"), like a bar attendant's cash.

## Known limits

- The owner's approval of a refund sent to them arrives after the decision; it is not refused if the till has closed since. The
  manager's approval (which sends it to the owner) already needs the till open.
- A restaurant whose kitchen cash is collected by a cashier: a manager's cash for a kitchen sale on Outlet sales goes into the
  kitchen till, not the cashier's.
