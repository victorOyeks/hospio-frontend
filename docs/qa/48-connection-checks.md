# QA script · Integrations → Connection checks (staging)

## Purpose

The **Connection checks** card at the bottom of Platform → Integrations says what the platform really sees. Each row is checked
live by the service that owns it, when the page opens and again with **Run checks again**:

| Row | Checked by | What it checks |
|---|---|---|
| PostgreSQL | platform-service | the database answers |
| Kafka | platform-service | the event broker answers |
| Payment provider (POS) | payment-service | the server's POS provider, how many hotels have Moniepoint / OPay keys, whether those providers answer |
| WhatsApp | messaging-service | Infobip key present, sender number, WhatsApp on, Infobip's template list |
| Email | messaging-service | Brevo API (or SMTP), From address, Email on, Brevo account read (or SMTP sign-in) |
| SMS (sign-in codes only) | messaging-service | Termii (sender ID, channel) or Infobip SMS, SMS on, Termii balance (or Infobip read) |

A check **never sends** an email, WhatsApp or SMS, **never charges** anything and never pushes to a terminal. Keys are never shown,
only "key present". Statuses: **connected** (green), **not configured** (grey: switched off or no keys, the row says which),
**test mode** (blue: the test POS provider, nothing is charged), **error** (red, with the reason).

## Links

- Admin portal: https://admin-staging.hospio360.com/dashboard/integrations
- Contract: hospio-backend `docs/admin-portal.md` (`GET /platform/admin/integrations/status`)

## Accounts

| Who | Email | Expected |
|---|---|---|
| Super admin | amoria@hospio360.com | provider key cards and the Connection checks card |
| Support | kola@hospio360.com | "Only a Super admin manages integrations" and the Connection checks card |
| Hotel owner | godwin@royalsuites.ng | no admin portal access (as before) |

Password `Hospio123!`. Never change these accounts' roles.

## 1. The card (Super admin)

1. Open Integrations and scroll to **Connection checks**. Subtitle: "Each service checks its own connection live. Nothing is sent or
   charged."
2. Six rows in this order: PostgreSQL, Kafka, Payment provider (POS), WhatsApp, Email, SMS (sign-in codes only).
3. Each row ends with "· checked <date, time with seconds> by <service>".
4. On staging today expect:
   - PostgreSQL and Kafka **connected**.
   - Payment provider (POS) **test mode**: "Test provider: nothing is charged. No hotel has Moniepoint or OPay keys saved." If a
     hotel has keys saved, the row is **connected** and counts the hotels per provider (red **error** if that provider doesn't answer
     or has no address).
   - WhatsApp **connected**: "Infobip, sender +234…, key present. Infobip answered: … templates, … approved. Only N allow-listed
     numbers receive texts on this server."
   - Email **connected**: Brevo API (or SMTP relay), From address, "Brevo accepted the key".
   - SMS **connected** or **not configured**: always starts "Sign-in codes only."; names the route really used (Termii with its sender
     ID and channel, or Infobip SMS) and the live answer (Termii balance).
5. No key or password appears in any row.

## 2. Run checks again

1. Note the "checked" time on each row. Wait 10 seconds and click **Run checks again**.
2. The button shows a spinner and "Checking…", the rows fade while checking, and the button can't be clicked twice.
3. Within about 10 seconds the times update (seconds change) and the statuses are the same as before.
4. Nothing arrives: no email, WhatsApp or SMS on any test phone or inbox because of the checks.
5. The provider key cards above (Save, Test) still work as before; their **Test** buttons still answer.

## 3. Support and wrong roles

1. As Support open https://admin-staging.hospio360.com/dashboard/integrations: the "Only a Super admin manages integrations" note and
   the Connection checks card with the same rows; **Run checks again** works.
2. As the hotel owner: the admin portal isn't available (as before).

## 4. What is a bug

- A row that says connected while that channel is switched off or has no keys, or not configured while messages really go out.
- Any message sent, or anything charged, by running the checks.
- A key, password or token shown anywhere.
- The whole card failing because one service is slow: only that service's rows may show **error** "Not reachable: …".
- Times that don't change after **Run checks again**, or a page error.
