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

There is no free-text box: each shift is added with a name, a start time and an end time.

1. Manager → **Hotel setup** → **Staff & shifts**. With no shifts of your own, the box says the rota offers Morning,
   Afternoon and Night, and has a **Start from these three** link.
2. **Start from these three.** Morning 06:00–14:00, Afternoon 14:00–22:00 and Night 22:00–06:00 appear as rows; Night
   says "ends the next morning". Remove them all with ×.
3. **Add shift is disabled** until there is a name, a start and an end. Type only a name: the form says "Pick when it
   starts and ends".
4. Add **Early** 07:00–15:00, **Late** 15:00–23:00 and **Night** 23:00–07:00. Each appears as a row and the form
   clears. While you enter Night, the form says "Ends the next morning (a night shift)".
5. **Refused, with Add shift disabled:**
   - a name already used, e.g. `early`: "There is already a shift called early";
   - the same start and end: "The shift has to end at a different time than it starts".
6. Rows are listed by start time whatever order you add them in.
7. **Save changes**, then reload. The three shifts are still there.
8. Staff → **Rota**. Click **+** on an empty day. The choices are **Early, Late, Night, Custom**, with no Morning or
   Afternoon. Night says "(next morning)". Add an Early shift: the day shows 07:00–15:00.
9. The text under the rota lists "Early 7am–3pm, Late 3pm–11pm, Night 11pm–7am (ends the next morning)".
10. Staff → All staff → a person's row menu → **Add to the rota**. It shows the same three shifts with their times.
11. Sign in as Grace: **My shifts** shows the Early shift.

## 2. Departments

Each department is added with a name and the roles in it, picked from buttons.

1. Type **Food & drink**, tick **Kitchen** and **Bar** → **Add department**. A row "1 Food & drink · Kitchen · Bar"
   appears.
2. **Add department is disabled** until there is a name and at least one role. With a name and no role, the form says
   "Pick at least one role for …".
3. **A role sits in one department.** Kitchen and Bar are now greyed out, marked "in Food & drink", and can't be
   ticked.
4. Add **Rooms** with **Housekeeping** and **Laundry**.
5. **Refused:** typing `food & drink` again says "There is already a department called food & drink", and Add stays
   disabled.
6. **Save changes.**
7. Staff → **Rota**. The first heading is **Food & drink** (kitchen and bar staff), then **Rooms** (housekeeping and
   laundry staff). The other roles follow under their usual headings (Management, Front office, …). The people and
   shift counts in each heading are right.
8. **Order.** Back in setup, move Rooms up with ↑ and save. **Rooms** now comes first on the rota.
9. When every role is in a department, the form says "Every role is in a department. Remove one to regroup."

## 3. Back to the built-in ones

1. Remove every shift and department, then save.
2. Rota → **+**: Morning, Afternoon, Night and Custom are back. Headings are one per role again.

## 4. Clean up

- Cancel the test shifts on the rota: tap the shift → **Cancel this shift**.
- Put both lists back as you found them.

## What to report

- A complete, valid shift or department that can't be added, or anything incomplete or clashing that can be.
- The rota or Add to the rota still showing Morning, Afternoon and Night after the hotel's own shifts are saved, or not
  showing them again after the list is emptied.
- Someone under the wrong heading, or headings in the wrong order.
- Anything that needs a reload to show after saving.
