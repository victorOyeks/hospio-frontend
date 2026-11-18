# QA script · Email: test addresses never sent, honest Email health, one test email (staging)

## Purpose

Three email changes from 18 Nov:

1. **Test addresses are never sent.** An email to a reserved test domain — `.test`, `.example`, `.invalid`, `.localhost`,
   `.local`, or `example.com` / `.org` / `.net` (and their subdomains) — is recorded *Skipped* "Not sent: test address" and
   never reaches Brevo. Every kind of email (invite, temporary password, reset, receipt, statement, handover, welcome…), on
   every server. The action that asked for it still succeeds, and screens that say "sent to …" still work.
2. **Honest Email health in Connection checks.** Emails to test addresses are not counted and are never the "last email";
   delivered and bounced count only emails sent since Brevo's delivery tracking started. With no real email since then the
   row says "No real emails since delivery tracking started" and is **not** an error. Email is an error only when real
   addresses fail: the last 3 real emails all failed, or 10% or more of at least 10 tracked real emails bounced.
3. **Send a test email.** The Brevo card (Integrations, Super admin only) sends one short email ("Hospio360 test email —
   delivery tracking check") to a real inbox, recorded like any delivery, so Brevo's *delivered* report shows in Connection
   checks a minute later. Test addresses are refused; one a minute at most.

## Links

- Admin portal: https://admin-staging.hospio360.com → Integrations (Brevo card; Connection checks at the bottom)
- Hotel app: https://web-staging.hospio360.com
- Contract: hospio-backend `docs/email.md` ("Test addresses are never sent", "Delivery tracking"), `docs/integrations.md`
  ("Email health", `POST /platform/admin/integrations/brevo/send-test`)

## Accounts

| Who | Email | Notes |
|---|---|---|
| Super admin | amoria@hospio360.com | Integrations, Send a test email, Connection checks |
| Support | kola@hospio360.com | Sees Connection checks, not the Brevo card |
| QA owner B | qa.ownerb.fcekd@hospio-qa.test | Adds a staff member in step 1 |

Password `Hospio123!`. **Real email only in step 3, and only to an inbox you own and agreed to use** (one email). No SMS or
WhatsApp. Don't change the shared accounts' roles, passwords or 2-step.

## 1. A test address is recorded Skipped, never sent

1. As QA owner B, People → **Add staff** with a new `qa.emailtest.<n>@hospio-qa.test` email. The staff member is created and
   the screen says the invite/temporary password was sent as before (no error).
2. (Admin / database) `messaging.deliveries` for that address: status **SKIPPED**, error **"Not sent: test address"**,
   `provider_message_id` empty — nothing went to Brevo. Brevo's transactional log has no email to that address.
3. Repeat with any flow you like (a receipt to a guest with `guest@example.com`, a reset for a `…@hospio-qa.test` user): each is
   *Skipped* the same way and the action itself succeeds.
4. A real-domain address (your own, only if you agreed to receive it) is still sent: `SENT`, then `DELIVERED`.

## 2. Connection checks: honest Email row

1. Integrations → **Connection checks** → **Run checks again**.
2. The Email row never names a `.test` address and never says "bounced" because of test addresses; it says how many emails
   to test addresses were left out ("n emails to test addresses not counted").
3. With no real email since tracking started it reads "Tracking since 18 Nov 12:30. No real emails since delivery tracking
   started. …" and the pill is **connected**, not error.
4. After step 3 below it reads "Last email: delivered … ago. Tracking since 18 Nov 12:30; last 7 days (real addresses): 1 sent,
   1 delivered, 0 bounced (0%)." and is **connected**.
5. Support (kola@) sees the same row. Running the checks sends nothing.

## 3. Send a test email (Super admin)

1. Integrations → **Brevo** card → *Send a test email*. Type `qa@hospio-qa.test`: the field says "A test address (.test,
   .example, example.com…) can never receive email" and **Send a test email** stays disabled. (The server refuses it too:
   "Not sent: that is a test address …".)
2. Type a real inbox you own → **Send a test email**. Within ~10 s: "Brevo accepted the test email. Its delivery shows in
   Connection checks → Email once Brevo reports it, usually within a minute". The box empties; the address is never shown in
   the answer.
3. Press it again within a minute: "A test email was sent less than a minute ago. Wait a minute, then try again"; nothing is sent.
4. The inbox gets **Hospio360 test email — delivery tracking check** from the platform sender.
5. (Database) the delivery is kind `TEST_EMAIL`, `SENT` → **DELIVERED** with `provider_event` `delivered` within a minute or
   two; opening the email sets `opened_at` (only if images load).
6. Connection checks → Email: "Last email: delivered … ago", **connected**.
7. Support (kola@) has no Integrations cards, so no Send a test email.

## Expected results

- No email to a reserved test domain ever reaches Brevo; it is *Skipped* "Not sent: test address" and the action succeeds.
- The Email connection check counts only real addresses, counts delivered/bounced only since tracking started, is neutral
  when there is nothing real to judge, and is an error only when real addresses fail.
- Send a test email sends exactly one recorded email to a real inbox, refuses test addresses, and allows one a minute.
