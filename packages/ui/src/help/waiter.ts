import type { HelpModule } from "./types";

export const waiterHelp: HelpModule = {
	audience: "WAITER",
	label: "Waiter",
	intro: "Open tabs at your tables, send orders to the bar and kitchen, and serve them.",
	guides: [
		{
			id: "waiter-open-tab",
			title: "Open a tab at a table",
			when: "Guests sit down and order.",
			topic: "Tabs",
			steps: [
				"Check “Serving at” in the sidebar shows the outlet you are working (it appears when there is more than one).",
				"On “My tabs”, tap “New tab”.",
				"Pick the “Table”, or type the guest's name.",
				"Tap the drinks and food to add them.",
				"Tap “Open tab & send”. The bar and the kitchen get the order at once.",
			],
			goodToKnow: [
				"You see only the tabs you opened. A head waiter (Full access) sees everyone's.",
				"Where the venue asks for it, a tab needs a table or a name.",
				"Each tab has a limit. At the limit the guest pays before adding more; a manager can allow more.",
			],
			route: "/dashboard",
			screen: "My tabs",
		},
		{
			id: "waiter-add-serve",
			title: "Add items and mark them served",
			when: "A table orders more, or their food is ready.",
			topic: "Tabs",
			steps: [
				"On “My tabs”, tap the tab.",
				"Tap “Add items”, pick them and tap “Add to tab”. They are sent straight away.",
				"When the kitchen marks a dish ready it shows “Ready · collect”. Take it to the table and tap “Served”.",
				"To change tables, tap “Move” and pick the new one.",
			],
			goodToKnow: [
				"You get a notification when the kitchen marks your order ready.",
				"You can take an item off only before it is sent. After that a manager cancels it.",
			],
			route: "/dashboard",
			screen: "My tabs",
		},
		{
			id: "waiter-payment",
			title: "When the guest pays",
			when: "A table asks for the bill.",
			topic: "Payments",
			steps: [
				"If your venue has a cashier, tell the cashier the table or the tab number. The tab leaves your list when it is paid.",
				"If the tab shows “Close & pay”, your venue lets waiters take payment: tap it and pick card, transfer or cash.",
			],
			goodToKnow: [
				"“Waiters take payment” is switched on or off in Hotel setup → Restaurant & bar.",
				"Cash is offered to waiters only where the venue allows it, and goes into the cashier's till, which must be open.",
				"“My sales” lists everything you opened, paid or not.",
			],
			route: "/dashboard/sales",
			screen: "My sales",
		},
	],
};
