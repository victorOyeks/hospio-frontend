# QA script · Admin portal layout, Hotels, search and Integrations (staging)

## Purpose

The admin portal is reorganised so nothing is buried:

- **Grouped menu:** Overview · Customers (Businesses, Hotels, Onboarding) · Operations (Support, Changes) · Money (Fees & billing,
  Payments & POS) · Growth (Marketers) · Platform (Integrations, Settings, Admin team).
- **Hotels:** every hotel in one list, each opening a side panel: Overview · POS & Hospio fees · Guest messages.
- **Search:** ⌘K (or Ctrl+K, or the box at the top) finds businesses, hotels, tickets and pages.
- **Tabs:** Fees & billing (Daily fees · Fee rules · Statements · Guest messages) and Payments & POS (Settlements & payouts ·
  Guest payments · POS & fee collection).
- **Integrations (super admin):** third-party keys and addresses are set in the portal and stored encrypted: Brevo, SMTP, Infobip,
  Termii, Paystack, Moniepoint, OPay and the fee-debit accounts. Where nothing is saved, the server's own setting applies. Changes
  take effect within about a minute.

## Links

- Admin portal: https://admin-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Super admin | `amoria@hospio360.com` |
| Support | `kola@hospio360.com` |
| Finance admin | `tobi@hospio360.com` |

## 1. The menu

1. As super admin, the menu shows the six groups above. Every item opens without an error.
2. As support, there's no Integrations item. As finance admin, there's no Integrations item either. Opening
   `/dashboard/integrations` directly says it's for super admins.

## 2. Hotels and the hotel panel

1. **Hotels** lists every hotel (the count matches "hotels" on Businesses). Search "Simpas": Simpas Ikeja shows under Royal
   Suites Ltd.
2. Open it. The side panel shows today's figures. The **POS & Hospio fees** tab shows the POS keys card, Hospio fee collection
   and daily fees. The **Guest messages** tab shows the plan.
3. Copy the address and open it in a new tab: the same panel opens. **Back** closes it.
4. Businesses → Royal Suites → **Hotels** → Simpas Ikeja opens the same panel. An old link
   (`/dashboard/businesses/<id>/hotels/<hotelId>`) lands there too.
5. As support, the panel has no fees tab.

## 3. Search

1. Press ⌘K (Ctrl+K on Windows) and type "Royal": Royal Suites Ltd. Type "Simpas" and press Enter: the hotel's panel opens.
2. Type "Daily fees": the page tab shows; pick it.

## 4. Money pages

1. Fees & billing → **Daily fees**: every hotel's days. As super admin, **Work out yesterday** is there (no "Run debit now": nothing is debited, script 63).
2. Payments & POS → **POS & fee collection**: every hotel's keys, Hospio fee state and last daily fee. Search a
   hotel; open its panel.

## 5. Integrations (super admin)

1. Platform → **Integrations**: cards for Email, Messaging, Payments and POS (the Fee debit group was removed on 19 Nov 2026,
   script 74). With nothing saved, each says it uses the server's setting.
2. **Test connection** on Infobip, Brevo, Termii and Paystack: each answers in plain words (templates, account, balance).
   Nothing is sent or charged.
3. Moniepoint POS → **Edit**: enter `not a url`. It's refused ("Start with https://"). Don't save a real value: the staging
   keys are live. Tap **Discard**.
4. **Use the server's value** is under **Advanced** on an open card. Don't use it on staging's saved keys.
5. Secret fields never show in full: after saving, they show as `••••••` plus the last 4 characters.
6. The connection checks at the bottom of the page still show each provider's status.

## What to report

- A menu item, tab or panel that errors or opens the wrong thing.
- Search not finding a business or hotel by name.
- A secret shown in full anywhere, or anyone other than a super admin able to see or change Integrations.
- A change in Integrations that has no effect after two minutes, or a provider that stops working after **Use the server's
  value**.
