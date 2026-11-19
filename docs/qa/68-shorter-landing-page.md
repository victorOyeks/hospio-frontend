# QA script · Shorter home page and the new Features page (staging)

## Purpose

The home page was too long: about 25 screens of scrolling on a phone and 14 on a computer. It is now about 6½ screens on a
phone and 6 on a computer. Nothing was thrown away: the long feature sections moved, with their pictures, to a new page,
**/features**.

What is on the home page now, in order:

1. **Hero**: headline, one sentence, **Get started** and **Book a demo**. On a phone it fits the first screen with no product
   picture; on a computer a short strip of the owner dashboard shows under the buttons.
2. **See Hospio360 in action**: the overview video (unchanged, script 66).
3. **Everything you need to run the place**: six small cards and a **See all features** button.
4. **Live in four steps**: four numbered chips.
5. **One simple price**: "1.5% of your sales" with what is included, beside the **partner card** (with the partner video).
6. **Questions owners ask us**: 5 questions, all closed, and **More questions**.
7. The maroon closing box and a shorter footer.

The words now fit any business: "hotels, lounges, bars and restaurants", "your business", "every location". The product name
and the legal pages did not change.

This script replaces what script 66 says about where things sit on the home page (the roles strip is now on /features, the
partner card is beside the price). The video behaviour in script 66 is unchanged.

## Links

- Website: https://hospio360.com · features: https://hospio360.com/features · partner page:
  https://hospio360.com/partners/apply · fees: https://hospio360.com/legal/fees

No account is needed.

## 1 · Length on a phone

1. **Do:** open the website on a phone (or Chrome DevTools at 390 wide). **Expect:** the first screen shows the green-dot line
   "For hotels, lounges, bars and restaurants in Nigeria", the headline "Every room, every table, every till — on one screen.",
   one sentence, and **Get started** and **Book a demo**. There is no dashboard picture on a phone.
2. **Do:** scroll to the bottom. **Expect:** about 6 to 7 screens in all, in the order listed under Purpose. The page never
   scrolls sideways.
3. **Do:** look at the top bar while scrolling. **Expect:** it stays at the top and is slim (logo, **Get started**, the menu
   button).
4. **Do:** at the very bottom tap **Back to top ↑**. **Expect:** the page returns to the top.

## 2 · Length on a computer and a tablet

1. **Do:** open the website on a computer. **Expect:** the hero shows a short strip of the owner dashboard that fades out at the
   bottom, with "The owner's morning view, shown with sample data. **See all features**" under it. The whole page is about 6
   screens.
2. **Do:** look at 820 and 1024 wide (DevTools). **Expect:** nothing overlaps or runs off the edge; the six cards are in 2
   columns at 820 and 3 columns from 1024.

## 3 · The six feature cards and the Features page

1. **Do:** on the home page find "Everything you need to run the place." **Expect:** six cards, 2 across on a phone and 3 across
   on a computer: A view for every role · Bills that keep themselves · Card, transfer or cash · You stay in charge · Every
   department, connected · Your brand, your colours. Each has an icon and one line.
2. **Do:** click **Card, transfer or cash**. **Expect:** `/features#payments` opens at the maroon section "Card, transfer or
   cash — straight from the screen to the till.", not hidden under the top bar.
3. **Do:** go back and click **See all features**. **Expect:** `/features` opens: the heading "Everything Hospio360 does, in
   detail.", **Get started** and **Book a demo**, a row of jump links, then every section that used to be on the home page, with
   its pictures: the roles strip, owner / manager / staff, the guest folio, payments, control, departments, your brand; then all
   7 questions and the closing box.
4. **Do:** click each jump link (Owner, manager, staff · Guest folio · Payments · Control · Departments · Your brand · FAQ).
   **Expect:** each jumps to its section.
5. **Do:** open these old links: `/#product`, `/#folio`, `/#payments`, `/#control`, `/#departments`, `/#brand`. **Expect:** each
   opens the home page at its card (no "page not found").

## 4 · Menu and footer links

1. **Do:** use the top menu (on a phone, the menu button): Features · Getting started · Pricing · Partners · FAQ. **Expect:**
   Features opens `/features`; the others jump to that part of the home page, also when clicked from `/features` or a legal
   page.
2. **Do:** click every link in the footer. **Expect:** none gives "page not found". All features, Owner, manager and staff apps,
   Departments and Payments open `/features` at the right place; Pricing jumps to the price; the legal links open the legal
   pages; Create an account and Sign in open the app; Book a demo, Contact and Support open an email draft.
3. **Expect:** on a phone the footer's four lists sit two by two. The bottom line reads "© 2026 Hospio360, a product of Oyeks
   Global Ltd (RC 10001123)", "Lagos, Nigeria" and hello@oyeksglobal.com. There is no street address anywhere.

## 5 · Four steps

1. **Do:** find "Live in four steps." **Expect:** four numbered chips: Create your account · Add your business · Rooms or
   outlets, and prices · Invite your manager, and the line "Prefer to hand it over? The Hospio360 team can set it all up for
   you." On a phone the chips show the step names only; from tablet width up each has one line under it.

## 6 · Price

1. **Do:** find "One simple price." **Expect:** a large **1.5%** "of your sales", then: worked out on each location's daily
   sales (before VAT) and billed on **one monthly invoice, due within 7 days**; paid online by card, bank transfer or USSD;
   **nothing is ever debited from your account**. Four ticked lines of what is included, **Get started** and **How fees work**.
2. **Do:** click **How fees work**. **Expect:** `/legal/fees` opens ("Fees and monthly invoice"); its version is unchanged.
3. **Expect:** nowhere on the home page, `/features` or `/partners/apply` is there any mention of a daily debit, 06:00,
   Moniepoint or OPay, or of "choose the model that fits", "per room-night" or an "agreed share" (the old price wording).

## 7 · Partner card

1. **Do:** open `/#partners`. **Expect:** the pink card beside the price (under it on a phone): "Know owners of hotels, lounges,
   bars or restaurants?", "Earn 20% of Hospio360's fee from every business you bring on, for 12 months.", **Apply to be a
   partner**, and the partner video as a small picture with a play button.
2. **Do:** press play. **Expect:** the video plays in the same small box; nothing moves.
3. **Do:** click **Apply to be a partner**. **Expect:** `/partners/apply` opens with the full offer, the video and the form
   (scripts 64 and 66).

## 8 · Questions

1. **Do:** find "Questions owners ask us." **Expect:** 5 questions, all closed: What does Hospio360 cost? · Does it work for a
   lounge, bar or restaurant, not only a hotel? · Do we need new hardware? · Who sets everything up? · Can one location see
   another location's data?
2. **Do:** click a question, then click it again. **Expect:** the answer opens under it, then closes.
3. **Do:** click **More questions**. **Expect:** `/features#faq` opens with all 7 questions.
4. **Do:** click **Ask us on a demo**. **Expect:** an email draft "Hospio360 demo request" asking for the business name, its
   type (hotel, lounge, bar or restaurant), city and phone number.

## 9 · Buttons

1. **Do:** click **Get started** in the top bar, the hero, the price card and the closing box. **Expect:** each opens the
   sign-up page.
2. **Do:** click **Book a demo** in the hero and the closing box. **Expect:** the email draft from 8.4.
3. **Do:** click **Sign in** (top bar on a computer; in the menu on a phone). **Expect:** the sign-in page.

## 10 · Nothing else changed

1. **Expect:** both videos behave as in script 66 (nothing loads from YouTube until play is pressed).
2. **Expect:** the maroon brand colour and the look of buttons, cards and headings are as before.
3. **Expect:** `/partners/apply` and every `/legal/…` page read as before, with the same versions; nobody is asked to accept
   anything again.

## For developers

- Home page: `apps/landing/src/app/page.tsx`. Features page: `apps/landing/src/app/features/page.tsx` (it renders the full
  section components, unchanged apart from wording).
- The six cards: `components/sections/feature-grid.tsx`. A card's `id` is its section's id on `/features`, which keeps old
  `/#payments`-style links working.
- Questions: the `FAQS` list in `components/sections/faq.tsx`; the home page shows the first `HOME_FAQ_COUNT`. Both pages carry
  FAQPage data for search engines, and the answers are in the page even when closed (plain `<details>`).
- `Section` and `SectionHeader` take `compact` for the home page's tighter spacing.
