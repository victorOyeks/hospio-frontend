import type { HelpModule } from "./types";

export const cashierHelp: HelpModule = {
	audience: "CASHIER",
	label: "Cashier",
	intro: "Take payment for any open tab or sale, keep the till and give receipts.",
	guides: [
		{
			id: "cashier-take-payment",
			title: "Take payment for a tab or sale",
			when: "A waiter or guest brings a bill to pay.",
			topic: "Payments",
			steps: [
				"On “To pay”, tap the tab (find it by table, number or waiter).",
				"Check the items and the total, then tap “Take payment”.",
				"Pick “Card on the POS”, “Bank transfer on the POS” or “Cash”.",
				"Under “Receipt”, print or email it, or tap “Skip receipt”.",
			],
			goodToKnow: [
				"“To pay” shows every outlet's open tabs and sales that still owe money.",
				"Cash goes into the cashier till, so open the till first.",
				"You don't add or remove items: the waiter or the bar does, and a manager cancels what was already sent.",
			],
			route: "/dashboard",
			screen: "To pay",
		},
		{
			id: "cashier-till",
			title: "Open, close and hand over the till",
			when: "At the start and end of your shift.",
			topic: "Till",
			steps: [
				"Open “Till” and tap “Open till”. Count the float and enter it.",
				"During the shift, cash payments are added by themselves. Use “Pay in” or “Pay out” for anything else.",
				"At the end, count the drawer and tap “Close till”, or “Hand over” to pass it to the next cashier.",
			],
			goodToKnow: [
				"Where waiters may take cash, their cash lands in this till too.",
				"A till that is over or short tells the manager.",
			],
			route: "/dashboard/till",
			screen: "Till",
		},
		{
			id: "cashier-find-sale",
			title: "Find a sale or resend a receipt",
			when: "A guest asks for a receipt, or you look for an unpaid sale.",
			topic: "Payments",
			steps: [
				"Open “Sales” for every sale over the days you choose; filter by “To pay” to see what is owed.",
				"Open “My payments” for the payments you took; tap one to print or resend its receipt.",
			],
			goodToKnow: ["The number next to “Sales” in the sidebar is how many sales still owe money."],
			route: "/dashboard/sales",
			screen: "Sales",
		},
	],
};
