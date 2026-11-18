# QA script · Default stores for a new hotel (staging)

## Purpose

A new hotel used to start with no inventory stores, so its first kitchen, restaurant or bar had no store to draw stock
from (DEF-077: "No store yet · add one in Inventory first"). Now every new hotel starts with four stores, and a new outlet
starts on the store of its kind:

| Store | Kind | A new outlet of this kind starts on it |
|---|---|---|
| Main store | MAIN | (any kind, when the hotel has no store of the outlet's kind) |
| Kitchen store | KITCHEN | Kitchen, Restaurant |
| Bar store | BAR | Bar |
| Housekeeping store | HOUSEKEEPING | none |

The stores are made when the hotel is created, on both paths: the back-office onboarding **Hotels** step and an owner
adding a hotel (self-serve wizard or My business). They are made only when the hotel has no store at all, so a hotel
whose stores someone already set up is never given extra ones. Hotels created before 18 Nov 2026 with no store at all
get the same four stores from a one-time backfill (QA 56 section 3); a hotel that already had stores is never changed.

## Links

- Admin portal: https://admin-staging.hospio360.com (onboarding)
- Hotel app: https://web-staging.hospio360.com
- Contract: `docs/inventory-stores.md` (Stores · Default stores) in hospio-backend

## Accounts

Password for every account: `Hospio123!`

| Who | Email |
|---|---|
| Super admin | `amoria@hospio360.com` |
| Manager of the hotel you create | the one you add in step 7 (People), `@hospio-qa.test` |

Name everything "QA Stores <your initials>". Use `@hospio-qa.test` emails only.

## 1 · A hotel made in onboarding gets the four stores

1. **Do:** admin portal → **Onboarding** → **Set up a business for them**: owner "QA Stores Owner <initials>",
   `owner.stores.<initials>@hospio-qa.test`, business "QA Stores <initials>", city Lagos, fee 1.5 → **Create business**.
2. **Do:** go to step **4 · Hotels** → **Add a hotel**: "QA Stores Ikeja <initials>", Lagos, an address → **Add hotel**.
   **Expect:** "Hotel added" and the hotel in the list.
3. **Do:** step **7 · People** → **Add a person**: Manager, `manager.stores.<initials>@hospio-qa.test`, the new hotel →
   **Add person**. Note the temporary password shown in the row.
4. **Do:** in a private window, sign in to the hotel app as that manager with the temporary password, choose
   `Hospio123!`. Open **Inventory**. **Expect:** Main store, Kitchen store, Bar store and Housekeeping store, each empty.

## 2 · A new outlet starts on its kind's store

1. **Do:** as the manager, **Hotel setup → Restaurants & tables → Add outlet**. **Expect:** Kind *Kitchen* and
   **Store it draws stock from** already *Kitchen store* (not empty, no "No store yet" hint).
2. **Do:** change Kind to *Bar*. **Expect:** the store changes to *Bar store*. Change to *Restaurant*: *Kitchen store*.
3. **Do:** pick *Main store* by hand, then change Kind to *Bar*. **Expect:** the store stays *Main store* (a store you
   picked is never changed for you).
4. **Do:** set Kind *Kitchen*, store *Kitchen store*, name "QA Stores Kitchen" → **Save**. **Expect:** "Outlet added";
   the card reads *Kitchen · draws from Kitchen store*.
5. **Do:** **Edit** the outlet and change its Kind. **Expect:** the store does not change (only a new outlet follows its
   kind).

## 3 · Existing hotels are untouched

1. **Do:** sign in as Tunde (`tunde@royalsuites.ng`) → **Inventory**. **Expect:** Simpas Ikeja's own stores, exactly as
   before (no second Main/Kitchen/Bar store).
2. **Do:** in a hotel made before 18 Nov that had no stores, after the backfill (QA 56 section 3), **Add outlet**.
   **Expect:** the store preselected as for a new hotel (no DEF-077 hint).

## What to report

- A new hotel without the four stores, or with them twice.
- A hotel that already had stores getting new ones.
- A new outlet starting with no store although the hotel has one of its kind, or a store you picked by hand changing.
