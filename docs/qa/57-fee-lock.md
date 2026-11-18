# QA script · Platform fee lock (staging)

## Purpose

The platform fee is the same for everyone: **1.5 % of daily sales** (the platform default, Settings → Fees → share of
revenue). Anywhere a business's % can be set, it shows fixed at the default. A different rate needs a **signed addendum**:
switch on **Different rate (signed addendum)**, enter the rate and the addendum's reference (free text, up to 120
characters, e.g. "ADD-2026-014 signed 18 Nov"). The reference is kept with the fee and the change is recorded in the audit
trail (Changes by Hospio360, area *Fee*). The server enforces it, so an old screen or a direct API call can't skip it.

| Where | What you see |
|---|---|
| Businesses → **Set up a business for them** | Hospio360 fee section |
| Onboarding wizard → step 3 **Fee & contract** | Hospio360 fee card |
| Business page → **Edit business** (and Edit as Hospio360) | Fee & contract section |
| Fees & billing → **Fee rate** (fee model modal) | under the business picker |
| Business page → Overview | Fee card: the rate, and "addendum …" when there is one |

## Links

- Admin portal: https://admin-staging.hospio360.com
- Contract: `docs/plan-daily-fees.md` ("Fee lock") and `docs/onboarding.md` in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Who | Email | Can |
|---|---|---|
| Super admin | `amoria@hospio360.com` | everything below |

Name everything "QA Fee <your initials> …". Use `@hospio-qa.test` emails only.

## 1 · Create at the default

1. **Do:** Businesses → **Set up a business for them**: owner, email, business "QA Fee <initials> A", city.
   **Expect:** Hospio360 fee shows a locked box "**1.5%** of daily sales · platform default"; no rate field.
2. **Do:** **Create business**.
   **Expect:** created; wizard opens. Business page → Overview → Fee: 1.5 %, no addendum. Activity / Changes by Hospio360:
   **no** *Fee* change (the default is not recorded).

## 2 · Create at another rate

1. **Do:** set up "QA Fee <initials> B", switch on **Different rate (signed addendum)**, rate `2`, leave Addendum reference empty → Create.
   **Expect:** "Enter the signed addendum's reference" under the field; nothing created.
2. **Do:** reference `ADD-QA-<initials>-1 signed 18 Nov` → Create.
   **Expect:** created. Overview → Fee card: 2 %, hint "… · addendum ADD-QA-<initials>-1 signed 18 Nov". Changes by Hospio360:
   area *Fee*, "Fee set to 2% of daily sales (addendum ADD-QA-…)", reason = the reference, by you.

## 3 · Onboarding fee step

1. **Do:** open business A's wizard → step 3 **Fee & contract**.
   **Expect:** the locked 1.5 % box and the toggle off.
2. **Do:** toggle on, rate `1.75`, no reference → Continue.
   **Expect:** "Enter the signed addendum's reference"; you stay on the step.
3. **Do:** reference `ADD-QA-<initials>-2` → Continue; then Back.
   **Expect:** step 3 opens with the toggle on, 1.75 and the reference. A *Fee* change "Fee set to 1.75% … (addendum ADD-QA-…-2)".
4. **Do:** toggle off → Continue.
   **Expect:** fee back to 1.5 %, reference cleared; a *Fee* change "Fee back to the platform default 1.5% of daily sales".

## 4 · Edit business

1. **Do:** business B → **Edit business**: change only the phone → Save.
   **Expect:** saved; no new *Fee* change (the fee was sent unchanged).
2. **Do:** Edit business → rate `2.5`, clear the reference → Save.
   **Expect:** "Enter the signed addendum's reference"; nothing saved.
3. **Do:** reference `ADD-QA-<initials>-3` → Save.
   **Expect:** Overview → 2.5 % with the new reference; a *Fee* change with it.

## 5 · Fee rate modal

1. **Do:** Fees & billing → **Fee rate** → business A.
   **Expect:** locked default box; Save rate saves 1.5 % (no change recorded when it was already at the default).
2. **Do:** business B (on 2.5 %).
   **Expect:** the toggle is on with 2.5 and B's reference; the rules list shows "· addendum …" on rules that have one.
3. **Do:** rate `3`, empty reference → Save rate.
   **Expect:** refused under the reference field. With a reference it saves; a *Fee* change is recorded.

## 6 · Server enforcement (developer / API)

1. **Do:** `PUT /tenant/businesses/{id}` with `feeValue: 2` and no `feeAddendumRef` (Swagger, Super admin).
   **Expect:** 400 "The platform fee is 1.5% for everyone. A different rate needs a signed addendum: enter its reference".
2. **Do:** `POST /platform/admin/fees/rules` with `value: 2`, no `feeAddendumRef`.
   **Expect:** the same 400.
3. **Do:** a 121-character reference.
   **Expect:** 400 "The addendum reference can be at most 120 characters".
