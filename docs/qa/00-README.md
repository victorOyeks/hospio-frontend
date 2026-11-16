# QA scripts: test in this order

Staging: https://web-staging.hospio360.com · admin: the admin portal on staging · password for every test account: `Hospio123!`

**Scope.** The scripts set the order and the main flows; they are not the limit of the testing. Each area should
also be covered beyond them: positive and negative scenarios and any edge cases you find, such as boundary
values, empty or invalid input, wrong roles, another hotel's data, repeated or cancelled actions, and
refreshing or going back in the middle of a flow.

**Messages (from 16 Nov 2026).** Staging no longer shows a copy of each email, WhatsApp or SMS on screen (the yellow
"on their way · the text is here to copy too" box). Where a script says to read or copy a message from that box, check the
real email inbox or the phone instead. Emails go to the address on the account. WhatsApp and SMS on staging go only to the
allow-listed number 09035911994, so sign-up and phone codes for any other number won't arrive until texts are opened up.

| # | Script | What it covers | Status |
|---|---|---|---|
| 01 | `01-onboarding.md` | Sign-up, phone code, the 4 setup steps, invite acceptance | Tested (29 defects closed) |
| 02 | `02-front-desk-loop.md` | Rooms, bookings, check-in/out, folios, payments | Ready |
| 03 | `03-operating-day.md` | A full hotel day across desks, tills and night audit | Ready |
| 04 | `04-restaurant-bar.md` | Kitchen and bar orders, tabs, room charges, stock drawn | Ready |
| 05 | `05-sales-history.md` | Bar/kitchen sales list, sale details, collecting unpaid sales | Ready |
| 06 | `06-shared-devices.md` | Shared tablets, PIN switching, auto-lock, device removal | Ready |
| 07 | `07-roles-permissions.md` | Giving, changing, pausing and removing roles | Ready |
| 08 | `08-inventory-stores.md` | Stores, requests, purchase orders, deliveries, counts | Ready |
| 09 | `09-laundry-maintenance.md` | Work orders, out-of-order rooms, guest laundry, linen | Ready |
| 10 | `10-manager-housekeeping-receipts.md` | Reports, activity log, price approvals, budgets, bills, lost & found, inspection, receipts | Ready |
| 11 | `11-email-messaging.md` | Real emails, guest conversations, templates | Ready |
| 12 | `12-profile.md` | Profile, photo, password, devices, 2-step sign-in, email settings | Ready |
| 13 | `13-owner-portal.md` | Owner screens across several hotels | Ready |
| 14 | `14-pagination.md` | Paged lists, search and filters on every growing list | Ready (Staff and Roles lists: see 16) |
| 15 | `15-admin-portal.md` | Hospio360 admin and marketer portals | Ready |
| 16 | `16-small-fixes-1.md` | Bar/kitchen income by outlet, organizations, delivery-log search, owner PIN actions, Inbox for every role, paged Staff and Roles lists | Ready |
| 17 | `17-admin-onboarding.md` | Admin back-office onboarding: Set up a business, steps 1–7 field rules and duplicates, rooms (overlaps, one price per type, paste, edit and delete), data kept on Back, the manager's Choose your password | Ready |
| 18 | `18-guest-message-billing.md` | Guest messages as a paid service: what is charged, on/off, prices (default and per hotel), opt-in at onboarding, monthly invoice, Paystack payment, overdue and suspension | Ready |
| 19 | `19-room-note-def-053.md` | DEF-053 retest: the room's board note is added, changed and removed from the front desk and stays removed | Ready |
| 20 | `20-concurrency-and-scale.md` | Two people at once (check-in, folio money, card retry, bar orders, stock, tills, refunds) done once with correct totals; busy screens with a lot of data | Ready |
| 21 | `21-clock-in-and-leave.md` | Clock in/out (My shifts and the desk's Today), who is on shift, late / not-in / forgot-to-clock-out notices, the every-clock-in switch, leave to owners and withdrawing a request | Ready |
| 22 | `22-rota.md` | Rota tab: everyone listed by department, + in an empty day adds a shift, Copy last week (skips people already on, leave, past days, suspended staff; copying twice adds nothing), week navigation | Ready |
| 23 | `23-shift-and-department-setup.md` | Hotel setup → Staff & shifts: the hotel's own shifts (offered on the rota and Add to the rota) and departments (the rota's headings) added with forms (name + times; name + role buttons), never free text; empty lists keep the built-in ones | Ready |
| 24 | `24-whatsapp-booking-messages.md` | WhatsApp from Hospio360 for booking confirmed, dates changed, cancelled and receipts: banner, details line by line, hotel phone, View booking button; the guest's booking page (no sign-in, call and directions, refuses altered links) | Ready |
| 25 | `25-sms-codes-only.md` | SMS only for the phone verification code (Termii once on); nothing else offers or falls back to SMS: receipts, guest messages, invites, temp passwords, purchase orders and staff notices go by WhatsApp or email | Ready |
| 26 | `26-guest-messaging-settings.md` | Hotel setup → Guest messaging works: the hotel's WhatsApp (Chat on WhatsApp on the booking page and in emails), booking confirmation on/off, the day-before-arrival reminder (once per booking), automatic receipts on/off | Ready |
| 27 | `27-brand-everywhere.md` | Brand & colours: live preview before saving (whole page, pale-colour warning, white sidebar), then the colour, short name and logo in the app for every role, the booking page, booking emails and the WhatsApp banner | Ready |
| 28 | `28-retention.md` | Notifications and chats (staff Inbox and guest conversations) deleted 30 days after creation / last message; activity log kept six months (admin Settings → Security, at least 30 days); the screens say so | Ready |
| 29 | `29-card-payment-status.md` | Card payment at the POS: the screen asks our backend every 4 s and shows approved / declined at once; "Still waiting for the POS" after 3 min with Check again; Moniepoint / OPay placeholders refuse clearly | Ready |
| 30 | `30-retest-def-068-075.md` | Retest of Sam's operating-day defects DEF-068 to DEF-075: rota days field, short-till note to manager and finance, pay-out reason, setup number fields, finance told on day close, organization staff validation and duplicates, reload message | Ready |
| 31 | `31-stay-bill-everywhere.md` | A stay's bill reads the same everywhere: bookings list, booking panel, folio and Bookings cards use the folio's total, paid and balance once the guest is in; folio payments count on the booking; Open folio opens closed folios too | Ready |

## Before you start

- **Every change must show without reloading.** After you save, add, delete or change anything, the screen updates on
  its own: the panel, the list, counts and badges elsewhere on the page. If a change only appears after you reload the
  page, log it as a defect (say which screen and which action).

- **Emails are real.** Invites, receipts and guest messages go to the address typed. Use your own inbox, or `@hospio-qa.test` for throwaway accounts.
- **Accept invites in a private window**, not the owner's browser; accepting signs the invited person in on that browser.
- **Staging is redeployed often.** After a deploy, a "Reload Hospio360" banner appears once on open pages; that is expected, not a defect.
- **SMS is only for sign-in codes; WhatsApp is live. Staging texts only allow-listed numbers**; other numbers show "Held back: not on this environment's allow-list" (expected). Phone codes on staging are `123456`.
- **Card payments can't complete on staging** (the test terminal never confirms). Test cash, transfer and charge to room.
- **Don't change the shared accounts** (tunde, godwin, victor, grace, segun, mariam, femi, jide): no role, password or 2-step changes. Invite your own staff for anything that changes an account.
