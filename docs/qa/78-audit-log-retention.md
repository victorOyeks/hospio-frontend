# QA script · Audit logs kept 7 days (staging)

## Purpose

The owner decided on 19 Nov 2026 that every **audit log** in Hospio360 (who changed what, and when) is kept for **7 days** and then
deleted from the database automatically, to save space. Two logs are affected:

- the **activity log** (hotel app → Activity log; owner → Operations → Activity log; admin → a business → Activity; admin → Changes
  by Hospio360 → Admin activity), and
- **Changes by Hospio360** (admin → Changes by Hospio360 → Changes in businesses; a business's Activity tab; owner → Operations →
  Changes by Hospio360).

A job deletes entries older than 7 days every night at 03:30 (Lagos). A change by Hospio360 is never deleted while it can still be
undone. Nothing else is deleted: bookings, payments, orders, folios, invoices, fees, stock, notifications, messages and every other
business record stay. Each audit page now shows: **"Records are kept for 7 days, then deleted automatically to save database
space."** The admin Usage tab, health scores and alerts still count older activity (they keep day totals, not the entries).

## Links

- Admin portal: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com

## Accounts

| Who | Email | Password |
|---|---|---|
| Hospio360 super admin | amoria@hospio360.com | `Hospio123!` |
| Lounge owner / manager | owner.lounge.qhye@hospio-qa.test · manager.lounge.qhye@hospio-qa.test | `Hospio123!` |

## 1 · Admin: Changes by Hospio360

1. **Do:** sign in as the super admin, open **Changes by Hospio360**. **Expect:** under the title, a small line with a clock:
   "Records are kept for 7 days, then deleted automatically to save database space."
2. **Expect:** no change in **Changes in businesses** is older than 7 days unless its **Undo** is still open (an undo window is
   never cut short).
3. **Do:** switch to **Admin activity**. **Expect:** the same line; the newest entries are listed; nothing older than 7 days.
4. **Do:** on a change made in the last few days with **Undo · Nd left**, press Undo and confirm. **Expect:** it is marked undone as
   before.

## 2 · Admin: a business's Activity tab and Usage

1. **Do:** Businesses → open any business → **Activity**. **Expect:** the same line above the Activity and Changes by Hospio360 cards.
2. **Do:** open **Usage** for a business that has been busy for weeks (e.g. the demo hotel). **Expect:** the 8 weekly bars still show
   the older weeks, and "last 30 days" figures and the adopted features are filled in (they are not cut to 7 days).

## 3 · Admin: Settings → Security

1. **Do:** Settings → Security. **Expect:** "Keep audit logs for" shows **7 days**, with choices 7, 14, 30 and 90 days and the hint
   "Activity log and Changes by Hospio360, then deleted automatically (never less than 7 days)".
2. **Do (optional, put it back after):** choose 14 days and save; reload Changes by Hospio360. **Expect:** the line says 14 days.
   Set it back to 7 days.

## 4 · Hotel app

1. **Do:** sign in as the lounge manager → **Activity log**. **Expect:** the line under the title; the list, search, filters, export
   and opening an entry all work. Opening an entry: the footer says "Entries are kept for 7 days, then deleted automatically, and
   cannot be edited".
2. **Do:** sign in as the lounge owner → **Operations** → **Activity log**, then **Changes by Hospio360**. **Expect:** the line on both
   tabs (not on Hotels now or Departments).

## 5 · Nothing else is deleted

1. **Expect:** bookings, folios, payments, sales, invoices, fees, stock movements and notifications older than 7 days are still there
   (e.g. an older booking or receipt still opens).

## 6 · Legal pages

1. **Do:** open hospio360.com/legal → Privacy Policy 7.1, Data Processing Terms 12.2 and Staff terms 4.1. **Expect:** they say the
   activity log is deleted after **7 days** (not six months). No new version: nobody is asked to accept again.

## 7 · Tablet widths

At 768 px and 1024 px the line wraps cleanly under the title on every page above, without sideways scrolling.
