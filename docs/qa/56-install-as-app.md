# QA script · Install Hospio360 as an app (staging)

## Purpose

The hotel app and the admin portal can now be installed like apps (Progressive Web App): an icon on the home screen,
dock or Start menu, opening full screen without the address bar. How it works: `docs/pwa.md`.

| Where | How it is offered |
|---|---|
| Android tablet/phone, Chrome or Edge on a computer | **Install Hospio360** in the menu under your name (top right); on tablets and phones also a small banner at the bottom with **Install** and ✕ |
| iPad / iPhone (Safari or Chrome) | The same menu item and banner show "Tap Share, then Add to Home Screen" (iOS has no install button for websites) |
| Already installed (opened from the icon) | Nothing: no banner, no menu item |
| Installed, but opened in a normal Chrome/Edge tab (Android, computer) | "Hospio360 is installed on this device." with **Open the app** (shows where the browser's Open-in-app button is) and **Continue in browser** (hidden 7 days) |

Offline, only a "You're offline" page shows. Pages, saves and API answers are never stored on the device.

## Links

- Hotel app: https://web-staging.hospio360.com
- Admin portal: https://admin-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`

| Who | Email |
|---|---|
| Hotel staff (bar, Simpas) | `qa.pin.bar@hospio-qa.test` |
| Admin (look only) | `amoria@hospio360.com` |

## Steps

### A. Android tablet (Chrome)

1. Open the hotel app, sign in. A banner "Install Hospio360" appears at the bottom.
2. Tap **Install**, confirm. The maroon Hospio360 icon (white bed) is on the home screen; the banner is gone.
3. Open it from the icon: full screen, maroon top bar, no address bar. It opens on the dashboard.
4. In the installed app, open the menu under your name: there is **no** "Install Hospio360" item and no banner.
5. Make a sale or any save, open a report, download/print a receipt: all work as in the browser.
6. Turn on airplane mode, open another page: "You're offline — Hospio360 needs internet to work. We'll reconnect
   automatically." Turn the network back on: within about 10 seconds the page loads by itself (or press **Try again**).
7. Repeat 1–3 on the admin portal: its icon carries an **ADMIN** tag and is named "H360 Admin" / "Hospio360 Admin".

### B. iPad (Safari, then Chrome)

1. Open the hotel app and sign in. The banner reads "Tap Share, then Add to Home Screen"; **How** opens the two steps.
2. The menu under your name → **Install Hospio360** opens the same steps.
3. Tap **Share** → **Add to Home Screen** → **Add**. Open it from the Home Screen: full screen, Hospio360 name under the icon.
4. Inside it, no banner and no install item.
5. Repeat in Chrome on the iPad (Share is in the address bar).

### C. Computer (Chrome or Edge)

1. Sign in. No banner on a wide screen; the menu under your name has **Install Hospio360** (and the address bar shows
   an install icon).
2. Install. It opens in its own window and appears in the Start menu / Applications.

### D. Banner remembered

1. On a tablet in the browser, press ✕ on the banner. Reload and sign out/in: it stays hidden on this device.
   The menu item is still there.

### E. Already installed: links and "Open in app"

1. Android, app installed (A): send yourself a hotel-app link (e.g. https://web-staging.hospio360.com/dashboard/sales) on
   WhatsApp and tap it: it opens in the installed Hospio360 app, not Chrome.
2. Type the same address in Chrome: it stays in Chrome, and a banner says "Hospio360 is installed on this device."
   **Open the app** shows "Tap ⋮ then 'Open in Hospio360'"; do that: the app opens on that page.
3. **Continue in browser** hides the banner; reload: it stays hidden (for 7 days on this device).
4. Computer with the app installed (C): open the address in a normal Chrome tab. The same banner shows; **Open the app**
   points to "Open in app" in the address bar; clicking that opens the app window. Opening the app from its icon while
   its window is open brings that window forward (no second window).
5. iPad: links always open in Safari (iOS cannot hand them to Home Screen apps), and this banner never shows there.

### F. Nothing else changed

1. Shared device: Lock, choose a person, enter the PIN: unlocks to their page as before (also inside the installed app).
2. Leave a page open over a deploy: "Reload Hospio360 to carry on" still appears; Reload brings the new version.
3. Sign out, sign in again; leave the app an hour and save: no "unexpected response" error.

## What to report

- No install offer on Android/Chrome/Edge (say device and browser), or the banner shows inside the installed app.
- The icon is blurry, cut off (Android circle/squircle), or the wrong colour.
- Anything that worked in the browser but not in the installed app (sign-in, saves, downloads, printing, lock screen).
- A WhatsApp/email link on Android opens in Chrome although the app is installed; the "is installed" banner shows inside the app or on iOS.
- The offline page does not come back by itself once the network is back.
- Any screen that shows old data after a save inside the installed app.
