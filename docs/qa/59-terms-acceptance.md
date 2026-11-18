# QA script · Terms acceptance and the legal pages (staging)

## Purpose

Customers accept the Hospio360 terms **online by ticking boxes**; every acceptance is kept as a record that can't be changed.

- **Owners** tick two boxes: (1) "I agree to the Terms of Service, Privacy Policy and Data Processing Terms on behalf of my business";
  (2) "I authorise Hospio360 (a product of Oyeks Global Limited) to debit 1.5% of my business's daily sales from my business account
  each day at 06:00". The rate in box 2 is **that business's rate**: 1.5% (the platform default) unless it has a signed addendum
  rate (then e.g. "debit 1.2% …"), and the record keeps the rate shown. At **self sign-up**, or at the **handover** screen when Hospio360 onboarded them. The admin never ticks for
  them: in the handover step the admin records **how the links were shared** (channel + date).
- **Staff** tick "I agree to the Staff terms of use" at their first sign-in. **Marketers** tick the Referral partner terms.
- **Device packages**: the owner ticks the Devices & equipment terms (Hospio fees → Devices & internet) before Hospio360 can mark
  the devices installed (or the admin enters a signed device schedule's reference).
- **New versions**: when a document gets a new version, the people who accept it see a modal at their next page and can't
  continue until they accept (or sign out).
- **Records**: admins see them on the business page → **Acceptance** (with Export CSV); the owner in My profile → **Terms &
  acceptances**.
- Existing owners, staff and marketers see the modal **once** at their next sign-in: that's expected.

Contract: `docs/legal-acceptance.md` in hospio-backend.

## Links

- Legal pages: https://hospio360.com/legal (terms, privacy, data-processing, fees, devices, support, referral-partners, staff-terms)
- Hotel app: https://web-staging.hospio360.com · Admin portal: https://admin-staging.hospio360.com

## Accounts

Password: `Hospio123!`. Super admin `amoria@hospio360.com`. Make new owners and staff with `@hospio-qa.test` emails only (no email
is sent to them). **Never accept the terms on behalf of a real person's account** (amoria, tobi, tunde, segun, victor, godwin): for
those, only check that the modal appears, then sign out.

## 1 · Legal pages

1. **Do:** open https://hospio360.com/legal. **Expect:** 8 documents with version and "effective 18 November 2026"; footer has
   a Legal column (Legal, Terms of Service, Privacy Policy, Fees).
2. **Do:** open Terms of Service. **Expect:** title, version TOS-2026-11, contents, sections, "Oyeks Global Limited (RC 10001123),
   registered office 9 Remi Omoniyi Crescent, Ikorodu, Lagos State, Nigeria · hello@oyeksglobal.com"; no "[ ]" placeholders.
   https://hospio360.com/terms goes to /legal/terms.
3. **Do:** Terms → 17. Notices. **Expect:** "…by hand or courier to our registered office at 9 Remi Omoniyi Crescent, Ikorodu, Lagos
   State, Nigeria." (no "full address on request"). The version stays TOS-2026-11 and nobody is asked to accept again (an address
   is not a material change; the text lives on this site, the version in the platform).
4. **Do:** Terms → 5.6 and Fees → 4.4. **Expect:** fees for days before automatic debit is switched on are not collected unless
   agreed in writing.
5. **Do:** the footer of any page. **Expect:** "9 Remi Omoniyi Crescent, Ikorodu, Lagos State, Nigeria" and **hello@oyeksglobal.com**
   (also the Contact, Support, demo and pricing links).

## 2 · Self sign-up

1. **Do:** `/sign-up`, fill the form, leave both boxes empty, **Create account**. **Expect:** a message under each box; nothing created.
2. **Do:** click each link in the boxes. **Expect:** Terms, Privacy Policy, Data Processing Terms and Fees open on hospio360.com
   in a new tab.
3. **Do:** tick both, **Create account**. **Expect:** account created, Check your phone. Admin → the business → **Acceptance**:
   four rows (Terms, Privacy, Data Processing, Daily debit), "Ticked · Self sign-up", the owner's name, IP and browser.

## 3 · Owner onboarded by Hospio360

1. **Do (admin):** onboarding wizard → step 10 → **Send handover**. **Expect:** the confirm box asks "Links shared by" and "On";
   **Send handover** stays off until a channel is chosen. Choose WhatsApp, today.
2. **Expect:** business → Acceptance: four rows "Links shared by WhatsApp on <date>" by the admin; the note says the owner hasn't
   accepted yet.
3. **Do (owner):** sign in with the temporary password, choose a password. **Expect:** the handover screen shows the two boxes;
   "Accept and go to my dashboard" stays off until both boxes and the handover box are ticked.
4. **Do:** tick and accept. **Expect:** dashboard, no modal. Acceptance tab: four rows "Ticked · Handover" by the owner.

## 3b · The debit box states the business's rate

1. **Do (admin):** on a **QA business you created** whose owner hasn't accepted yet, Fee rate → Different rate (signed addendum):
   1.2%, reference `ADD-QA-1`.
2. **Do (owner):** sign in (handover screen, or the modal on first sign-in). **Expect:** box 2 reads "…to debit **1.2%** of my
   business's daily sales…". Tick and accept. Acceptance tab: "Daily debit authority (1.2%)".
3. **Do:** a business at the default. **Expect:** "1.5%"; `/sign-up` always shows the platform default.
4. **Expect:** if the rate changes while the box is open, accepting is refused ("Your business's daily fee is …% of daily sales,
   not …%. Reload the page and read it") and nothing is recorded.
5. **Do (admin):** put the QA business back to 1.5%.

## 4 · Staff first sign-in

1. **Do:** as the owner add a staff member (`@hospio-qa.test`), sign in as them (accept invite or temporary password).
   **Expect:** "Before you continue · Please accept to continue." with one box (Staff terms of use), Sign out
   and Accept and continue, nothing else; the screen behind can't be used.
2. **Do:** tick, **Accept and continue**. **Expect:** modal closes; Acceptance tab: "Staff terms of use · STAFF-2026-11 · Ticked ·
   First sign-in" with the staff member's role and hotel.

## 5 · Device terms

1. **Do (admin):** business → hotel → Devices & internet: set up a package (e.g. 2 tablets, from transactions) and open **Mark installed**.
   **Expect:** a warning that the owner hasn't accepted the device terms, and a "Signed device schedule reference" field; Mark
   installed stays off without it.
2. **Do (owner):** Hospio fees → Devices & internet. **Expect:** "Before Hospio360 installs these devices" with the Devices terms box.
   Tick, **Accept device terms**. **Expect:** "Device terms accepted by <owner> on <date> (DEV-2026-11)".
3. **Do (admin):** Mark installed. **Expect:** the modal says the terms were accepted; installed without a reference. Acceptance tab:
   "Devices & equipment terms · Ticked · Device package".

## 6 · A new version

1. **Do (Super admin):** Platform → **Legal documents** → Publish a new version: Staff terms of use, version `STAFF-2026-11-QA`,
   effective today, not material, "QA test". **Expect:** it shows **In force**; the old one **Replaced**.
2. **Do:** sign in as the staff member from 4. **Expect:** "Before you continue · We've updated our terms. Please accept to continue." with
   the Staff terms box. Accept. Acceptance tab: "Ticked · New version".
3. **Do:** try a material change effective in 10 days. **Expect:** refused: "A material change needs 30 days' notice".

## 7 · Records

1. **Do:** business → Acceptance → **Export CSV**. **Expect:** a CSV with every row (when, event, how, document, version, person,
   email, role, business, IP, browser, record id).
2. **Do (owner):** My profile → **Terms & acceptances**. **Expect:** your documents (accepted / to accept, coming versions) and the
   business's records.

## 8 · Marketers

1. **Do:** sign in as a QA marketer who hasn't accepted (e.g. a new one). **Expect:** the modal with the Referral partner terms; after
   accepting, the portal works and their referral code is valid.
2. **Regression:** QA 55 still passes (agreement, statements, payouts).

## 9 · Regression

- Existing users sign in normally and see the modal once (owners: two boxes; staff: one).
- Support "View as owner" never shows the modal.
- Onboarding wizard, marketer portal and each role's home load as before.
