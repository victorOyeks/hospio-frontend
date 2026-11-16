import type { WhatsNewItem } from "./types";

/** This week's changes, in the user's words. Newest first; keep it to the last week or two. */
export const whatsNewWeek = "Week of 15 November 2026";

export const whatsNew: WhatsNewItem[] = [
	{
		title: "A tidier admin portal",
		body: "The menu is grouped: Customers, Operations, Money, Growth and Platform. “Hotels” lists every hotel across businesses; tap one for its figures, POS keys, Hospio fees and guest messages in a side panel. Press ⌘K to jump to any business, hotel, ticket or page. Fees & billing and Payments & POS have clear tabs, and provider keys are on the new “Integrations” page (Super admin).",
		audience: ["PLATFORM"],
	},
	{
		title: "Your hotel's colours everywhere",
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
		body: "When a booking is made, moved or cancelled, the guest gets a WhatsApp, and an email if they have one, with a “View booking” button. Their booking page shows the stay, directions and ways to call or chat with the hotel. A guest with no email gets receipts by WhatsApp.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER"],
	},
	{
		title: "Choose what guests are sent",
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
		body: "A guest keeps the room until you check them out, even after their check-out date. Rooms show “Due out” or “Past departure”, and “Today” lists guests past departure under “Leaving today”. Checking someone else into a room with a guest still in it is refused: check that guest out first, or choose another room.",
		audience: ["FRONT_OFFICE", "MANAGER", "OWNER"],
	},
];
