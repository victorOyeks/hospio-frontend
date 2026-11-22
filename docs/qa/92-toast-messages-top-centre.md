# QA script · Messages at the top centre (staging)

## Purpose

Until 22 Nov the pop-up messages ("Saved", "Open your till first…") appeared at the **bottom right** for 5 seconds, right on top of
the side panels' main button (Count cash, Record payment, Save, Close), so staff had to wait before they could tap it.

Now, in the hotel app and the backoffice:

- Messages appear at the **top centre**, in the middle of the top bar, never over a panel's buttons.
- New look: a slim **white card** with a coloured icon. Green tick for done, maroon for an error, amber for a warning. No full
  coloured background.
- **Done** messages go after **3 seconds**. **Errors** stay **7 seconds** and **warnings** 6, both with an **✕** to close. Hovering a
  message keeps it until you move away.
- At most **3** show at once; older ones stack behind.

Nothing else changed: the same messages appear for the same actions.

## Setup

- Laptop (about 1366 px wide) and a tablet (or the browser at about 820 px wide).
- Hotel app: the QA bar user at the lounge (bar till **closed**). Backoffice: any QA admin.

## 1. Hotel app

1. **Do:** Sales → New sale → add a drink → Take payment → **Cash** → send it with the bar till closed.
   **Expect:** "Open your till first…" appears at the **top centre**, maroon icon, white card, with an ✕. The panel's buttons at the
   bottom right stay fully visible and tappable while it shows.
2. **Do:** wait. **Expect:** it goes after about 7 seconds. Repeat and hover it: it stays while hovered. Click ✕: it goes at once.
3. **Do:** a save that succeeds (e.g. Menu → edit a drink → Save). **Expect:** green tick "Saved…" at the top centre, gone after
   about 3 seconds.
4. **Do:** trigger 4–5 messages quickly (save several times). **Expect:** no more than 3 visible, stacked; nothing covers the side
   panel's buttons.
5. **Do:** repeat 1 on the tablet width. **Expect:** the card fits the screen width with a margin and doesn't cover the panel buttons.

## 2. Backoffice

1. **Do:** any save (e.g. Settings → change and save). **Expect:** the same white card at the top centre, gone after about 3 seconds.
2. **Do:** an action that is refused (e.g. save a required field empty where the page shows a message). **Expect:** maroon error card
   at the top centre with ✕, about 7 seconds.

## Bug if

- A message appears at the bottom right, or covers a panel's main button.
- A coloured (filled red/green) message appears instead of the white card.
- An error disappears in under about 5 seconds, or has no ✕.
