# QA script · Hotel setup: the hotel's own shifts and departments (staging)

## Purpose

Hotel setup → **Staff & shifts** has two lists, **Shifts** and **Departments**. They used to be saved but not used.
Now:

- **Shifts** are the shifts the rota offers when adding a shift (the + in a day, and **Add to the rota**);
- **Departments** are the headings the rota groups staff under, in the order listed.

When a list is empty, the built-in ones stay: Morning 6am–2pm, Afternoon 2pm–10pm, Night 10pm–6am, and one heading per
role.

## Links

- Hotel app: https://web-staging.hospio360.com
- Rota script: `22-rota.md`

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Housekeeping | `grace@royalsuites.ng` |

## Before you start

Note what's in both lists. At the end, put them back exactly as they were (both were empty on 15 Nov 2026).

## 1. Shifts

1. Manager → **Hotel setup** → **Staff & shifts**. The Shifts box says "e.g. Early 07:00–15:00", and the help text
   explains the format and the built-in fallback.
2. **Add good entries.** Each becomes a tidy chip:
   - `Early 07:00-15:00` → **Early 07:00–15:00**
   - `Late (15:00-23:00)` → **Late 15:00–23:00**
   - `Night 2300-0700` → **Night 23:00–07:00**
3. **Refused entries.** Each shows a red message under the box and isn't added:
   - `Morning`, with no times;
   - `Broken 25:00-15:00`, which isn't a time;
   - `Same 07:00-07:00`, which starts and ends at the same time;
   - `early 08:00-16:00`, which repeats a name: "There is already a shift called early".
4. **Save changes.**
5. Staff → **Rota**. Click **+** on an empty day. The choices are **Early, Late, Night, Custom**, with no Morning or
   Afternoon. Night says "(next morning)". Add an Early shift: the day shows 07:00–15:00.
6. The text under the rota lists "Early 7am–3pm, Late 3pm–11pm, Night 11pm–7am (ends the next morning)".
7. Staff → All staff → a person's row menu → **Add to the rota**. It shows the same three shifts with their times.
8. Sign in as Grace: **My shifts** shows the Early shift.

## 2. Departments

1. Back in Staff & shifts → Departments. Add:
   - `Food & drink: Kitchen, Bar` → **Food & drink: Kitchen, Bar**
   - `Rooms: Housekeeping and Laundry` → **Rooms: Housekeeping, Laundry**
2. **Refused entries:**
   - `Food & drink`, which has no roles and isn't a role: the message asks for a name and roles and lists them;
   - `Spa: Therapists`, an unknown role: the message lists the roles you can use;
   - `Drinks: Bar`: "Bar is already in Food & drink";
   - `rooms: Maintenance`: "There is already a department called rooms".
3. **Save changes.**
4. Staff → **Rota**. The first heading is **Food & drink** (kitchen and bar staff), then **Rooms** (housekeeping and
   laundry staff). The other roles follow under their usual headings (Management, Front office, …). The people and
   shift counts in each heading are right.
5. **Order.** Remove both entries and add them back in the opposite order, then save. **Rooms** now comes first on the
   rota.

## 3. Back to the built-in ones

1. Remove every shift and department, then save.
2. Rota → **+**: Morning, Afternoon, Night and Custom are back. Headings are one per role again.

## 4. Clean up

- Cancel the test shifts on the rota: tap the shift → **Cancel this shift**.
- Put both lists back as you found them.

## What to report

- A good entry refused, or a bad one accepted.
- The rota or Add to the rota still showing Morning, Afternoon and Night after the hotel's own shifts are saved, or not
  showing them again after the list is emptied.
- Someone under the wrong heading, or headings in the wrong order.
- Anything that needs a reload to show after saving.
