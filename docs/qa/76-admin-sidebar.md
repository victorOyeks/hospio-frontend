# QA script · A cleaner sidebar (admin portal, and the hotel app's menu rows) (staging)

## Purpose

The owner found the admin portal's sidebar heavy: every link sat in its own filled pill, the open page barely stood out, the
list scrolled on a laptop and a black **API** badge covered the last link. On 19 Nov 2026 the sidebar was redrawn (same
Hospio360 maroon and white, same fonts):

- **Links** are plain rows (no fill) with white text, slightly faded; hovering lightens the row a little.
- **The open page** has a lighter row, full-white text and a short white bar on its left edge (screen readers hear it as the
  current page).
- **Group headings** (Overview, Customers, Operations, Money, Growth, Platform) are small, spaced capitals, closer together.
- **Top:** the hospio360 wordmark and the **ADMIN** tag on one line over a thin divider.
- **Bottom (new):** who is signed in (initials, name, role) and a **Sign out** button, always in view; if the menu is taller than
  the window, only the menu scrolls.
- **Icon rail** (windows narrower than 1280 px): the white "h" mark on top, icons centred, the open page as a white tile, the name
  of each link on hover; the person's initials at the bottom.
- **API** (staging only: the list of backend calls made for your session) moved to the **bottom-right** corner, small and faded
  until you point at it. It works as before.

The rows come from the shared menu, so every link (including the new **System health**) and the **hotel app's** menus (owner,
manager, bar and every other role) get the same plain rows, lighter open page and rail. The hotel app keeps its branch box at
the top and has no person row at the bottom (its header menu has Sign out).

## Links

- Admin portal: https://admin-staging.hospio360.com · Hotel app: https://web-staging.hospio360.com

## Accounts

| Who | Email | Password |
|---|---|---|
| Hospio360 super admin | amoria@hospio360.com | `Hospio123!` |
| Lounge owner / manager / bar | owner.lounge.qhye@hospio-qa.test · manager.lounge.qhye@hospio-qa.test · bar.lounge.qhye@hospio-qa.test | `Hospio123!` |

Nothing in this script changes data.

## 1 · Admin portal on a laptop (1440 × 900)

1. **Do:** sign in as the super admin. **Expect:** the menu shows every link from Dashboard to Admin team (including **System
   health** under Platform) without scrolling, and **Amoria Nwosu · Super admin** with a sign-out icon at the bottom.
2. **Do:** open Dashboard, Businesses, Settings and System health in turn. **Expect:** only the open page's row is highlighted
   (lighter row, white bar on the left); every other row is plain.
3. **Do:** hover a row. **Expect:** a faint lighter background; no jump in size.
4. **Do:** press **Tab** from the top of the page until a menu link is focused. **Expect:** a clear white ring around it.
5. **Do:** look at the bottom-left and bottom-right corners. **Expect:** nothing covers the last link or the person row; the
   small **API** badge sits bottom-right; clicking it opens the API calls panel as before.

## 2 · Smaller laptop (1280 × 800)

1. **Do:** make the window about 1280 × 800. **Expect:** the full menu; if it doesn't all fit, the links scroll while the
   wordmark and the person row stay put. No sideways scrolling.

## 3 · Tablet (1024 px, icon rail)

1. **Do:** make the window about 1024 px wide. **Expect:** a narrow rail: the white "h" at the top, icons centred, the open page
   as a white tile with a maroon icon, the initials at the bottom.
2. **Do:** hover an icon. **Expect:** its name in a tooltip to the right.
3. **Do:** tap the menu button in the header. **Expect:** the full menu opens as before.

## 4 · Phone (390 px)

1. **Do:** open the admin portal on a phone (or a 390 px window) → the menu button. **Expect:** the drawer with the wordmark, the
   grouped links, the open page highlighted and the person row with Sign out at the bottom.
2. **Do:** **Sign out** in the drawer. **Expect:** you land on the sign-in page.

## 5 · Hotel app (owner, manager, bar)

1. **Do:** sign in as the lounge manager at 1440 px. **Expect:** the branch box on top as before, then plain rows (no pills)
   with the open page highlighted; the long manager menu needs far less scrolling than before.
2. **Do:** the same as the owner and the bar. **Expect:** the same look; badges (unread inbox, unpaid sales, approvals) still show
   as small pills on the right of their row.
3. **Do:** 1024 px wide. **Expect:** the icon rail, icons centred, the open page as a white tile.
4. **Do:** a hotel with its own brand colour (Hotel setup → Brand & colours). **Expect:** the rows use that sidebar colour; the
   rail's open-page tile shows the icon in that colour.

## What is a bug

- Filled pills on every row, two rows highlighted at once, or the open page not highlighted.
- The admin menu scrolling at 1440 × 900, or the person row scrolling away.
- The API badge over a menu link, or missing on staging.
- Icons off-centre or cut off in the rail; a missing tooltip.
- Any sideways scrolling, or a hotel app badge missing.
