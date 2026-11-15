# QA script · WhatsApp booking messages and the guest's booking page (staging)

## Purpose

When a booking is made, changed or cancelled, and when a guest without an email pays, the guest gets a WhatsApp message
from **Hospio360**. Each message has:

- the Hospio360 banner at the top;
- the details one per line, with the hotel's phone;
- a **View booking** button on booking messages (not on receipts).

**View booking** opens the guest's own booking page at `hospio360.com/stay/…` with no sign-in. The page shows the status,
dates and check-in and check-out times, room type, guests, and the hotel's address (**Get directions**) and phone
(**Call the hotel**).

When WhatsApp can't be used (the template isn't approved yet, or WhatsApp refuses the message), the same message goes as
a one-page SMS.

## Links

- Hotel app: https://web-staging.hospio360.com
- Infobip logs (WhatsApp sent and delivered): portal.infobip.com → Analyze → Logs

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |

## Before you start

- Staging only texts the allow-listed number **09035911994**. Use the guest **Victor SMS Check**, who has that number
  and no email. Bookings for any other guest are held back, which is expected.
- Have that phone at hand, with WhatsApp open.
- Use dates well in the future (e.g. February 2027) so you don't clash with other tests.

## 1. Booking confirmed

1. Manager → **Bookings** → new booking for **Victor SMS Check**, Deluxe, two nights.
2. Within a minute the phone gets a WhatsApp from Hospio360 (the number until the name is approved). Check:
   - the burgundy Hospio360 banner is on top;
   - it says "Hello Victor, your stay at **Simpas Ikeja** is confirmed" with the reference, check-in, check-out and room
     on their own lines;
   - "Call the hotel on …" shows the hotel's phone. If the hotel has no phone, it says "its front desk number";
   - **View booking** is a button under the message;
   - the footer says "Hospio360 by Oyeks Global".
3. Tap **View booking**. The page opens without asking you to sign in and shows:
   - **Confirmed**, the hotel's name and the same reference;
   - check-in and check-out dates with "from 2pm" and "by 12pm" (the hotel's times);
   - 2 nights, Deluxe and 1 adult;
   - **Call the hotel** (opens the dialler with the hotel's number) and **Get directions** (opens Maps at the hotel's
     address).
4. The page never shows the room number, prices or notes.

## 2. Dates changed

1. Change the booking's dates.
2. A WhatsApp "your stay at … has new dates" arrives with the new dates and a **View booking** button.
3. Open the page again (from either message): it shows the new dates.

## 3. Receipt

1. Take a **cash** payment for the guest (no email) with the receipt sent on WhatsApp.
2. A WhatsApp "… has received your payment" arrives with the banner, amount, how it was paid and the reference. It has no
   button.

## 4. Cancelled

1. Cancel the booking with a reason, e.g. "Plans changed".
2. A WhatsApp "your booking at … has been cancelled" arrives with the old dates and the reason.
3. **View booking** now shows **Cancelled**, the dates struck through, and "This booking has been cancelled: Plans
   changed."

## 5. A link that isn't right

1. Open the link from a message, change one letter in the middle of the address and open it. The page says "This link
   isn't working" and shows no booking.
2. Open `https://hospio360.com/stay/abc`. The page shows the same message.

## Clean up

- Cancel the test booking if you didn't in step 4.

## What to report

- A message that arrives as plain text with no banner, or no **View booking** button on a booking message, after the
  `_v2` templates show as approved in Infobip.
- A message with an empty or wrong value (wrong hotel, wrong dates, "Hello there" for a guest with a name).
- The booking page asking for a sign-in, showing another guest's booking, or showing the room number or prices.
- **Call the hotel** or **Get directions** going to the wrong number or place.
- An altered link that still opens a booking.
