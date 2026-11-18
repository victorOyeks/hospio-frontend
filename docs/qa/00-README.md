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
| 32 | `32-daily-fee-and-pos.md` | Hospio's daily fee: 1.5 % of each day's sales (folio nights spread per night, counter sales, laundry, no-show deposits, voids), statements, the 6am debit and its switch, POS pause; each hotel's Moniepoint/OPay keys (masked) and the POS device test | Ready |
| 33 | `33-admin-portal-layout-and-integrations.md` | Admin portal reorganised: grouped menu, Hotels list with a hotel panel, ⌘K search, tabbed Fees & billing and Payments & POS; Integrations (keys and addresses set in the portal, encrypted, server value as fallback, Test connection) | Ready |
| 34 | `34-transfer-on-the-pos.md` | Bank transfer goes to the POS like card (the guest picks card or transfer on the terminal); only cash is recorded at the desk | Ready |
| 35 | `35-pos-decline-reason.md` | A declined card or transfer shows the provider's reason (e.g. Insufficient funds) on screen and in My payments; the screen names the POS it was sent to (the picked terminal is used); 15 s provider check; Moniepoint/OPay call logs | Ready |
| 36 | `36-pos-time-out.md` | A POS payment with no final answer in 5 minutes is marked Timed out; a late approval still settles it; retry and check are offered | Ready |
| 37 | `37-guest-messages-subscribed-vs-hold.md` | Admin Guest messages separates Subscribed (hotel's choice) from On hold (Hospio360, non-payment); hold needs a reason; hotel side explains how to lift it | Ready |
| 38 | `38-hospio-fees-owner-and-manager.md` | Hospio fees: owner and (new) manager see each day's sales, fee and how/when it was debited (provider, reference, failure reason); month picker; nothing to pay | Ready |
| 39 | `39-one-fee-model.md` | One fee model everywhere (share of daily sales, 1.5 % default): new/edit business, onboarding, fee rules, settings, handover; old models refused and existing businesses moved | Ready |
| 40 | `40-reload-notice.md` | The "Reload Hospio360" button works while a side panel or modal is open, and shows Reloading… | Ready |
| 41 | `41-device-packages.md` | Devices & internet packages: catalogue, package per hotel, four payment options, install, daily device line, payments, monthly invoices, overdue steps, owner/manager view | Ready |
| 42 | `42-guest-service-charge.md` | Owner chooses whether guests pay the Hospio fee as a service charge: folio, bar/kitchen, laundry, never in sales | Ready |
| 43 | `43-outlets-serving-each-other.md` | A patio bar selling the kitchen's starters: outlet POS terminal, copy menu (made at the source), Made at, kitchen tickets and Ready, patio serves, one bill on the patio terminal, edge cases | Ready |
| 44 | `44-outlet-switcher.md` | "Serving at" in the sidebar for bars and kitchens with several outlets: neutral menu labels, outlet-named titles, outlet colours, switching keeps the page, All outlets on Tabs and Sales for managers and leads, one-outlet hotels unchanged | Ready |
| 45 | `45-onboarding-pos-terminals.md` | Onboarding → Connections terminals match today: Moniepoint/OPay/test only, provider-specific reference, desk assignment, POS key status | Ready |
| 46 | `46-lock-screen-resume.md` | Resume after the lock screen: the same person goes back to the page they were on (shared-device lock or signing in again), anyone else to their home page; drafts of Check in, New booking, bar sale, kitchen order, till handover and housekeeping report come back for the same person only, cleared on save/cancel/sign-out/someone else, 4 h; no payments, PINs or amounts kept | Ready |
| 47 | `47-samuel-defects-nov.md` | Defect log DEF-076 to DEF-086: empty number fields (tables, menu quantities, choices), outlet store picker and empty lists, cancelling the last dish cancels the order, menu quantity validation, one price change at a time with 'awaiting approval', order-ready notification opens Room service, manager selling by design | Ready |
| 48 | `48-connection-checks.md` | Integrations → Connection checks: live rows from the service that owns each (database, Kafka, POS provider with test mode, WhatsApp, email, SMS with real sender), Run checks again updates the times, nothing sent or charged, no keys shown, Support sees the card | Ready |
| 49 | `49-money-and-stock-fixes.md` | Onboarding → Connections adds a terminal (no error page); a dish sold at one outlet and made at another takes the preparing outlet's stock once (same-named recipe there); cash at front office, bar or kitchen needs that desk's till open (Open your till first, open it in place; card, transfer, room charge, managers and laundry unchanged) | Ready |
| 50 | `50-screen-and-access-fixes.md` | Lounge run fixes: Manager → Departments from real data (board, rota, clock, open work; only the teams the hotel runs; bar orders on the Bar card), onboarding People level choice (staff Can edit, managers Full) and the bar person's price change approved/declined by the manager, price fields replace the prefilled amount and ask above 10×, Category required with inline add, 1 seat, item vs drink, room service only with rooms, account manager's name, no-rooms handover line | Ready |
| 51 | `51-email-whatsapp-sms.md` | Messaging end to end: Connection checks, staff emails (temporary password, invite, reset), guest emails with Guest messages on (confirmation, receipt, stay summary, message), the four WhatsApp templates to the allow-listed number with Infobip's report, SMS only for the phone code (OE Alert, exact text), a hotel with a bad saved email still sends (Reply-To skipped) | Ready |

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
