# QA script · The hotel's brand colours, everywhere (staging)

## Purpose

Hotel setup → **Brand & colours** sets the hotel's colour, short name, logo and sidebar style.

- **Before saving**, the section previews it live: this page and its sidebar recolour as you type. Only you see that until
  you save.
- **After saving**, it shows within a minute everywhere the hotel appears:
  - the hotel app for every role: sidebar, buttons, highlights, and the short name and logo at the top;
  - the guest's booking page, opened from **View booking**;
  - booking emails and receipts: header, buttons and logo;
  - the banner on top of booking WhatsApp messages.

Status colours (green, amber, red) never change.

## Links

- Hotel app: https://web-staging.hospio360.com
- Banner check: `https://hospio360.com/whatsapp/banner?c=0b4f50&n=Simpas%20Ikeja`

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |
| Front office | `godwin@royalsuites.ng` |

## Before you start

Write down the hotel's current brand values. Put them back at the end (Simpas Ikeja: `#4c091e`, Dark sidebar on, no short
name or logo).

## 1. Live preview

1. Manager → **Hotel setup** → **Brand & colours**. Click the teal swatch (or type `#0b4f50`).
2. Straight away, without saving: the sidebar, the **Save changes** button and the preview picture turn teal. The note says
   only you see it.
3. Type a pale colour, `#f5e6a8`. A warning says it's too light for white text, and the sidebar text turns dark.
4. Type `abc123x`. The form asks for #RRGGBB.
5. Turn **Dark sidebar** off: the sidebar turns white with dark text and the brand colour as the highlight.
6. **Discard**: everything goes back to the saved look.

## 2. Saved, it shows everywhere

1. Pick teal `#0b4f50`, type a short name such as `Simpas`, and **Save changes**. The page keeps the teal, and the top of
   the sidebar says "Simpas".
2. Sign in as front office in a private window: their sidebar and buttons are teal too.
3. Make a booking for a guest with your email. Within a minute:
   - the email's header and **View booking** button are teal;
   - **View booking** opens the booking page in teal, with "Simpas" at the top and "with Hospio360".
4. Open the banner check link with the colour and name you saved: a teal banner with the hotel's name.

## 2b. The sidebar

1. The sidebar starts with the **branch box** (hotel name, "1 of 1 branch"). There is no Hospio360 row above it.
2. With a **Logo URL** saved, the logo shows in the branch box instead of the building icon.
3. The Brand section's field is called **Short name**; its hint says it appears on the sign-in screen and the guest's
   booking page.
4. **Dark sidebar** off: the sidebar is white, the house and branch icons stay visible, and the page you're on is
   highlighted in the hotel's tint (not a grey box).

## 3. After logout, the sign-in screens keep the hotel's look

1. Signed in as Tunde with the teal brand saved, open any page, then **Log out**.
2. The sign-in page shows the teal panel with the hotel's name (or short name and logo) instead of Hospio360. **Forgot
   password**, **Sign up** and the shared-device **Lock** screen look the same.
3. Under the form: "Not Simpas Ikeja? **Use the Hospio360 look**". Click it: the page turns maroon with Hospio360.
4. Sign in again as Tunde, open a page and log out: the teal is back.
5. Sign in on the same browser as a user of another hotel with a different colour, open a page and log out: the sign-in page
   now shows that hotel's colour. The last hotel to use the browser wins.
6. A pale colour (e.g. sky blue) shows as a deep shade of itself on the sign-in panel, so the white text stays readable.

## 4. No screen left in maroon

With the hotel's own colour saved (e.g. sky blue), sign in as someone with two roles (Segun) and look for any maroon or pink:

1. The **role picker**: card icons in the hotel's tint, page background a faint tint, no pink.
2. Any **dropdown** (e.g. Shared device → Lock after): the hovered option is the hotel's tint, with readable text.
3. A **modal**: the backdrop behind it is a deep shade of the hotel's colour, not maroon.
4. **Lock**, **Sign in**, **Forgot password**, an **invite link** and a **receipt** page all carry the colour.
5. With a pale colour (sky blue): buttons have dark text, and links are a deeper shade of the colour, readable on white.
6. Switch to a hotel that kept Hospio360 maroon on the same browser: everything turns maroon, with no sky-blue leftovers
   (the sidebar text stays white).

Only the browser tab's small icon stays Hospio360.

## Clean up

- Put the brand values back as you found them and save. Within a minute the app, the booking page and emails are maroon
  again.

## What to report

- A screen, email or booking page still in the old colour more than a minute after saving.
- Text that's hard to read on the hotel's colour, in the sidebar, on a button, or in the booking page's header.
- The preview staying on the page after **Discard**, or another user seeing an unsaved colour.
