# QA script · Rota: everyone listed, add from an empty day, Copy last week (staging)

## Purpose

This script tests the manager's **Staff → Rota** tab, the weekly plan of who works when. It covers:

- every active member of staff on the rota, grouped by department, with or without shifts;
- adding a shift by tapping **+** in an empty day;
- **Copy last week**, which fills the week on show from the week before;
- moving between weeks.

The clock-in notices in script 21 work only for people on the rota, so this is how a hotel keeps them working.

## Links

- Hotel app: https://web-staging.hospio360.com
- Contract (hospio-backend): `docs/workforce.md` → Rota

## Accounts

Password for every account: `Hospio123!`. Don't change these accounts' roles.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Owner | `godwin@royalsuites.ng` |
| Front office | `victor@royalsuites.ng` |
| Housekeeping | `grace@royalsuites.ng` |

## 1. Everyone is listed

1. Sign in as the manager → **Staff** → **Rota**. The week on show is this week, Monday to Sunday, and today's column
   is highlighted.
2. Staff appear under department headings (Management, Front office, Housekeeping, Kitchen, …). Each heading shows how
   many people and how many shifts that week.
3. **Someone with no shifts** this week still has a row with empty days. Before this change they weren't listed.
4. Suspended or paused staff aren't listed unless they still hold a shift that week. The owner isn't listed unless they
   hold a shift.

## 2. Add a shift from an empty day

1. Hover over an empty day from today onwards: a **+** appears. Days already gone show "—" and can't be clicked.
2. Click **+** for Grace on a day later this week. "Add a shift" opens with Grace, her job and the day filled in.
3. Pick **Morning** → **Add shift**. The toast says "Grace Okafor is on 06:00–14:00 on …", and the shift shows in that
   day straight away with no reload.
4. **Custom times.** On another empty day pick **Custom**, set 20:00 to 02:00. The form says "Ends the next morning".
   Add it; the day shows 20:00–02:00.
5. Set Custom start and end to the same time: the form warns and **Add shift** stays disabled.
6. Sign in as Grace (another browser): **My shifts** lists both new shifts.
7. **On approved leave.** Give Victor approved leave on a future day (Victor asks for leave, the manager approves it).
   Click **+** for Victor on that day → Add shift. It's refused with "Victor Adeyemi is on approved leave on …".
8. Clean up: tap each test shift → **Cancel this shift**.

## 3. Copy last week

1. Click **Next week →** so the week on show has no shifts yet. Make sure last week (the week now before it) has a few
   shifts; add some with **+** if not.
2. **Copy last week.** The window shows both date ranges and "Copy N shifts". Click it.
3. The toast says "N shifts copied". Every shift appears on the same weekday with the same person and times.
4. **Copy again.** The toast says "Nothing new to copy (N already on the rota)". No shift is doubled.
5. **Someone already on.** Cancel one copied shift and give that person a different shift that day, then copy again.
   Their new shift is kept and not doubled.
6. **On leave.** A person with approved leave in the target week gets no copied shift on those days. The toast counts
   them ("… on leave").
7. **This week.** Go back to this week and copy. Days already gone are skipped ("… on days already gone"); today and
   later are filled.
8. **Nothing to copy.** Move to a week whose previous week is empty: the window says there's nothing to copy and the
   button is disabled.
9. **Two managers at once.** Manager and owner both open the same empty week and click Copy at the same time. One adds
   the shifts; the other reports nothing new. No shift is doubled.
10. Clean up: cancel the test shifts you added.

## 4. Weeks

1. **Prev week / Next week** move by seven days; **This week** comes back. The address bar carries `?week=…`, so a
   reload or a shared link opens the same week.
2. Shifts far ahead (say five weeks out) show when you move to that week.

## What to report

- Someone active missing from the rota, or in the wrong department.
- A + on a past day, or a shift that needs a reload to appear.
- A copied shift on the wrong day or with the wrong times, a doubled shift, or a shift copied onto approved leave.
- Toast counts that don't match what happened.
