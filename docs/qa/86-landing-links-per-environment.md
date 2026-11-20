# QA script · Landing site links per environment (staging)

## Purpose

The public site (hospio360.com and its staging copy) takes every app and API address from the build, not from the code, so
the production build can point at the production apps while staging keeps pointing at staging. On staging nothing should look
or behave differently: every sign-in, create-an-account and partner link still goes to the staging apps.

Developer note: all addresses live in `apps/landing/src/config/env.ts` (NEXT_PUBLIC_HOTEL_APP_URL, NEXT_PUBLIC_ADMIN_APP_URL,
NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL; staging fallbacks). Production values: app.hospio360.com,
backoffice.hospio360.com, api-prod.hospio360.com.

## Links

- Landing (staging build): the staging landing address you normally test
- Hotel app: https://web-staging.hospio360.com

## 1. Header and hero

1. Open the landing home page. Hover **Sign in** in the header: the link is `https://web-staging.hospio360.com/auth`.
2. Hover **Create an account** / **Get started** in the header and the hero: `https://web-staging.hospio360.com/sign-up`.
3. On a phone width, open the menu: **Sign in** goes to the same staging address.

## 2. Pricing, "See it in action", closing banner, features page

1. Scroll to **Pricing**: the get-started button goes to `https://web-staging.hospio360.com/sign-up`; **Become a partner**
   opens `/partners/apply` on the landing site.
2. The buttons under **See it in action** and the closing banner go to the same staging sign-up page.
3. Open **/features**: its create-an-account button goes to the staging sign-up page.

## 3. Footer

1. **Get started** column: **Create an account** → staging sign-up, **Sign in** → staging `/auth`.
2. No link in the footer points to app.hospio360.com, backoffice.hospio360.com or api-prod.hospio360.com.

## 4. Partner application

1. Open **/partners/apply**, fill the form with test details (email on `hospio-qa.test`, phone 2349035911994) and submit.
2. Expect the usual "received" screen. The application appears in the staging admin console's partner applications list
   (it went to the staging API).

## 5. Guest booking page

1. Open a booking link from a staging booking confirmation (`/stay/<token>`): the booking shows as before (the page reads the
   staging API).

## Pass

Every link above points to a staging address and both forms of traffic (partner form, booking page) reach staging.
