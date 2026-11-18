# Install as an app (PWA)

The hotel app (Hospio360) and the admin portal (Hospio360 Admin) can be installed on a tablet, phone or computer. Once
installed they open from the home screen, dock or Start menu in their own full-screen window, without the browser's
address bar. It is the same website underneath: same sign-in, same data, same updates. Nothing is stored for offline use
apart from a small "You're offline" page.

## What makes it work

| Piece | Where |
|---|---|
| Web app manifest (name, icons, colours, `start_url` /dashboard, `display: standalone`) | `apps/{hotel,admin}/src/app/manifest.ts` → `/manifest.webmanifest` |
| Icons: 192, 512, maskable 512 (`public/icons/`), Apple touch icon 180 (`src/app/apple-icon.png`), favicon (`src/app/icon.tsx`) | per app; the admin icons carry an **ADMIN** tag |
| Service worker | `apps/{hotel,admin}/public/sw.js` (hand-written, no library) |
| Offline page | `apps/{hotel,admin}/public/offline.html` (self-contained, no app code) |
| Registration, install menu item, banner, iOS tip | `packages/ui/src/shared/pwa.tsx`, `packages/ui/src/hooks/use-install-prompt.ts` |
| Apple and theme-colour meta | `metadata.appleWebApp` and `viewport.themeColor` in each app's `src/app/layout.tsx` |

`/sw.js`, `/offline.html` and `/manifest.webmanifest` are outside the sign-in middleware (each app's `src/middleware.ts`
matcher), so they load before anyone signs in.

The service worker is registered only in production builds served over https, at `/sw.js?v=<build id>`.

## Installing

**Android tablet or phone (Chrome or Edge)**
1. Open the app's address and sign in.
2. Tap **Install** on the "Install Hospio360" banner at the bottom, or open your name (top right) → **Install Hospio360**.
   (Or Chrome's ⋮ menu → **Install app** / **Add to Home screen**.)
3. Confirm **Install**. The Hospio360 icon appears on the home screen and in the app drawer.

**iPad or iPhone (Safari, or Chrome on iOS)**
1. Open the app's address in Safari (or Chrome).
2. Tap **Share** (the square with an arrow: Safari's toolbar, or Chrome's address bar).
3. Choose **Add to Home Screen**, then **Add**. The banner and the menu item show these steps as a reminder.

**Computer (Chrome or Edge on Windows, Mac, ChromeOS)**
1. Open the app's address and sign in.
2. Your name (top right) → **Install Hospio360**, or the install icon at the right end of the address bar.
3. Confirm **Install**. It opens in its own window and appears in the Start menu / Applications / dock.
   Safari on a Mac: **File → Add to Dock**. Firefox does not install web apps.

The hotel app and the admin portal install separately ("Hospio360" and "Hospio360 Admin").

Inside the installed app, the install banner and menu item never show.

## What is cached, and what never is

Cached (in a cache named after the build, `hospio-shell-<build>`):
- the offline page and the app icons, when the service worker installs;
- Next's hashed build files under `/_next/static/` (scripts, styles, fonts) as they are used. These are the same for
  everyone and never change under the same address.

Never cached by the service worker (it does not even look at them; the browser handles them as on a normal website):
- pages (HTML): every page load goes to the server, because pages carry the signed-in person's data;
- anything that is not a GET: server actions (every save), sign-in, sign-out, uploads;
- `/api/*`: session refresh, the version check, downloads, people/profile lookups;
- the Hospio API (`api-…hospio360.com`) and every other site;
- Next's in-app page data (RSC requests).

Offline, the only thing that works is the offline page: "You're offline — Hospio360 needs internet to work. We'll
reconnect automatically." It checks the connection every 10 seconds and when the device says it is back online, and
reloads the page the person was on as soon as the server answers (or press **Try again**).

## Updates

Nothing changes for updates. Pages always come from the server, so an installed app is on the new version the moment it
loads a page after a deploy. A page that was already open shows the usual "Reload Hospio360 to carry on" notice
(`packages/ui/src/shared/update-notice.tsx`). The new build registers `/sw.js?v=<new build>`; the new worker takes over at
once and deletes the previous build's cache.

Sign-in cookies, the lock screen on shared devices, session refresh, receipts, printing and file downloads work exactly as
in the browser.

## Turning it off

To remove the service worker from every device, replace `public/sw.js` with one that unregisters itself
(`self.registration.unregister()` in `activate`) and deploy; removing the file alone leaves installed workers running until
the browser drops them.
