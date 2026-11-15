# QA script · Retention: what is deleted automatically (staging)

## Purpose

Old data is deleted every night so the database stays small:

| What | Kept for |
|---|---|
| Notifications (the bell), read or not | 30 days |
| Chats: staff **Inbox** conversations and guest **Messaging** conversations, with their messages | 30 days after the last message |
| Activity log | 6 months |

A conversation with a message in the last 30 days is kept whole. Bookings, folios, payments, stock and the record of messages
sent (used for billing) are never deleted by this.

Staging data is younger than 30 days, so nothing is removed yet. This script checks what the screens say and the activity
log setting.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Platform admin | see `00-README.md` |

## 1. What the screens say

1. **Notifications:** the subtitle ends with "kept for 30 days".
2. **Inbox:** the subtitle says conversations go 30 days after the last message.
3. **Messaging** (guest conversations): the subtitle says the same.

## 2. The activity log setting

1. Admin portal → **Settings** → **Security**: **Keep activity logs for** shows **6 months**. The other choices are 90 days, 1
   year and 5 years.
2. Don't change it on staging. Anyone who changes it must set it back to 6 months.

## What to report

- A notification older than 30 days, or a conversation quiet for more than 30 days, still showing (from mid-December 2026
  on staging).
- An activity log entry older than six months still showing.
- Anything other than notifications, conversations and activity entries disappearing.
