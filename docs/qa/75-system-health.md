# QA script · System health page and server alerts (staging)

## Purpose

The owner asked for one place that shows **every running Hospio service and its health, and the server's health** (CPU, memory,
disk space left, database, Kafka, Redis), so he knows if the server is running out of space or anything else. Since 19 Nov 2026:

- admin portal → **Platform → System health** (`/dashboard/system`), for the **Super admin** and **Support** only;
- it refreshes itself every **30 seconds**; **Refresh now** checks again at once;
- a banner (**All good** / **Warning** / **Problem** with the reasons), five tiles (disk space left, memory, CPU, services up,
  database), the services table (problems first), the server's disks and memory, the database (with **No scheduled backup**
  in red), Kafka, Redis, TLS certificates, 24 h / 7 day trends and the alert limits;
- **alerts**: the Super admins get the bell and an email when a disk fills, memory runs out, a service is down for 2 minutes, a
  certificate is near expiry, Kafka is stuck or the database runs out of connections; once when it starts, once if worse, once
  when it clears. The limits are in **Settings → System health**.

Contract: hospio-backend `docs/system-health.md` (what each number means, the limits, how to act).

## Links

- Admin portal: https://admin-staging.hospio360.com/dashboard/system
- Settings: https://admin-staging.hospio360.com/dashboard/settings?tab=system

## Accounts

| Who | Email | Password |
|---|---|---|
| Super admin | amoria@hospio360.com | `Hospio123!` |
| Support | kola@hospio360.com | `Hospio123!` |
| Finance admin | tobi@hospio360.com | `Hospio123!` |
| Any hotel owner or staff (e.g. Royal Suites owner) | as in script 01 | `Hospio123!` |

**Don't stop, restart or change anything on the server**, and don't save other limits than the ones below. Stopping a service
to see the alert is done by the developer, not QA (step 6 checks the result).

## 1. Opening the page

1. Sign in as **amoria@hospio360.com**. In the menu under **Platform**, **System health** sits above Settings. Open it.
   - Expected: the page loads within a few seconds; the header says "Checked just now" and has **Refresh now**.
2. Leave the page open for a minute.
   - Expected: "Checked … ago" stays under ~45 s; the figures change a little (CPU, memory) without reloading the page.
3. Click **Refresh now**.
   - Expected: the button shows "Checking…", then "Checked just now". Clicking it again straight away is fine (no error).

## 2. Banner and tiles

1. Read the banner.
   - Expected: green **All good** with "Every service is up…", or amber/red with one line per reason (e.g. "Memory: Memory 91%
     used and swap 78% used"). Under it an info line: "No scheduled backup: …".
2. Read the five tiles: **Disk space left** (e.g. "77 GB free", "20% used of 96 GB (/)" with a bar), **Memory** (% used, of
   ~11.7 GB, swap %), **CPU** (% busy, load on 6 cores), **Services up** ("18 of 18"), **Database** (size, connections of 100).
   - Expected: every tile has a number, none says NaN or undefined.

## 3. Services

1. Find the **Services** card.
   - Expected 18 rows: the 14 services (identity-service … platform-service), **api-gateway**, and three web apps
     (his-fe-staging, hospio-admin-staging, hospio-landing-staging, marked "web app").
2. Each row shows **Status** (running), **Health** (healthy), **Version** (7-character commit, hover shows when it was deployed),
   **Up for**, **Restarts**, **Memory**, **CPU**.
   - Expected: a service with a problem is listed first with a red background; a service with 3+ restarts is amber.
   - Web apps deployed before 19 Nov may show "—" as version until their next deploy (expected).

## 4. Server, database, Kafka, Redis, certificates

1. **Server** card: disks (`/`, `/boot`, `/boot/efi`) with "free · % used" in large text and a bar (amber from 80%, red from 90%);
   Memory and Swap bars; "Hospio's services use …"; CPU now, load, waiting for memory, up for, kernel, server time; **What uses
   the disk** (logs, journal, Hospio services and uploads, web apps, earlier backups, databases, Kafka event logs); **Also
   running on this server** (CoRyd, postgres, docker…).
   - Expected: right after a deploy some folders say "Being measured"; after ~1 minute and Refresh they have sizes.
2. **Database** card: red box **No scheduled backup**; Hospio database size, all databases, longest running query, cache hit
   ratio (about 99.9%), rows waiting for clean-up, Connections bar, **Size per service** bars, **Largest tables**.
3. **Kafka**: up, brokers 1, topics, event logs size, one line per Hospio service ("up to date" or "N waiting").
4. **Redis**: up, version, memory used, highest so far, limit "none set", keys, up for.
5. **TLS certificates**: hospio360.com, www.hospio360.com, web-staging, admin-staging, api-staging with "N days" (green; amber under
   21 days).

## 5. Trends

1. **Trends** card, **24 h**: five small charts (CPU busy, Memory used, Main disk used, Hospio database, Services up). Hover a chart:
   a line follows the pointer and the value and time show at the top.
   - Expected on a new install: "Not enough history yet" until two snapshots exist (one every 5 minutes); the disk sentence says
     "Not enough history yet…" for the first 6 hours, then either "steady" or "full in about N days".
2. Switch to **7 days**: hourly points.

## 6. Alerts (check the result of the developer's test)

1. Dashboard → **System alerts**: a server alert reads "Server · maintenance-service is down" (or "Server · Disk / is …% full")
   with **Open** (goes to System health) and Dismiss; after the problem cleared the alert is gone on its own.
2. The bell (Notifications) of amoria@hospio360.com: "Problem: maintenance-service is down" and later "Recovered: …"; the link
   opens System health.
3. Expected: one notification when it started and one when it cleared, never one per minute.

## 7. Settings → System health (limits)

1. As amoria: Settings → **System health** tab. Expected fields: Disk warning 85, Disk critical 95, Memory 90, Swap 75, Memory
   minutes 10, Service down minutes 2, Certificate days 14, Database connections 80, Kafka messages 500, no progress 10, and
   **Email the Super admins as well as the bell** (on).
2. Set **Disk warning** to 96 (above critical) → Save.
   - Expected: "The disk warning level must be under the critical level"; nothing saved.
3. Set **Service down for** to 0 → Save → "Service down for (minutes) must be between 1 and 1440". Reload: values unchanged.
4. Back on System health, the **Alerts** card lists the same limits, with **Change limits** (Super admin only).

## 8. Wrong roles

1. **Support** (kola@hospio360.com): System health is in the menu and the page works (read-only); the Alerts card has no
   **Change limits**; Settings → System health fields are disabled.
2. **Finance admin** (tobi@hospio360.com): no System health in the menu; opening `/dashboard/system` shows "Only a Super admin or
   Support sees system health".
3. **Hotel owner or staff**: the hotel app has no such page; `https://api-staging.hospio360.com/platform/admin/system-health`
   with their token answers 403.

## 9. Screens

1. At 768 px and 1024 px wide (tablet): no sideways scrolling; the services show as compact rows below 1024 px and a table from
   1024 px.
2. Phone width (375 px): tiles two per row, everything readable.

Anything that shows NaN, "undefined", a blank card, a page that scrolls sideways, or alerts repeating every minute is a bug.
