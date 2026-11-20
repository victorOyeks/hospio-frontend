# QA script · Book a demo replaces self sign-up (staging)

## Purpose

Owner decision (21 Nov 2026): hotels, lounges, bars and restaurants **can no longer sign up by themselves**. Instead:

1. They send the **Book a demo** form on the website.
2. Our team calls them (we promise within 1 working day), meets them and agrees terms.
3. Our team onboards them in the admin console: **Hotel applications → Start onboarding** opens the usual "Set up a business
   for them" panel already filled in, then the 10-step wizard.
4. The owner gets the usual handover invite and signs in. Nobody signs up.

What changed:

- **Website:** a new page `/book-a-demo`. Every "Get started" / "Create an account" button is now **Book a demo** (header,
  hero, video section, pricing, closing banner, features page, footer, FAQ). The copy says laptops and tablets, never phones.
- **Hotel app:** the sign-in page has no "Create your account" link (it says "New to Hospio360? Book a demo"); `/sign-up`
  sends you to the website's Book a demo page, keeping a marketer's `?ref=` code.
- **API:** self sign-up answers **410** "Hospio360 accounts are set up by our team — book a demo at
  hospio360.com/book-a-demo". Staff invites, the owner's handover invite and marketer invites work as before.
- **Admin console:** new **Growth → Hotel applications** with a badge of NEW requests: tabs by status, search, a detail panel
  (status, meeting time, assignee, notes, referral marketer) and **Start onboarding**.

Developer notes: hospio-backend `docs/onboarding.md` ("Applications"), `docs/admin-portal.md`, `docs/sign-in.md`.

## Links and accounts

- Admin console: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com
- Website (staging build): the staging landing address you normally test (see 86). It is deployed by hand (Actions →
  "Deploy landing to staging"); if it isn't reachable, ask a developer to deploy it, or test the form on production after the
  release.
- Password `Hospio123!` · 2-step backup code on staging `159753`.

| Who | Email | Use |
|---|---|---|
| Support | `kola@hospio360.com` | works the requests, Start onboarding |
| Super admin | `amoria@hospio360.com` | same as support |
| Finance admin | `tobi@hospio360.com` | read only (negative case) |
| Marketer | `ese@hospio360.com` | their referral link (section 6) |
| Manager (Royal Suites) | `tunde@royalsuites.ng` | staff invite still works (section 7) |

Test data: business `QA Demo <your initials> <n>`, applicant email `qa.demo.<n>@hospio-qa.test` (the acknowledgement to a
`.test` address is recorded but never sent: expected), phone `0903 591 1994`. Never use a real business or a real person's
email.

## 1 · The website

1. **Do:** open the website home page. **Expect:** the header button says **Book a demo** (not Get started). The hero's
   buttons are **Book a demo** and **See all features**. Pricing, the closing banner and the footer's "Get started" column
   offer **Book a demo**; nothing says "Create an account" or "Start free".
2. **Do:** read the "Getting started" steps and the FAQ "Who sets everything up?" and "Do we need new hardware?". **Expect:**
   Book a demo → Meet our team → We set you up → Sign in and go live; the team sets everything up; "a laptop or tablet". No
   copy mentions phones.
3. **Do:** open `/partners/apply` and `/features`. **Expect:** the same header with **Book a demo**; the features page's
   buttons are **Book a demo** and **Email us**.

## 2 · Send the form

1. **Do:** open `/book-a-demo` and press **Book my demo** with nothing filled. **Expect:** "Please check the highlighted
   fields." and red messages under full name, phone, email, business name, kind of business, city, state, "Average monthly
   sales" and "How did you hear about us?"; the page scrolls to the first.
2. **Do:** type phone `12345`. **Expect:** "Enter a Nigerian phone number, like 0803 555 0192 or +234 803 555 0192".
3. **Do:** pick **Lounge**. **Expect:** no "Number of rooms" box. Pick **Hotel** (or **Mixed**). **Expect:** "Number of rooms
   (optional)" appears and takes digits only.
4. **Do:** fill everything with your test data: Hotel, 24 rooms, Ikeja / Lagos, monthly sales "₦5 million – ₦20 million",
   heard from "Search (Google)", best time
   Morning, a short message. Press **Book my demo**. **Expect:** "Request received · Thanks — we've received your request.
   Our team will call you within 1 working day." and a Back to the home page button.
5. **Do:** send the form again with the **same email** and a new message. **Expect:** the same "received" screen. In the admin
   console there is still **one** request for that email, with a note "Sent the Book a demo form again" and your new message.
6. **Do:** send it 5 more times quickly with different emails. **Expect:** after 5 from one connection in an hour: "You've sent
   a few requests in a short time. Please try again in an hour…" (expected limit, not a bug).

## 3 · The team is told

1. **Do:** sign in to the admin console as support. **Expect:** the bell has "New demo request" for your business; the sidebar
   shows **Hotel applications** under Growth with an amber number (the NEW requests).
2. Emails (a developer can confirm in the messaging records): an acknowledgement to the applicant (SKIPPED "Not sent: test
   address" for `@hospio-qa.test`, expected) and **"New demo request: QA Demo …"** to the support inbox
   (hello@oyeksglobal.com) with every detail you typed.

## 4 · Work the request (support)

1. **Do:** open **Hotel applications**. **Expect:** tabs Open (default), New, Contacted, Meeting booked, Approved, Onboarded,
   Declined, All with counts; your request on top with status **New**, owner name and phone, received time.
2. **Do:** search your business name, then a phone number. **Expect:** the list narrows; clearing the search brings all back.
3. **Do:** click your request. **Expect:** the panel shows the business (kind, city/state, 24 rooms), owner (phone, email,
   best time to call "Morning", heard about us), your message, "No referral: they came direct", and the repeat note from 2.5.
4. **Do:** set **Assignee** to yourself. **Expect:** "Assignee saved"; the Assignee column shows your name; a line "Assigned
   to …" in Notes.
5. **Do:** Status → **Contacted**, **Save status**. **Expect:** "Marked Contacted"; Notes shows "New → Contacted" with your
   name and the time; the NEW badge in the sidebar goes down by one.
6. **Do:** Status → **Meeting booked** without a meeting time. **Expect:** Save status stays disabled and "Set the meeting date
   and time". Set a date and time, Save. **Expect:** status Meeting booked; the list shows the meeting time under the status.
7. **Do:** add a note "Called, demo on Tuesday". **Expect:** it appears at the bottom with your name and time; there is no edit
   or delete (notes are append-only).
8. **Do:** Status → **Approved**, Save. **Expect:** Approved.

## 5 · Start onboarding

1. **Do:** press **Start onboarding** in the panel's footer. **Expect:** "Set up a business for them" opens with a blue note
   "Filled from … request (Hotel, 24 rooms, Ikeja, Lagos)" and the owner's name, email, phone, the business name, city and
   kind already filled.
2. **Do:** press **Create business**. **Expect:** the 10-step wizard opens for the new business, with a maroon line above it
   "From … demo request: Hotel, 24 rooms, Ikeja, Lagos … Open the request".
3. **Do:** finish the wizard as in 87 / 01 (use QA details) up to the handover. **Expect:** the owner's invite as usual.
4. **Do:** go back to **Hotel applications → Onboarded**. **Expect:** your request is there, status **Onboarded**, a green note
   "Onboarded as <business>" linking to the business and the wizard; Start onboarding and the status controls are gone.
5. **Do:** open Changes by Hospio360 → Admin activity. **Expect:** lines "Hotel application from QA Demo …" for each change.

## 6 · Marketer referral

1. **Do:** sign in as the marketer, open **Refer a business**. **Expect:** "Your link" is `https://hospio360.com/book-a-demo?ref=<code>`
   and the subtitle says "Anyone who books a demo through it is yours".
2. **Do:** open the staging website's `/book-a-demo?ref=<code>` (same code) and send a request with a new QA email. **Expect:**
   a line "Referred by a Hospio360 partner (code …)" above the form, and "How did you hear about us?" already "A Hospio360
   partner".
3. **Do:** in the admin console open that request. **Expect:** "Referred by <marketer name> (<code>)"; the list's Referred by
   column shows the name. **Start onboarding** pre-selects that marketer under "Referred by".
4. **Do:** open `https://web-staging.hospio360.com/sign-up?ref=<code>`. **Expect:** you land on
   `hospio360.com/book-a-demo?ref=<code>` (on staging that is the production website, which only has the page after the
   release; checking the address in the bar is enough).

## 7 · Sign-up is off; invites still work

1. **Do:** open https://web-staging.hospio360.com/auth. **Expect:** no "Create your account" link; "New to Hospio360? Book a
   demo".
2. **Do:** open https://web-staging.hospio360.com/sign-up. **Expect:** you are sent to the website's `/book-a-demo`.
3. A developer checks `POST /identity/auth/sign-up` answers **410** with "Hospio360 accounts are set up by our team — book a
   demo at hospio360.com/book-a-demo".
4. **Do:** as `tunde@royalsuites.ng`, invite a staff member (`qa.staff.<n>@hospio-qa.test`), open the invite link in a private
   window and set a password. **Expect:** it works exactly as before.
5. An owner who signed up before 21 Nov and hasn't finished the setup wizard still signs in and lands on the wizard.

## 8 · Wrong roles and negative cases

1. **Do:** sign in as the finance admin and open Hotel applications. **Expect:** the list and details are visible with a note
   "You can read the requests; Support or a Super admin works them…"; no Start onboarding, the selects are disabled, no Add
   note.
2. **Do:** as support, Status → **Declined** without a reason. **Expect:** Save status stays disabled until the reason has 5+
   characters. Save with a reason. **Expect:** status Declined, the reason shown in amber; the applicant is **not** emailed;
   Start onboarding is gone. Status → New reopens it.
3. **Do:** hidden-field check (developer): a request with the `website` field filled is answered "received" and nothing is
   stored.

## 9 · Average monthly sales (added 21 Nov 2026)

The form asks **"Average monthly sales (all outlets combined)"**, required, with five choices: Under ₦1 million · ₦1 million –
₦5 million · ₦5 million – ₦20 million · Above ₦20 million · Prefer not to say. It is information for the call only: nothing is
scored or declined on it. Requests sent before 21 Nov have no answer and show **Not asked**.

1. **Do:** on `/book-a-demo`, look under "Number of rooms" (or the state, for a lounge). **Expect:** the question as five
   cards (two per row on a laptop, one per row on a narrow window; the chosen one turns maroon) and the hint "An estimate is fine. It helps
   us prepare for your call." No copy mentions phones.
2. **Do:** fill everything else and press **Book my demo** without choosing a band. **Expect:** it is not sent: "Please check the
   highlighted fields.", the cards get a red outline and "Choose your average monthly sales (an estimate is fine)", and the
   page scrolls to the question. Choosing a card clears the message.
3. **Do:** send one request per band (5 requests, new QA emails `qa.sales.<band>.<n>@hospio-qa.test`; mind the 5-an-hour
   limit per connection: wait or use a second connection). **Expect:** each gets the "Request received" screen.
4. **Do:** in Hotel applications (support), look at the list. **Expect:** a **Monthly sales** column with the band's words;
   older requests read "Not asked" (grey), "Prefer not to say" is grey too.
5. **Do:** use the **Any monthly sales** filter: pick each band, then "Not asked". **Expect:** only matching requests; the tab
   counts follow the filter; Clear filters brings everything back.
6. **Do:** switch **Newest first** to **Monthly sales: highest first**. **Expect:** Above ₦20 million first, then ₦5–20 million,
   ₦1–5 million, Under ₦1 million, then Prefer not to say, then Not asked; newest first within a band; paging keeps the order.
7. **Do:** open a request. **Expect:** the Business section has **Monthly sales** with the band (e.g. "₦5 million – ₦20 million
   (all outlets, the applicant’s estimate)"); an older request shows "Not asked".
8. A developer confirms in the messaging records: the **"New demo request"** email to the support inbox has a line "Monthly
   sales (all outlets): <band>"; the applicant's acknowledgement does **not** mention it.
9. **Do:** send the form again from one of your emails with a **different** band. **Expect:** still one request; its note
   "Sent the Book a demo form again" says "monthly sales: <new band>"; the request's own band is unchanged.
10. **Clean up:** decline every test request with the reason "QA test".

## Expected vs bug

- Expected: the acknowledgement to `@hospio-qa.test` shows SKIPPED; the website's 5-an-hour limit; staging `/sign-up` going to
  the production website address.
- Bug: a request sent without a monthly sales band; a band shown on the applicant's acknowledgement; "Not asked" on a request sent
  after 21 Nov; the Monthly sales sort putting "Prefer not to say" or "Not asked" above a band.
- Bug: any "Get started", "Create an account" or "Start free" left on the website or the hotel app; a request that doesn't show
  in Hotel applications; a status that changes without a line in Notes; Start onboarding opening an empty panel; an onboarded
  request not linked to its business; a staff or owner invite that fails.
