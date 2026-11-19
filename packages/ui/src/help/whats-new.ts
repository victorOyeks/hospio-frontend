import type { WhatsNewItem } from "./types";

/** This week's changes, in the user's words. Newest first; keep it to the last week or two. */
export const whatsNewWeek = "Week of 15 November 2026";

export const whatsNew: WhatsNewItem[] = [
	{
		title: "Receipts go on WhatsApp",
		body: "When you take a payment the receipt choice is now “WhatsApp” (to the guest's phone) or “Don't send”. Receipts are no longer printed or emailed, and the Print receipt buttons are gone. To send one again, open the payment (My payments, Payments or the sale) and tap “Send receipt on WhatsApp”. Managers and owners can still keep a receipt as a PDF from Payments.",
		audience: ["EVERYONE"],
	},
	{
		title: "Waiters and cashiers",
		body: "Two new roles for restaurants, bars and lounges (hotels can use them too). A waiter opens tabs at their tables, sends orders to the bar and kitchen and marks them served; they see only their own tabs. A cashier takes payment for any open tab or sale, keeps the cashier till and sends receipts on WhatsApp. Add them in Staff → Add staff. Hotel setup → “Restaurant & bar” decides whether waiters may take payment themselves.",
		audience: ["MANAGER", "OWNER"],
	},
	{
		title: "Suspension is now real",
		body: "A suspended business is locked out: everyone there sees “This account is suspended”, and only the owner can sign in to see and pay what is owed. Fees & billing → Invoices has “Suspension candidates” (an invoice 30 or more days overdue) with “Send notice” (the 7 days' notice by email) and “Suspend”. A suspension for unpaid invoices lifts by itself when every overdue invoice is paid; “Reactivate” on the business page puts the previous stage back. You can still open the business and view as the owner.",
		audience: ["PLATFORM"],
	},
	{
		title: "One monthly invoice",
		venueBody: "Nothing is debited from your account any more. On the 1st Hospio360 sends one invoice for the month before: the platform fee for each location, guest messages and devices & internet. Pay it within 7 days under “Billing & invoices” with “Pay now”, and download the invoice and receipts there. If it is still unpaid after the 11th, card/transfer POS payments and new sales pause until it is paid; cash on existing bills and tabs and reports keep working.",
		body: "Nothing is debited from your account any more. On the 1st Hospio360 sends one invoice for the month before: the platform fee for each location, guest messages and devices & internet. Pay it within 7 days under “Billing & invoices” with “Pay now”, and download the invoice and receipts there. If it is still unpaid after the 11th, card/transfer POS payments, new sales and new bookings pause until it is paid; check-out and cash on existing bills keep working. Hospio fees still shows this month so far.",
		audience: ["OWNER", "MANAGER"],
	},
	{
		title: "Monthly invoices in Fees & billing",
		body: "Fees & billing opens on “Invoices”: every business's monthly invoice with its status, the reminder log, and Record payment, Extend, Credit note and Void. The daily debit and “Run debit” are gone. Settings → Fee defaults has the invoice VAT and minimum.",
		audience: ["PLATFORM"],
	},
	{
		title: "Pick up where you were after the lock screen",
		venueBody: "When a shared tablet locks, or you sign in again after being signed out, you go back to the page you were on. A bar sale, a kitchen order and a till handover keep what you had typed, with “Restored what you were typing · Clear” at the top. Only you get it back: someone else unlocking starts on their own home page. Payments are never kept; take them again.",
		body: "When a shared tablet locks, or you sign in again after being signed out, you go back to the page you were on. Check-in, New booking, a bar sale, a kitchen order, a till handover and a housekeeping problem report keep what you had typed, with “Restored what you were typing · Clear” at the top. Only you get it back: someone else unlocking starts on their own home page. Payments are never kept; take them again.",
		audience: ["FRONT_OFFICE", "BAR", "KITCHEN", "HOUSEKEEPING", "MANAGER"],
	},
	{
		title: "A tidier admin portal",
		body: "The menu is grouped: Customers, Operations, Money, Growth and Platform. “Locations” lists every location (hotel, lounge, bar or restaurant) across businesses; tap one for its figures, POS keys, Hospio fees and guest messages in a side panel. Press ⌘K to jump to any business, hotel, ticket or page. Fees & billing and Payments & POS have clear tabs, and provider keys are on the new “Integrations” page (Super admin).",
		audience: ["PLATFORM"],
	},
	{
		title: "Your hotel's colours everywhere",
		venueBody: "Hotel setup → “Brand & colours” sets the brand colour, a short name, the logo and a dark or white sidebar. You see the change straight away; after “Save changes” it is used within a minute for every role, in emails to guests and on WhatsApp messages.",
		body: "Hotel setup → “Brand & colours” sets the brand colour, a short name, the logo and a dark or white sidebar. You see the change straight away; after “Save changes” it is used within a minute for every role, on the guest's booking page, in booking emails and on WhatsApp messages.",
		audience: ["MANAGER", "OWNER"],
	},
	{
		title: "Sign-in keeps your hotel's look",
		body: "After you sign out, this browser's sign-in, password and lock screens keep your hotel's colours and name. “Use the Hospio360 look” under the sign-in form resets it.",
		audience: ["EVERYONE"],
	},
	{
		title: "Guests get WhatsApp and their own booking page",
		stay: true,
		body: "When a booking is made, moved or cancelled, the guest gets a WhatsApp, and an email if they have one, with a “View booking” button. Their booking page shows the stay, directions and ways to call or chat with the hotel. A guest with no email gets receipts by WhatsApp.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER"],
	},
	{
		title: "Choose what guests are sent",
		venueBody: "Hotel setup → “Guest messaging” has your hotel's WhatsApp number and automatic receipts.",
		body: "Hotel setup → “Guest messaging” has your hotel's WhatsApp number, booking confirmations, a reminder the day before arrival and automatic receipts.",
		audience: ["MANAGER", "OWNER"],
	},
	{
		title: "The rota and Staff & shifts",
		body: "Plan the week on Staff → “Rota” and use “Copy last week”. Add your own shifts and departments in Hotel setup → “Staff & shifts”, or start from Morning, Afternoon and Night.",
		audience: ["MANAGER", "OWNER"],
	},
	{
		title: "How long things are kept",
		body: "Notifications are kept for 30 days. Inbox and guest Messaging conversations are deleted 30 days after their last message. The activity log keeps entries for 6 months.",
		audience: ["EVERYONE"],
	},
	{
		title: "Card payments update on their own",
		body: "After “Send to POS” the screen checks every few seconds and shows approved or declined as soon as the POS answers. After 3 minutes it shows “Still waiting for the POS” with “Check again”. Don't send a second charge while one is waiting.",
		audience: ["FRONT_OFFICE", "BAR", "KITCHEN", "LAUNDRY", "MANAGER"],
	},
	{
		title: "Name the vendor you paid",
		body: "When you complete a work order with a vendor cost, add the vendor's name. “Mark done” stays greyed out until you do.",
		audience: ["MAINTENANCE"],
	},
	{
		title: "SMS is only for sign-in codes",
		body: "Messages to guests and staff now go by WhatsApp and email; SMS is only for sign-in codes.",
		audience: ["EVERYONE"],
	},
	{
		title: "A room stays the guest's until check-out",
		stay: true,
		body: "A guest keeps the room until you check them out, even after their check-out date. Rooms show “Due out” or “Past departure”, and “Today” lists guests past departure under “Leaving today”. Checking someone else into a room with a guest still in it is refused: check that guest out first, or choose another room.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER"],
	},
];
