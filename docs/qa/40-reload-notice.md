# QA script · "Reload Hospio360" works over open panels (staging)

## Purpose

After a deploy, open pages show "Reload Hospio360 to carry on". The Reload button did nothing while a side panel or modal was
open (the panel blocks clicks everywhere outside it). It now works over any panel, and shows "Reloading…" once pressed.

## Steps (admin portal and hotel app)

1. Open a page and leave a side panel open (e.g. Businesses → Set up a business, or a payment's detail).
2. Push a new version to staging, wait for the deploy, then come back to the tab (or wait up to a minute).
3. The notice appears at the top. Press **Reload**: it reads "Reloading…", the panel stays put until the page reloads, and
   the page comes back on the new version (the notice is gone).
4. Repeat with no panel open: Reload works the same.

## What to report

- Reload pressed and nothing happens, or the notice comes back straight after reloading.
