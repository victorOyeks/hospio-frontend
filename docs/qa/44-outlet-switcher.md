# QA script · Outlet switcher, "Serving at" (staging)

## Purpose

A hotel with two outlets of a kind (a **Bar** and a **Patio Lounge**, or a **Kitchen** and a **Restaurant**) works one
area per desk: the sidebar says where you are serving, every page title names the outlet, each outlet has its own small
colour and icon, and managers and leads can see every outlet at once on Tabs and Sales. A hotel with one outlet of a kind
sees no switcher and no colour marks. Front end only; the cookies `hms.outlet.BAR` / `hms.outlet.KITCHEN` remember the
outlet per device and `hms.outlet.<desk>.all` remembers "All outlets".

## Links

- Hotel app: https://web-staging.hospio360.com
- Users: a manager, a bar user (Edit), a bar user with Full access (bar lead), a kitchen user (Edit).
- Hotel A: one Bar and one Kitchen. Hotel B: a **Bar** and a **Patio Lounge** (both kind Bar, each with a table or two),
  a **Kitchen** and a **Restaurant** (see 43-outlets-serving-each-other.md, step 1, to add outlets).

## 1. One outlet of a kind is unchanged (hotel A, bar user)

1. Sidebar: the branch card, then the menu: **Today**, **Tabs**, **Sales**, **Menu**, **Stock**, My payments, Till,
   My shifts, Inbox, Notifications. No **Serving at** card.
2. Titles: Today reads **Bar · today**, Tabs **Bar · tabs**, Sales **Bar · sales**, Menu **Bar · menu**, Stock
   **Bar · stock**. No coloured dot by the titles, seats or tab cards. The button reads **New sale**.
3. Sales shows every bar sale as before; no outlet filter.
4. Kitchen user on hotel A: menu **Orders**, **Sales**, **Menu**, **Store**, …; titles **<kitchen name> · orders**,
   **· sales**, **· menu**, **· store**; button **New order**; no switcher.

## 2. Two bars: the switcher (hotel B, bar user with Edit)

1. Under the branch card: **Serving at** with the outlet's name and a coloured round icon. The old outlet pills at the
   top of the pages are gone.
2. Open it: **Switch outlet** lists *Bar* and *Patio Lounge*, each with its own colour and icon, a tick on the current
   one. There is **no** *All outlets*.
3. On **Tabs**, pick *Patio Lounge*: the page reloads and stays on Tabs; the card now says *Patio Lounge*; the title reads
   **Patio Lounge · tabs** with the Patio Lounge mark.
4. Go to Today, Sales, Menu and Stock: each title names *Patio Lounge* and shows its mark. Today's seats are the patio's,
   each with a small dot in the corner in the patio's colour; the button reads **New sale at Patio Lounge** and the
   sale panel title too.
5. Sales lists only the patio's sales (no outlet filter); the subtitle says *Every Patio Lounge sale*.
6. Tab cards on Tabs show the patio's mark before the seat.
7. Pick *Bar* from **Serving at** while on Menu: you stay on Menu, now **Bar · menu**, with the bar's colour.
8. Refresh the browser: the choice is kept on this device. On another device the default is
   the first open bar.
9. Close an outlet in Hotel setup → Restaurants & tables (e.g. a third test bar): it leaves **Serving at**, the
   all-outlets pills and the colour marks. A hotel left with one open outlet of the kind sees no switcher. A device that
   was serving at the outlet when it closed keeps it listed (to finish its open orders) until it picks another.

## 3. All outlets (hotel B)

1. Bar lead (Full access) → **Serving at** → the menu has **All outlets** (*Tabs and sales*) under the outlets.
2. On **Tabs**, pick **All outlets**: title **All outlets · tabs**, the card reads *All outlets* with a layers icon. Pills
   *All outlets · Bar · Patio Lounge* with counts filter the cards; each card has its outlet's mark and name.
3. Open a patio tab from here and **Add drinks**: the patio's menu shows (not the bar's). **Move** offers the patio's
   free seats. **Close & pay** preselects the patio's terminal.
4. Sales: title **All outlets · sales**, an outlet filter (*Every outlet*), each sale shows a dot and its outlet's name
   under the number.
5. Go to Today: it shows one outlet (the last one picked), the card shows that outlet. Back on Tabs it is *All outlets*
   again. Pick *Patio Lounge*: All outlets turns off.
6. From Today or Menu, pick **All outlets**: you land on Tabs in the all-outlets view.
7. Manager signed in with the Bar role (role switch): the same **All outlets** option.
8. Bar user with Edit: never offered *All outlets*. Setting the cookie `hms.outlet.BAR.all=1` by hand changes nothing.

## 4. Kitchen side (hotel B)

1. Kitchen user: **Serving at** lists *Kitchen* and *Restaurant* (KITCHEN and RESTAURANT kinds), no bars.
2. Pick *Restaurant* on Orders: **Restaurant · orders**, **New order at Restaurant**, each order card has the restaurant's
   dot; Menu, Sales and Store follow it.
3. A head chef (Full) or manager gets **All outlets** (*Sales*): Sales lists both with the outlet filter. From Orders,
   picking it opens Sales.
4. Tickets from another outlet (patio pepper soup) still show *From Patio Lounge* as in QA 43.

## 5. Help

1. Help → Bar: guides say **Today** and **Stock** (not *Bar today* / *Bar stock*); their *Open …* buttons work.
2. Help → Kitchen: guides say **Store**.

## What to report

- A page that shows one outlet's data under another outlet's name or colour.
- Switching that leaves you on a different page, or a stale page until a manual refresh.
- *All outlets* offered to staff with Edit or View, or an all-outlets list missing an outlet.
- Any switcher or colour mark on a hotel with one outlet of the kind.
