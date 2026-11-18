# QA script · Marketer (referral partner) commission (staging)

## Purpose

Marketers now earn on what Hospio360 actually collects, and are paid by a manual monthly statement:

| Rule | What it means |
|---|---|
| Commission | 20 % of the **platform fee actually collected** from each business the marketer referred (the daily % of sales debit). Nothing on a day that wasn't collected; a carried-over day earns when it is collected |
| Not included | Device share, data plans, message charges, VAT. No sign-up bonus |
| How long | 12 months per business, from the business's **first collected fee**. Changing the marketer doesn't restart the 12 months |
| WHT | 5 % of the commission is deducted; net = commission − WHT |
| Clawback | A refunded or reversed collected fee takes the commission on it back, as a negative line on the next statement |
| Statement | Made on the **5th** for the month before. The marketer has **7 days** to raise a query |
| Payout | Finance approves, pays by bank transfer outside Hospio360 **by the 15th**, records the reference, date and amount; the marketer gets a "you've been paid" email |
| Minimum | Under **₦5,000** the statement is *Carried over* and rolls into the next one |

Also new: the marketer must accept the **Referral Partner Agreement (RPA-2026-11)** before their referral link shows;
bank details are bank + 10-digit account number + account name, a change needs a reason and finance must **Mark
checked** before a statement can be approved; a hotel signing up with `?ref=HM-…` (or typing the code) is linked to the
marketer; admins change "Referred by" on the business page or the onboarding fee step, with a reason (audit-logged).

## Links

- Admin portal (admins and marketers): https://admin-staging.hospio360.com
- Hotel app sign-up: https://web-staging.hospio360.com/sign-up
- Contract: `docs/plan-marketers.md` in hospio-backend (and `docs/plan-daily-fees.md` for the daily fee)

## Accounts

Password for every account: `Hospio123!`

| Who | Email | Can |
|---|---|---|
| Super admin | `amoria@hospio360.com` | invite marketers, change Referred by, QA fee simulation, make statements |
| Finance admin | `tobi@hospio360.com` | statements: approve, record payment, export; mark bank checked; record refunds |
| Your marketers | the ones you invite, `@hospio-qa.test` | marketer portal |
| Your hotel owner | the one you sign up, `@hospio-qa.test` | hotel app |

Name everything "QA Mkt <your initials> …". Use `@hospio-qa.test` emails only. Phone: any `+234800…` number (staging holds
texts to other numbers back; the phone code on staging is `123456`).

**Emails on staging:** email to `@hospio-qa.test` is recorded *Skipped · Not sent: test address* (QA 54) and never
leaves Hospio360. So for "statement ready" and "you've been paid" you check that the email was **created** (Admin →
Integrations → Email deliveries, or ask the developer for the delivery record), not your inbox. That is expected.

## Staging-only: simulating the daily debit

Real Moniepoint/OPay debits are never used on staging. A Super admin can switch **one test hotel** to a simulated
debit and answer each debit by hand. These calls exist only on staging (`QA_FEE_SIMULATION=true`) and only for
Super admin; there is no screen for them, use the API (Swagger at https://api-staging.hospio360.com, "platform") or ask
the developer to run them:

| Call | What it does |
|---|---|
| `PUT /platform/admin/qa/hotels/{hotelId}/simulated-debit` `{"businessId": "…", "on": true}` | The hotel's daily fee is "debited" by the simulator; the 06:00 run never touches it |
| `POST /platform/admin/qa/fees/daily/work-out` `{"businessId","hotelId","date":"2026-11-18"}` | Works out that one hotel's fee for a day (other hotels untouched) |
| `POST /platform/admin/qa/fees/daily/{dailyFeeId}/debit` `{"result":"APPROVED","amount":10000}` or `{"result":"FAILED"}` | One debit try: collected (all that's left, or the amount) or failed |

Never switch a real customer's hotel to the simulator. Only hotels you created for this test.

## 1 · Invite a marketer; agreement first

1. **Do:** admin portal as Super admin → **Marketers** → **Invite marketer**: "QA Mkt <initials> A", `qa.mkt.a.<initials>@hospio-qa.test`.
   **Expect:** in the list, status *Invited*; share 20 %, 12 months.
2. **Do:** accept the invite (the developer gives you the invite link, as the email is skipped on staging), choose a password, sign in.
   **Expect:** dashboard shows the **Referral Partner Agreement** card with the key terms above and a tick box. The referral
   link, copy and WhatsApp share are **not** shown: "Accept the agreement to get your referral link".
3. **Do:** tick and **Accept**.
   **Expect:** "Accepted <today> (RPA-2026-11)"; the link `https://web-staging.hospio360.com/sign-up?ref=HM-XXXXXX` and
   WhatsApp share appear. Admin → Marketers → open the marketer: agreement version, when and by whom.

## 2 · Bank details

1. **Do:** marketer → **Add bank details**: pick a bank, type `01234` → Save.
   **Expect:** refused: the account number is 10 digits.
2. **Do:** 10 digits and the account name → Save.
   **Expect:** "Waiting for finance to check these details".
3. **Do:** change the account name → Save without a reason.
   **Expect:** "Why are you changing them?" is required. With a reason it saves and is again *waiting for finance*.
4. **Do:** finance (`tobi@`) → Marketers → open the marketer.
   **Expect:** bank details with the change note and **Mark checked**. Don't press it yet (section 6 needs it unchecked).

## 3 · A hotel signs up with the link

1. **Do:** open `https://web-staging.hospio360.com/sign-up?ref=HM-NOPE99`.
   **Expect:** under Referral code: "That referral code isn't recognised".
2. **Do:** open the marketer's own link.
   **Expect:** Referral code prefilled; "Referred by <first name>".
3. **Do:** sign up: owner "QA Mkt <initials> Owner", `@hospio-qa.test`, phone `+234800…`, business "QA Mkt <initials> Hotel", Lagos.
   Phone code `123456`.
   **Expect:** sign-up works. Admin → Businesses → the business → Overview: **Referred by: QA Mkt <initials> A (HM-…)**.
4. **Do (negative):** an ended marketer's code, or a marketer who hasn't accepted the agreement.
   **Expect:** "That referral code isn't active"; sign-up with it is refused with that message (clear the field to sign up without it).

## 4 · Go live, trade, collect

1. **Do:** as the owner, finish the setup wizard (add one hotel) → **All set**.
   **Expect:** the business is Live. Marketer → **My businesses**: the business, agreement *Active*, "12 months start with the first collected fee".
2. **Do:** take a booking / post charges (cash only; no card on staging).
3. **Do:** Super admin (API, see above): simulated debit on for this hotel; work out today; debit **APPROVED**.
   **Expect:** Admin → Fees & billing → Daily fees: the day *Paid*. Marketer → **Commissions** → *Next statement so far*:
   one line: fee collected, 20 %, WHT 5 %, net. Example: fee ₦15,000 → commission ₦3,000 → WHT ₦150 → net ₦2,850.
4. **Do:** another day: debit **FAILED**. **Expect:** no new commission line (nothing collected).
5. **Do:** the next day: work out (the failed day is carried in) → debit APPROVED with part of it, then APPROVED again.
   **Expect:** one line per collection, each marked "Includes fee carried from earlier days"; together they equal 20 % of
   everything collected. A device share on the day never earns.

## 5 · Refund (clawback)

1. **Do:** finance → Fees & billing → Daily fees → a paid day → **Record refund**: more than was collected.
   **Expect:** refused ("At most NGN … can be given back").
2. **Do:** a smaller amount with a reason.
   **Expect:** the day shows *Refunded ₦…*; marketer's next statement lines show a **negative** clawback line (e.g. refund
   ₦4,000 → −₦800 commission, −₦40 WHT, −₦760 net).

## 6 · Statement, query, approve, pay

1. **Do:** Super admin → Marketers → **Statements** tab → **Make statements** for the current month (staging allows the
   current month so you don't wait for the 5th).
   **Expect:** your marketer's statement *Ready* (draft) with lines per business, clawback, WHT, net, payable. Running it
   again makes no second statement.
2. **Do:** marketer → Commissions → open the statement → **Raise a query** with a note.
   **Expect:** status *Queried*; admin sees an alert "Marketer statement queried" and the note on the statement.
3. **Do:** finance → Statements → the statement → **Answer and approve** with an answer.
   **Expect:** refused: check the marketer's bank details first.
4. **Do:** finance → Marketers → the marketer → **Mark checked**; back to the statement → **Answer and approve**.
   **Expect:** *Approved*; the answer shows to the marketer; the alert is cleared.
5. **Do:** **Record payment**: reference "QA-TRF-<initials>", date today, amount prefilled with the payable.
   **Expect:** *Paid* with reference and date; the marketer sees *Paid* and the reference; a "you've been paid" email is
   created (recorded *Skipped · test address* on staging, see above). A different amount or a future date is refused.
6. **Do:** **Export CSV** (finance). **Expect:** one row per statement with totals, bank details, reference.

## 7 · Under the minimum (carry-over)

1. **Do:** a second marketer B whose month earns under ₦5,000 net (one small collected day) → Make statements.
   **Expect:** B's statement *Carried over* "Under ₦5,000 · rolls into the next statement"; no approve or pay buttons.
   Next month's statement shows it as *Carried in* and pays both together once the total is ₦5,000 or more.

## 8 · Changing the marketer

1. **Do:** Super admin → the business → Overview → Referred by → **Change** → marketer B, reason.
   **Expect:** Referred by shows B. Marketer A → My businesses: agreement *Ended <today>*; B → *Active from today*,
   earning until the same date as A's would have (12 months from the first collected fee, not restarted).
   Admin → **Changes by Hospio360** lists "Referred by changed from A to B" with the reason.
2. **Do:** collect a fee for today. **Expect:** the line goes to B only, never both.
3. **Do:** onboarding fee step of a business in onboarding → Referred by: pick a marketer, give a reason, Change.
   **Expect:** same rules; a business not yet live opens the agreement when it goes live.
4. **Do (negative):** change to an ended marketer. **Expect:** refused. Reactivating an ended marketer does **not** reopen
   their ended agreements; only new referrals earn.

## 9 · Wrong roles and other checks

| Who | Tries | Expect |
|---|---|---|
| Finance admin | QA simulation calls, Make statements | 403 / no button |
| Support | Statements tab, approve, pay | not shown / 403 |
| Marketer | another marketer's statement (URL) | not found |
| Marketer | query after 7 days, or a paid statement | refused |
| Anyone | old per-line "Mark paid" | gone; the API refuses new lines |

Regression: owner and manager **Hospio fees** pages, admin **Fees & billing** tabs, existing marketer **Ese**
(`ese@hospio360.com`) portal loads and asks her to accept the agreement first.

**Bug vs expected:** a commission on a day that wasn't collected, two marketers earning on the same day, a line on the
device share, a statement approved with unchecked bank details, or a "paid by the 5th" / "waiting on hotels" wording
anywhere is a **bug**. Emails to `@hospio-qa.test` being *Skipped* is **expected**.
