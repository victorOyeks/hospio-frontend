# QA script · Apply to be a partner (staging)

## Purpose

People who know owners of hotels, lounges, bars or restaurants can now **apply to be a Hospio360 referral partner** on the
website, instead of sending an email. The form is at `/partners/apply`; the partner card on the home page ("Apply to be a
partner") and "Partner program" in the footer open it. Hospio360 reviews each application in the admin portal under
**Marketers → Applications**: **Approve** opens the usual invite form already filled in (20% for 12 months, the standard
terms) and sends the usual invite; **Decline** needs a reason. The applicant gets an email when the application arrives and
when it is declined; an approval sends the usual invite email. Super admins and support get a bell notification for each new
application.

Protection against abuse: a hidden box only scripts fill (their application is thrown away, but they see the normal thank-you),
at most **3 applications an hour** from one internet address and for one email, and a repeat application (one already waiting,
or an email that is already a marketer) shows the same thank-you without making a second record.

## Links

- Website: https://hospio360.com · form: https://hospio360.com/partners/apply
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Password `Hospio123!`. Super admin `amoria@hospio360.com`, support `kola@hospio360.com`, finance admin `tobi@hospio360.com`.
Apply only with `@hospio-qa.test` emails (no email is sent to them; real addresses do get the emails). Use a new email each
time, e.g. `partner.<anything>@hospio-qa.test`. **You can send 3 applications an hour from one network**: plan the steps below
(they use exactly 3), or switch network (phone hotspot) for more.

## 1 · Finding the form

1. **Do:** open the website, scroll to Pricing. **Expect:** the maroon-tinted partner card says 20% of Hospio360's fee, 12
   months, paid monthly, 5% WHT, with the button **Apply to be a partner**.
2. **Do:** click the button. **Expect:** `/partners/apply` opens: "Apply to be a Hospio360 partner", the form on the left and
   "What you earn" on the right (20% of Hospio360's fee · for 12 months per business · paid monthly, statement by the 5th and
   paid by the 15th · 5% WHT, ₦5,000 minimum) with a link to the Referral partner terms.
3. **Do:** in the footer click **Partner program**. **Expect:** the same page.
4. **Do:** open `https://hospio360.com/#partners`. **Expect:** the home page scrolls to the partner card (still there).

## 2 · What the form refuses

1. **Do:** click **Send my application** on the empty form. **Expect:** "Please check the highlighted fields." and a message
   under each field: full name, email, phone, city, state, kinds of business, how many, and the tick box. Nothing is sent.
2. **Do:** fill everything, but email `ada@nowhere`, phone `0803 555`, and leave the box unticked. **Expect:** "Enter a real email
   address, like ada@example.com", "Enter a Nigerian phone number, like 0803 555 0192 or +234 803 555 0192" and "Tick the box
   to say you have read the Referral partner terms and the Privacy Policy".
3. **Do:** phone `+44 7700 900123`. **Expect:** the Nigerian phone message again. `08035550192`, `0803 555 0192`,
   `+234 803 555 0192` and `2348035550192` are all accepted.
4. **Do:** type a very long text in "Tell us about your network". **Expect:** it stops at 500 characters; the counter reads
   500/500.
5. **Do:** click the two links in the tick-box line. **Expect:** the Referral partner terms and the Privacy Policy open in a new
   tab; the form keeps what you typed.

## 3 · A good application (application 1 of 3)

1. **Do:** fill the form with a new `@hospio-qa.test` email, tick Hotels and Lounges, 3–5, a short note and a company name, tick
   the box, **Send my application**. **Expect:** "Application received · Thanks — we'll review and email you within 2 working
   days." The form is gone; **Back to the home page** works.
2. **Do (real address only):** apply with a real inbox. **Expect:** an email "We received your Hospio360 partner application"
   with what you entered. No SMS or WhatsApp.

## 4 · Repeat, and the hourly limit (applications 2 to 4)

1. **Do:** send the form again with the **same email** as step 3. **Expect:** the same thank-you. (In the admin portal there
   is still only one application for that email.)
2. **Do:** send one more with **another new email** (it will be declined in section 6). **Expect:** the thank-you.
3. **Do:** send a fourth within the hour. **Expect:** a red box: "You've sent a few applications in a short time. Please try
   again in an hour, or email us at hello@oyeksglobal.com." What you typed is still in the form.

## 5 · Review and approve (super admin)

1. **Do:** sign in to the admin portal as amoria, open the bell. **Expect:** "New partner application" for each new applicant,
   with their name, city and what they know. Clicking one opens that application.
2. **Do:** open **Marketers**. **Expect:** a tab **Applications** with the number waiting.
3. **Do:** open the tab. **Expect:** applicant, where, what they know (e.g. "Hotels, Lounges · 3–5"), when, and "Waiting".
   Search by name, email or city and filter by status both work.
4. **Do:** click the first applicant. **Expect:** a panel with the name, email, phone (as +234…), city / state, company, their
   note, the versions of the Referral partner terms and Privacy Policy they ticked, and where it was sent from.
5. **Do:** click **Approve**. **Expect:** the invite form, filled with their name, email and phone, "20% · standard" and
   "12 months · standard". You may correct the name, email or phone, or (super admin) pick another share or term.
6. **Do:** **Approve and send invite**. **Expect:** "Marketer login ready" with the invite link and the referral code. The
   application now reads **Approved**, shows who approved it and "Invited as a marketer: <name>" (the name opens the marketer,
   who is Pending at 20% for 12 months).
7. **Do:** open the invite link in a private window, choose a password. **Expect:** the marketer portal with the Referral partner
   terms to accept (as in QA 60 section 2).
8. **Do:** apply again on the website with the approved email. **Expect:** the thank-you; no new application in the admin portal.

## 6 · Decline

1. **Do:** open the second application → **Decline**. **Expect:** "Decline application" stays off until a reason of at least a
   few words is typed.
2. **Do:** type a reason, leave "Include this reason in the email" off, **Decline application**. **Expect:** the application
   reads **Declined** with the reason and "The applicant was not given this reason."
3. **Do (real address only):** decline one with the switch on. **Expect:** the email "Your Hospio360 partner application" is
   polite and includes "A note from our team: <reason>"; with the switch off it gives no reason.
4. **Do:** apply again with the declined email. **Expect:** accepted; a new application appears as Waiting.

## 7 · Who can decide

1. **Do:** as kola (support), open a waiting application → Approve. **Expect:** the share and the term are greyed out at the
   standard terms, with "Only a super admin or finance admin can approve with a different share or term." Approve and Decline
   both work for support.
2. **Do:** as tobi (finance admin), open a waiting application. **Expect:** "Only a super admin or support can approve or
   decline." and no Approve or Decline button.

## 8 · The record

1. **Do:** as amoria, **Changes by Hospio360 → Admin activity**. **Expect:** "Partner application from <name> approved: invited
   as a marketer at 20% for 12 months (<email>)" and "Partner application from <name> declined: <reason>", each with the admin's
   name.

## 9 · Phone and tablet

1. **Do:** open the form on a phone (or Chrome DevTools at 390 wide) and a tablet (820 and 1024 wide). **Expect:** nothing runs
   off the right edge and the page does not scroll sideways; "What you earn" sits above the form; tapping a field does not zoom
   the page; the four "how many" choices fit on one row; the success screen fits.
2. **Do:** open Marketers → Applications in the admin portal at 820 and 1024 wide. **Expect:** no sideways scroll of the page.

## 10 · Nothing else changed

1. **Expect:** the home page, Pricing, and the legal pages (`/legal`, `/legal/referral-partners`, `/legal/privacy`) look as
   before; no street address anywhere (the company is "Oyeks Global Ltd, Lagos, Nigeria").
2. **Expect:** Marketers → Marketers, Statements, Commission lines and Referrals work as before; **Invite a marketer** still
   opens the same form (its standard term now reads 12 months).
