# QA script · Bar till and cash: each desk's own till, tills left open, one till per person, Sale done stays (staging)

## Purpose

Four problems the owner hit at Simpas Ikeja on 20 Nov (Patio Lounge, a bar attendant who also has view-only front office):

1. **Cash was taken without opening a till today.** The bar till he had opened on Wed 18 Nov was never closed, so cash kept going
   into it. Now a till **left open from an earlier day** (opened on an earlier day and 12 hours or more ago) takes no cash: the
   payment step says **"Count and close the old till first"** and the server refuses cash with "Open your till first: the bar till
   was opened by … on Wed 18 Nov, 4:06pm and never closed. Count and close it on the Till page, then open today's till before
   taking cash". A night shift that runs past midnight is not affected.
2. **The bar's Till page showed another desk's till.** It showed the front office till (opened by QA PIN Front), its cash and its
   past tills, because the page asked for "my till" without saying which desk. Each Till page now reads **its own desk's till**:
   the bar page the bar till, the kitchen page the kitchen till, the cashier page the cashier till, the front office page the front
   office till. The page says which till it is and who opened it: "Bar till · open since … · opened by …".
3. **Count & close closed one till, then another.** Closing on the bar page closed the front office till; the page then showed the
   bar till and Count & close was still there. Now Count & close closes exactly the till on the page, once (a second close of the
   same till is refused: "This till is already closed"), and the page then says "The bar till is closed · open it before taking
   cash". A person can't hold two tills: opening a second desk's till while one they opened is still open is refused ("You already
   have the front office till open (since …). One person holds one till: count and close it or hand it over first").
4. **The Sale done panel closed by itself** under a second after a cash payment with "Don't send". It now stays until you tap
   **Back to bar** or **Another sale** (the same fix covers kitchen, room service, tabs and the cashier's payment panels).

Also fixed on the way:

- A till whose expected cash has kobo (split bills: ₦3,333.33) could not close as "matches": counting ₦37,915 against ₦37,915.47
  said "Short by ₦0" and asked for a note. A difference under ₦1 now counts as a match.
- **Opening, moving cash in and closing a desk's till needs Edit on that desk.** Someone with view-only on the front office can no
  longer close the front office till.
- **My payments** says where the cash went ("Into the bar till", laundry "Handed in"), and the payment step's Cash choice says
  "Goes into the bar till (opened by …)"; the done screen says "The cash is in the bar till."
- **Finance → Tills** marks a till "Left open from an earlier day".
- A manager approving a **cash refund** of a bar, kitchen, front office or cashier payment needs that desk's till open (the cash
  comes out of it): "This cash refund comes out of the bar till, and it isn't open. Open it first, then approve the refund".

**The rule (unchanged): one till per desk.** A till belongs to the desk (front office, bar, kitchen, cashier) at a location, not to a
person. Everyone working the bar takes cash into the bar till, whoever opened it; a waiter's cash goes into the cashier's till. The
page now says so: "This is the bar till: everyone working the bar shares it and their cash goes into it. <name> opened it."

## Links

- Hotel app: https://web-staging.hospio360.com (Till page: **/dashboard/till**)
- Contract: hospio-backend `docs/operating-day.md` → Tills → "One till per desk, one till per person, tills left open"

## Accounts

Password `Hospio123!`. QA venue: **QA Lounge Wuse Bar** (Main Bar, VIP Lounge, Kitchen).

| Who | Email | Desk |
|---|---|---|
| Bisi (bar; also **Cashier · View** since 20 Nov, like the owner's bar attendant) | `bar.lounge.qhye@hospio-qa.test` | Bar (pick **Bar** at "Choose how you want to work today") |
| Chika | `cashier.lounge.qhye@hospio-qa.test` | Cashier |
| Wale | `waiter.lounge.qhye@hospio-qa.test` | Waiter |
| Chidi | `kitchen.lounge.qhye@hospio-qa.test` | Kitchen |
| Tunde (manager) / Kemi (owner) | `manager.lounge.qhye@` / `owner.lounge.qhye@hospio-qa.test` | no till |
| QA PIN Front / QA PIN Cashier | `qa.pin.front@` / `qa.pin.cashier@hospio-qa.test` | Simpas Ikeja front office / cashier |

Don't use Segun, Victor, Mariam, Tunde (Royal Suites), Godwin or the real **Patio Lounge** setup. Don't count or close a till a real
person opened (Mariam's kitchen till at Simpas Ikeja is open since 18 Nov: leave it). Pay with **cash** only; receipts **Don't send**.

## 1. The Till page is the desk's own till

1. **Do:** Bisi → pick **Bar** → **Till**. **Expect:** the title line "Bar till · open since … · opened by you" (or "opened by
   <name>" with a blue note "This is the bar till: everyone working the bar shares it …") or "The bar till is closed · open it
   before taking cash". Never Chika's cashier till, although Bisi can view the cashier desk.
2. **Do:** look at **Cash in this till** and **Past tills**. **Expect:** only bar entries and bar tills.
3. **Do:** Chika → **Till**. **Expect:** the cashier till, "Cashier till · …".
4. **Bug if:** a page shows another desk's till, or the cash list belongs to another till.

## 2. A till left open from an earlier day

Set-up: a till opened yesterday or earlier and never closed (QA PIN Cashier's cashier till at Simpas Ikeja was open from 19 Nov when
this was written; any QA till you leave open overnight works).

1. **Do:** open that desk's **Till** page. **Expect:** a red note "Left open since <day, time>: This … till was opened on an earlier
   day and never closed, so it takes no cash. Count & close it now, then open today's till before taking cash". Finance → Tills
   shows the pill "Left open from an earlier day".
2. **Do:** take a sale → **Take payment** → **Cash**. **Expect:** red note **Count and close the old till first** with the server's
   sentence (who opened it and when) and **Go to the Till page**; **Count cash** is disabled. Card and transfer still work.
3. **Do:** **Pay in / out** → Pay in ₦500. **Expect:** refused "This till has been open since … Count and close it, then open
   today's till before putting cash in". (Pay out still works.)
4. **Do:** **Count & close** (count what it says should be there) → **Close till**. **Expect:** toast "Till closed · counts
   match"; the page: "The … till is closed · open it before taking cash" and **Open till**.
5. **Do:** **Open till** with a float → take the cash sale again. **Expect:** it goes through; the new till lists it.
6. **Bug if:** cash is accepted into a till from an earlier day, or a till opened last night (same shift past midnight) is refused.

## 3. Count & close closes the till on the page, once

1. **Do:** Bisi (Bar) → Till with the bar till open → **Count & close**. **Expect:** the box says "Count & close the bar till ·
   Opened by … · should be ₦… in the drawer".
2. **Do:** count the exact amount → **Close till**. **Expect:** "Till closed · counts match"; the page shows the bar till closed.
   **Count & close is gone** (only **Open till**). No other desk's till appears.
3. **Do:** in a second browser tab still showing the old page, press **Count & close** → **Close till** again. **Expect:** "This till
   is already closed"; nothing else is closed.
4. **Do:** a till whose expected cash has kobo (a split bill paid in cash): count the naira amount. **Expect:** "Counts match.", no
   note needed; Past tills says "matches".
5. **Bug if:** a second press closes another till, or the page jumps to another desk's till.

## 4. One person, one till

1. **Do:** someone with two desks (Bisi works Bar; ask a manager to give a QA account a second desk at **Edit**, e.g. Kitchen) opens
   the bar till, then picks the other desk and opens its till. **Expect:** refused "You already have the bar till open (since …).
   One person holds one till: count and close it or hand it over first".
2. **Do:** open the bar till while another bar person already has it open. **Expect:** "The bar till is already open (opened by …,
   since …). Cash at the bar goes into it". Take cash: it goes into that till.
3. **Do:** Hand over the till to a colleague who already holds another desk's open till. **Expect:** refused, "<name> already has
   the … till open".
4. **Do:** someone with **view-only** on a desk tries to close or open that desk's till. **Expect:** refused (only the desk at Edit or
   Full, a manager or finance).

## 5. Sale done stays on screen

1. **Do:** Bisi (Bar) → **New sale** → one drink → **Take payment** → **Cash** → **Count cash** → enter the amount → **Cash
   received** → **Don't send** → **Record payment**. **Expect:** toast "₦… in cash recorded · No receipt sent" and the **Sale done**
   panel ("₦… · B-00xx · Paid by cash", the lines). Wait 15 seconds: **it is still open**.
2. **Do:** tap **Another sale**. **Expect:** a new sale panel. Repeat and tap **Back to bar**: the panel closes.
3. **Do:** the same at **Tabs** (Close & pay a tab in cash), **Kitchen** (pay a walk-in order in cash), front office **Room
   service**, and the cashier's **To pay**. **Expect:** the done step stays until you close it.
4. **Do:** front office → a folio → **Take payment** in cash (QA PIN Front, Simpas Ikeja, front office till open). **Expect:** the
   "… recorded" screen stays until **Done**; "The cash is in the front office till."
5. **Bug if:** any done panel closes by itself.

## 6. Every role that takes payments

| Role | Has a till? | Cash rule to check |
|---|---|---|
| Front office | Front office till | needs it open and from today; Till page shows it |
| Bar | Bar till | as above |
| Kitchen / restaurant | Kitchen till | as above |
| Cashier | Cashier till | as above |
| Waiter (where Lounge setup allows waiters to take cash) | none: the cashier's | cashier till open and from today, else "The cashier's till isn't open" |
| Laundry | none | not asked; "Count it and hand it in"; My payments says "Handed in" |
| Manager / owner | none | not asked; cash shows on Today's money as cash taken with no till |

For each: take a cash payment with the till closed, with a till from an earlier day, and with today's till open. **Expect** the
refusals and the success above, and the payment on the right till's list.

## 7. Cash refunds

1. **Do:** manager → Payments → a bar cash payment → **Refund** → approve while the bar till is closed. **Expect:** "This cash refund
   comes out of the bar till, and it isn't open. Open it first, then approve the refund".
2. **Do:** open the bar till, approve again. **Expect:** approved; the bar till shows "Cash refund" −₦….

## 8. Regression

1. Card and transfer at every desk: unchanged (test terminal only).
2. A bar or kitchen till opened today: cash, pay in / out, hand over and close as before.
3. Night audit and Finance → Tills list every open till with who opened it.
