# QA script · Short Book a demo form, WhatsApp button and Meta Pixel (staging / local)

## Purpose

The Meta ad (Lagos hotel owners) sends people to `hospio360.com/book-a-demo`. In 2 days 214 visitors came, nearly all on
Android phones inside the Facebook / Instagram app, and **nobody sent the form**: on a phone the first screen showed only the
heading and the maroon "What happens next" box, and the form had about 11 required questions over 4 screens.

Owner decisions (22 Nov 2026):

- **Form first on phones and tablets.** Below laptop width the page shows the heading, one short line, then the form;
  "What happens next" moves **below** the form. On a laptop nothing moves (form left, "What happens next" right, sticky).
- **Short form.** Only **Your full name, Phone, Business name** and **What kind of business?** are required. Everything else
  (email, city, state, rooms, average monthly sales, how you heard, best time to call, message) is optional, under a closed
  **"Tell us more (optional)"** section. An optional answer that is filled is still checked, with the same message.
- **No email given:** no confirmation email (the success screen doesn't promise one); a repeat is found by **phone**; the hourly
  limit counts the phone. The team's email subject shows "(city)" only when a city was given.
- **Backoffice:** a missing email, city/state or "heard about us" shows **Not given** (never "null" or a stray comma).
- **"Prefer WhatsApp? Chat with us"** (green outline button next to / under **Book my demo**) opens WhatsApp with
  "Hello Hospio360, I'd like a demo for my business". It is shown only when the build has `NEXT_PUBLIC_SALES_WHATSAPP`
  (production: GitHub variable `SALES_WHATSAPP`).
- **Meta Pixel** (production build only, `NEXT_PUBLIC_META_PIXEL_ID` from the GitHub variable `META_PIXEL_ID`): PageView on every
  page, **Lead** when a demo request is sent, **Contact** on the WhatsApp button, **CompleteRegistration** when a partner
  application is sent. Nothing typed in the forms goes to Meta. The Privacy Policy (11.2 "Measuring our adverts") says so.

## Setup

- The landing site is **not** deployed by a push to staging. Run it locally against the staging API (the fallbacks are staging):
  `export PATH=$HOME/.bun/bin:$PATH; cd apps/landing; bun run build && bun run start` (port 3003). For the WhatsApp button and the
  pixel, build with `NEXT_PUBLIC_SALES_WHATSAPP=2349035911994 NEXT_PUBLIC_META_PIXEL_ID=<id>`; build again without them for the
  "unset" checks.
- A phone-sized window (390 × 844, ideally the Facebook in-app browser or its user agent), a tablet width (820) and a laptop
  (1440).
- Backoffice: `admin-staging.hospio360.com` as a QA support or super admin.
- Test data: name `QA Short Demo`, phone `0803 555 01xx` (a new xx each time), business `QA Short Demo Ltd`. Delete the QA rows
  afterwards (developer).

## 1 · First screen

1. **Do:** open `/book-a-demo` at 390 × 844. **Expect:** header, "Book a demo", the heading "See Hospio360 on a business like
   yours", one short line ("We call you within 1 working day and set everything up with you."), then the white form card with
   "Tell us about your business" and the **name and phone boxes visible without scrolling**. "What happens next" is below the form.
2. **Do:** scroll. **Expect:** Business name, the five type chips, the closed "Tell us more (optional)" row, the privacy line,
   **Book my demo** (full width) and, when the number is set, **Prefer WhatsApp? Chat with us** under it. Then "What happens next".
3. **Do:** 820 wide. **Expect:** the same order (form first), name and phone side by side.
4. **Do:** 1440 wide. **Expect:** as before 22 Nov: the longer intro paragraph, form left, maroon "What happens next" and
   "Included" right, sticky while scrolling. Buttons side by side.

## 2 · Required and optional

1. **Do:** press **Book my demo** with nothing filled. **Expect:** "Please check the highlighted fields." and red messages under
   **only** full name, phone, business name and kind of business. "Tell us more" stays closed.
2. **Do:** open "Tell us more (optional)". **Expect:** Email, City, State, Number of rooms (Hotel / Mixed only), Average monthly
   sales cards, How did you hear about us?, Best time to call you, Anything we should know?. Closed again by tapping its row.
3. **Do:** fill the four required ones, open the section, type email `nope@`, close the section, press **Book my demo**.
   **Expect:** not sent; the section **opens by itself** and scrolls to "Enter a real email address, like ada@example.com".
   City `#` → "Enter the name of your city". Clear them: no message.

## 3 · Short request (staging)

1. **Do:** name `QA Short Demo`, phone `0803 555 01xx`, business `QA Short Demo Ltd`, **Hotel**; nothing else. Send.
   **Expect:** "Request received" and "Thanks — we've received your request…", **without** "We've sent a confirmation to your
   email".
2. **Expect (developer, staging DB):** one row in `platform.hotel_applications` with `email`, `city`, `state`, `heard_from`,
   `monthly_sales` null and phone `+23480355501xx`. No "received" delivery to the applicant; the team's email subject is
   "New demo request: QA Short Demo Ltd" (no "(null)").
3. **Do:** backoffice → Hotel applications. **Expect:** the row shows "Hotel" (no " · null, null", no trailing comma) and the
   owner's phone. Open it: City / state **Not given**, Email **Not given**, Heard about us **Not given**, Monthly sales **Not
   asked**; the panel subtitle is "Received …" with no place. Search `QA Short` finds it.
4. **Do:** send the short form again with the **same phone** written `+234 803 555 01xx` and business `QA Short Demo Two`.
   **Expect:** "received"; still **one** request, with a note "Sent the Book a demo form again · business: QA Short Demo Two".

## 4 · Full request

1. **Do:** a new phone, fill everything in "Tell us more" (email `qa.short.<n>@hospio-qa.test`, Ikeja / Lagos, 24 rooms, a band,
   Search (Google), Morning, a message). **Expect:** "Request received" **with** "We've sent a confirmation to your email". The
   backoffice shows every answer as before.

## 5 · WhatsApp button

1. **Do:** with `NEXT_PUBLIC_SALES_WHATSAPP` set, press **Prefer WhatsApp? Chat with us**. **Expect:** a new tab to
   `https://wa.me/2349035911994?text=Hello%20Hospio360%2C%20I'd%20like%20a%20demo%20for%20my%20business` (WhatsApp opens with the
   greeting typed; don't send it in QA).
2. **Do:** build without it. **Expect:** no WhatsApp button at all (no gap left).

## 6 · Meta Pixel

1. **Do:** build with `NEXT_PUBLIC_META_PIXEL_ID` set, open `/book-a-demo` with the browser's network tab. **Expect:**
   `connect.facebook.net/en_US/fbevents.js` loads and a `facebook.com/tr?…ev=PageView` request goes. Go to another page with a
   header link: another `ev=PageView`.
2. **Do:** send a short request. **Expect:** one `ev=Lead` (`cd[content_name]=Book a demo`) and no name, phone or email in any
   facebook.com request.
3. **Do:** press the WhatsApp button. **Expect:** `ev=Contact`.
4. **Do:** build without the id. **Expect:** no request to `facebook.com` or `connect.facebook.net` at all.
5. **Do:** open `/legal/privacy`, section 11. **Expect:** 11.2 "Measuring our adverts" (pages visited, demo request sent, no
   form contents, how to opt out).

## Bug if

- On a phone the first screen shows "What happens next" before the form, or the name box is below the fold.
- Anything other than the four required questions blocks sending when empty.
- "null", "undefined" or a stray comma shows anywhere in Hotel applications or the team's email.
- The success screen promises a confirmation email when no email was given.
- The WhatsApp button shows without the variable, or the pixel loads (any facebook.com request) without its id.
- Copy on the page says Hospio360 is used on a phone (it is used on a laptop or tablet).

## Run on 22 Nov 2026 (developer, local landing build against the staging API)

- 390 × 844 with the Facebook in-app user agent: name and phone on the first screen, What happens next below the form; 820 the
  same order; 1440 unchanged (form left, aside right). Empty send: only the four required messages; "Tell us more" closed.
- Short request (`0803 555 0141`, Hotel): stored with email, city, state, heard_from and monthly_sales null; only the team email
  ("New demo request: QA Short Demo Ltd", no city); success screen without the confirmation-email sentence. Repeat with
  `+234 803 555 0141`: one row, note "Sent the Book a demo form again · business: QA Short Demo Two".
- Full request (`0803 555 0142`, every optional answer): all stored; acknowledgement (SKIPPED, test address) and team email
  "(Ikeja)"; success screen promises the confirmation email.
- Backoffice (admin-staging, Kola): list "Hotel" with no place, detail Not given / Not asked, no "null"; search "QA Short" finds both.
- WhatsApp (built with 2349035911994): `https://wa.me/2349035911994?text=Hello%20Hospio360%2C%20I'd%20like%20a%20demo%20for%20my%20business`,
  new tab. Built without: no button.
- Pixel (built with the id; `www.facebook.com` blocked in the test browser so nothing reached Meta): fbevents.js loaded,
  PageView on load and on a header link to /features, one Lead per request (`content_name` Book a demo), Contact on the
  WhatsApp button, no name / phone / email / business in any request. Built without the id: no facebook request at all.
- QA rows deleted afterwards. Screenshots: `~/Desktop/Hospio test screenshots/Short demo form (22 Nov 2026)/` 01–15, 20.
