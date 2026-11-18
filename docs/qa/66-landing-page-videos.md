# QA script · Videos on the website (staging)

## Purpose

The website now shows two short videos so a visitor can see what Hospio360 is before reading on:

- **App overview** ("Hospio360 promo video", 1 minute): on the home page, in a new **See Hospio360 in action** section straight
  under the hero, with **Get started** and **Book a demo** below it.
- **Become a partner** ("Hospio360 partners video", about 75 seconds): in the partner card on the home page (`/#partners`) and at
  the top of `/partners/apply`, above "What you earn".

The videos are on YouTube. A video is **not loaded until you press play**: before that the page shows only its poster picture
with a maroon play button. Pressing play puts YouTube's player in the same box (from `youtube-nocookie.com`, YouTube's
privacy-enhanced address) and starts the video. Each video also has a plain **Watch on YouTube** link.

## Links

- Website: https://hospio360.com · partner page: https://hospio360.com/partners/apply · Privacy Policy:
  https://hospio360.com/legal/privacy

No account is needed.

## 1 · Home page: the overview video

1. **Do:** open the website and scroll just past the hero (the big headline and the dashboard picture). **Expect:** a section
   "WATCH · See Hospio360 in action" with a wide poster picture, a round maroon play button in the middle and the video's name
   at the bottom of the picture. Under it: "One app for hotels, lounges, bars and restaurants — 1 minute" and **Watch on
   YouTube**; then **Get started** and **Book a demo**.
2. **Do:** click the play button (or anywhere on the picture). **Expect:** the video starts playing in the same box, with sound
   controls and full screen. Nothing on the page jumps or moves.
3. **Do:** click the full-screen button in the player, then Esc. **Expect:** full screen works and the page is as you left it.
4. **Do:** reload, then click **Watch on YouTube**. **Expect:** the video opens on youtube.com in a new tab; the website stays
   open.
5. **Do:** click **Get started** and (back on the page) **Book a demo**. **Expect:** the sign-up page; an email draft "Hospio360
   demo request". Same as the two buttons in the hero.

## 2 · Home page: the partner video

1. **Do:** open `https://hospio360.com/#partners` (or scroll to the end of Pricing). **Expect:** the maroon-tinted partner card
   has the text and **Apply to be a partner** on the left and the partner video on the right, with "How the partner programme
   works — 75 seconds" and **Watch on YouTube** under it.
2. **Do:** press play. **Expect:** the partner video plays in its box.
3. **Do:** click **Apply to be a partner**. **Expect:** `/partners/apply` opens.

## 3 · The partner page

1. **Do:** open `/partners/apply`. **Expect:** on a computer the video is top right, beside the heading "Apply to be a Hospio360
   partner" and directly above the maroon "What you earn" panel; same caption and **Watch on YouTube** link.
2. **Do:** press play. **Expect:** the video plays in its box; the form below has not moved.
3. **Do:** click **Send my application** on the empty form. **Expect:** "Please check the highlighted fields." as before (script
   64 covers the form itself; nothing about it changed).

## 4 · Keyboard

1. **Do:** on the home page press Tab until the poster picture has a white outline, then press **Enter**. **Expect:** the video
   plays. Reload and do the same with the **Space bar**. **Expect:** the video plays and the page does not scroll down.
2. **Do:** after it starts, press Space or K. **Expect:** the video pauses (the keyboard is now on the player).

## 5 · Nothing from YouTube before you press play

1. **Do:** in Chrome open DevTools → Network, tick "Disable cache", reload the home page and type `youtube` in the filter.
   **Expect:** no requests. Type `ytimg`. **Expect:** only the poster pictures (`i.ytimg.com/vi/…/maxresdefault.jpg`).
2. **Do:** press play and look again. **Expect:** requests to `www.youtube-nocookie.com` appear only now. The Console shows no
   red "Refused to frame" or "Content Security Policy" message.
3. **Do:** open the Privacy Policy, section **11. Cookies**. **Expect:** 11.2 says the videos are hosted on YouTube (Google) and
   load only when you press play. The version at the top is unchanged (**PRIV-2026-11**) and nobody is asked to accept anything
   again.

## 6 · Phone and tablet

1. **Do:** open the home page on a phone (or Chrome DevTools at 390 wide), and at 820 and 1024 wide. **Expect:** the videos fill
   the width of the page, keep their wide shape (16:9) and nothing runs off the right edge; the page does not scroll sideways.
   In the partner card on a phone the text and button come first, the video under them.
2. **Do:** open `/partners/apply` at 390 and 820 wide. **Expect:** the order is heading, **video**, "What you earn", then the
   form.
3. **Do:** on the phone tap play, then the full-screen button. **Expect:** the video plays and goes full screen; turning the
   phone sideways works.

## 7 · With JavaScript off (optional)

1. **Do:** in Chrome DevTools press Cmd/Ctrl+Shift+P, run "Disable JavaScript", reload the home page and click the poster.
   **Expect:** the video opens on youtube.com in a new tab (the picture and **Watch on YouTube** are ordinary links). Turn
   JavaScript back on afterwards.

## 8 · Nothing else changed

1. **Expect:** the hero, the roles strip under the video section, Pricing and the footer look as before; the partner card still
   says 20% of Hospio360's fee for 12 months, paid monthly, 5% WHT.
2. **Expect:** no street address anywhere (the company is "Oyeks Global Ltd, Lagos, Nigeria").

## Changing a video later (developers)

Both links live in one file, `apps/landing/src/config/videos.ts` (`VIDEOS.overview`, `VIDEOS.partner`): paste the new YouTube
link in `url` and update the title, caption, date and length beside it.
