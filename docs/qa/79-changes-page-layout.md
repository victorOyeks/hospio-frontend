# QA script · Changes by Hospio360: compact layout (staging)

## Purpose

The owner said the admin page **Changes by Hospio360** had "a lot of white space". The table squeezed every column except
**Change** to about 100 px, so rows were up to 200 px tall and By / When / Reason / Undo sat off the right edge. Both tabs are now a
compact log: one row is two lines (about 60 px, all the same height), rows are grouped by day (Today, Yesterday, then the date), and
clicking a row opens its details under it. Nothing new is stored: everything shown comes from what the service already sends.

## Links

- Admin portal: https://admin-staging.hospio360.com

## Accounts

| Who | Email | Password |
|---|---|---|
| Hospio360 super admin | amoria@hospio360.com | `Hospio123!` |

## 1 · Changes in businesses (desktop, 1280 px or wider)

1. **Do:** sign in, open **Changes by Hospio360**. **Expect:** the 7-day note, the two tabs, **All businesses** and **Search this
   page…** as before; columns **Change**, **By**, **When**, **Reason**, **Status**, all filled, with no sideways scrolling.
2. **Expect:** each row: bold change on one line and grey "business · area" under it; By shows the person and "Hospio360"; When shows
   "21 minutes ago" over the time (hover for the exact date and time); Reason is up to two lines (hover for all of it).
3. **Expect:** Status reads **Can undo until 26 Nov** with an **Undo** button, **Undone** (grey), **Owner asked to undo** (blue) when the
   owner asked from their app, or **—** when the 7-day window has closed (hover says when it closed).
4. **Expect:** day headings (TODAY · 10, YESTERDAY · 5, …) split the list; every row is the same height.
5. **Do:** click a row. **Expect:** it opens below with the full change, the full reason, made by, the exact time, **Before → after**
   (e.g. Charges start on: not set → 1 Mar 2027), the business (link to its Activity tab) and the undo window. Click again to close.
6. **Do:** type in **Search this page…** **Expect:** only matching rows stay; no match shows "No matches".
7. **Do:** on a QA business only (e.g. **QA Owner B Hotels …**), press **Undo** on a recent change and confirm. **Expect:** "Marked
   undone" and the row's Status becomes **Undone**. Don't undo changes on businesses that look real.

## 2 · Admin activity

1. **Do:** open **Admin activity**. **Expect:** columns **Action**, **By**, **When**, **Details**; the grey line under the action says
   where (the business name, or Platform) and the kind of event (e.g. Alerts switched, Change by platform).
2. **Expect:** Details shows what the event recorded that the action line doesn't already say (e.g. "Change: switched on").
3. **Do:** click a row. **Expect:** By, the exact time, Event, Where (business link) and every recorded field.
4. **Do:** use the pager at the bottom. **Expect:** the next page loads, still grouped by day.

## 3 · Tablet and phone

1. **Do:** at 1024 px (sidebar as icons) and 768 px. **Expect:** each row is a two-line card: the change, then "business · area · person ·
   time", with Undo on the right. No sideways scrolling, no tall gaps. Clicking still opens the details.
2. **Do:** at 390 px. **Expect:** the same cards; the filter and search sit above the list.
