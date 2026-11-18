import type { HelpModule } from "./types";

export const marketerHelp: HelpModule = {
	audience: "MARKETER",
	label: "Marketer",
	intro:
		"Refer hotels to Hospio360, follow your referrals and get paid your commission.",
	guides: [
		{
			id: "mkt-refer-hotel",
			title: "Refer a hotel",
			when: "You know a hotel that should use Hospio360 and want us to contact them.",
			topic: "Referrals",
			steps: [
				"Open “Refer a hotel”.",
				"Under “Their details”, fill in the “Hotel or business name”.",
				"Add the “City”, “Owner's name”, “Phone (WhatsApp)” and “Email” if you have them.",
				"Under “Anything we should know”, add the number of rooms, what they use today or when to call.",
				"Tap “Send referral”.",
			],
			goodToKnow: [
				"Only the hotel name is required, but a phone number helps us reach them.",
				"We call them within 2 working days.",
				"“Your referrals” shows where each one is: Lead, Contacted, Onboarding, Live or Didn't sign up.",
			],
			route: "/dashboard/refer",
			screen: "Refer a hotel",
		},
		{
			id: "mkt-share-link",
			title: "Accept the agreement and share your referral link",
			when: "You want a hotel owner to sign up themselves and still count as your referral.",
			topic: "Referrals",
			steps: [
				"On your dashboard, read the “Referral Partner Agreement”, tick the box and tap “Accept”.",
				"Open “Refer a hotel” and find “Your link”.",
				"Tap the copy button next to the link, then paste it in a message.",
				"Or tap “Share on WhatsApp” to send it with a ready-made message.",
			],
			goodToKnow: [
				"Your link and the share buttons appear once you accept the agreement.",
				"Anyone who signs up through your link is yours; the sign-up page shows your first name.",
				"You earn your share of the platform fee collected from each business you refer, for the agreed months from its first collected fee.",
				"Your link stops working if your agreement is ended.",
			],
			route: "/dashboard/refer",
			screen: "Refer a hotel",
		},
		{
			id: "mkt-my-businesses",
			title: "See what each business earns you",
			when: "You want to check a business you referred and what it has earned you.",
			topic: "Earnings",
			steps: [
				"Open “My businesses”.",
				"Each row shows the stage, your agreement, how long it earns and what it has earned you (net).",
				"Tap a business to see its agreement, its earning window and its commission lines.",
			],
			goodToKnow: [
				"The months start with the first fee Hospio360 collects from the business, not the day it signs up.",
				"Nothing is earned on fees that aren't collected; no commission on devices, data plans or message charges.",
				"Every business that named you is listed, whatever its stage.",
			],
			route: "/dashboard/businesses",
			screen: "My businesses",
		},
		{
			id: "mkt-bank-details",
			title: "Add or change your bank details",
			when: "You are new, or your bank account has changed.",
			topic: "Earnings",
			steps: [
				"Open “Commissions” and find “Bank details”.",
				"Tap “Add bank details” (or “Change bank details”).",
				"Pick the “Bank” (or “Other” and type it), enter the 10-digit “Account number” and the “Name on the account”.",
				"When you change saved details, say why under “Why are you changing them?”.",
				"Tap “Save”.",
			],
			goodToKnow: [
				"Hospio360 finance checks every change before your next statement is approved.",
				"Approved statements are paid by bank transfer by the 15th.",
			],
			route: "/dashboard/commissions",
			screen: "Commissions",
		},
		{
			id: "mkt-statement",
			title: "Check your monthly statement",
			when: "Your statement for last month is ready (on the 5th).",
			topic: "Earnings",
			steps: [
				"Open “Commissions” and tap a statement.",
				"Check the lines per business, any clawback, the WHT and the payable.",
				"If something looks wrong, tap “Raise a query”, say what, and tap “Send query”.",
			],
			goodToKnow: [
				"You have 7 days from the statement to raise a query.",
				"Once approved, you are paid by the 15th. Under ₦5,000 rolls into the next statement.",
				"If a collected fee is refunded, the commission on it comes off your next statement.",
				"“Next statement so far” shows the lines earned since your last statement.",
			],
			route: "/dashboard/commissions",
			screen: "Commissions",
		},
	],
};
