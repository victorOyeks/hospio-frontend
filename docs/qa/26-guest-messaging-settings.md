# QA script · Hotel setup → Guest messaging (staging)

## Purpose

Hotel setup → **Guest messaging** sets what guests get and how they reach the hotel:

- **Your hotel's WhatsApp number:** guests see **Chat with the hotel on WhatsApp** on their booking page and in their
  booking emails, and it opens a chat with that number with "Hello, about my booking <reference>" typed in. Hospio360's
  own WhatsApp sends the automatic messages; replies to it don't reach the hotel, so this is how guests talk to you.
- **Send booking confirmation:** off means no confirmation when a booking is made. Date changes and cancellations always
  go.
- **Send a reminder the day before arrival:** each guest arriving tomorrow gets one message, sent between 09:00 and 20:00
  (usually on the hour), with the check-in time and the booking page link (directions).
- **Send receipts automatically:** off means no receipt after a payment. The desk can still send one from the payment.

## Links

- Hotel app: https://web-staging.hospio360.com

## Accounts

Password for every account: `Hospio123!`.

| Role | Email |
|---|---|
| Manager | `tunde@royalsuites.ng` |

## Before you start

- Note the four settings and put them back at the end.
- Use the guest **Victor SMS Check** (phone 09035911994) and give him your own email for the email checks. Change it back
  afterwards.

## 1. The hotel's WhatsApp

1. Manager → **Hotel setup** → **Guest messaging**. Type your hotel's WhatsApp number, e.g. `0803 111 0001`, then **Save
   changes**.
2. Make a booking for the guest. The confirmation email has a **View booking** button and, under the details, "Chat with
   the hotel on WhatsApp: https://wa.me/234803…". The link opens WhatsApp with "Hello, about my booking <reference>".
3. **View booking** opens the booking page. It has **Chat with the hotel on WhatsApp** (the main button), **Call the
   hotel** when the hotel has a phone, and **Get directions**.
4. Clear the number and save. Within a minute, new emails and the booking page no longer show the WhatsApp chat.

## 2. Booking confirmation off

1. Turn **Send booking confirmation** off and save.
2. Make a booking for the guest: no confirmation email or WhatsApp arrives.
3. Change the booking's dates: the "Your stay has changed" message still goes.
4. Turn it back on.

## 3. The day before arrival

1. Make a booking for the guest checking in **tomorrow**.
2. By the next hour mark (between 09:00 and 20:00) the guest gets "See you tomorrow": the check-in time (e.g. "from
   14:00") and **View booking**. The WhatsApp version goes once its template is approved.
3. Only one reminder arrives, even across the next hours.
4. Turn **Send a reminder the day before arrival** off, then make another booking for tomorrow: nothing arrives.

## 4. Receipts off

1. Turn **Send receipts automatically** off and save.
2. Take a cash payment for the guest: no receipt is sent.
3. Turn it back on and take another: the receipt goes as usual.

## Clean up

- Cancel the test bookings, put the four settings back, and remove your email from the guest.

## What to report

- A confirmation, reminder or receipt that goes out with its switch off, or doesn't go out with it on.
- More than one day-before reminder for a booking.
- The WhatsApp chat link opening the wrong number, or missing after a number is saved.
