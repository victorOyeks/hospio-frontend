# QA script · Guest messages: subscribed vs on hold (staging)

## Purpose

The admin portal's Guest messages table used to show a switch and a Suspend link that looked like the same thing. They are
different:
- **Subscribed** (the switch) is the hotel's choice to use the paid service. The hotel's manager can change it too, in Hotel setup.
- **On hold** is Hospio360 stopping it for non-payment. It is added on its own when an invoice goes overdue and lifted on its own
  when the invoice is paid. Admins can also add or lift a hold by hand.

Messages go only when a hotel is subscribed and not on hold.

## Links

- Admin portal: https://admin-staging.hospio360.com → Hotels → a hotel → Guest messages (also onboarding → Go live)
- Hotel app: https://web-staging.hospio360.com → Hotel setup → Guest messages

## 1. The table

1. A short explainer sits above the table.
2. Columns: **Subscribed** (switch, Yes/No), **Sending** (Sending / Not subscribed / On hold, with a line of detail), prices,
   this month, unpaid.
3. On hold shows the reason and the date it started. A hotel that is unsubscribed *and* on hold shows both.

## 2. Put on hold / lift the hold

1. On a subscribed hotel, **Put on hold…** asks for a reason (at least 5 characters; prefilled when invoices are unpaid) and says
   what will happen. Confirm: Sending turns **On hold**.
2. An unsubscribed hotel has no Put on hold link (there's nothing to stop).
3. **Lift hold…** says how much is still unpaid, if anything, before lifting. Confirm: Sending turns back to **Sending**
   (or Not subscribed).

## 3. The hotel's side

1. In the hotel app, Hotel setup → Guest messages shows "Guest messages are on hold by Hospio360" with the reason.
2. With an unpaid invoice it says to pay it; with none it says to contact Hospio360 support.

## What to report

- Any place where the switch and the hold still look like the same control.
- Messages going to guests while a hotel shows On hold or Not subscribed.
