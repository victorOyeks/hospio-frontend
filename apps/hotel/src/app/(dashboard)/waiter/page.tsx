import { BarTabsScreen } from "@/components/roles/bar/tabs";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/**
 * Waiter · My tabs (hospio-backend docs/plan-venue-type.md, phase 3): the tabs and orders this waiter opened at the outlet picked
 * in "Serving at" (any outlet of the location; fnb-service answers a waiter with their own orders only). New tab, add items (sent to
 * the bar or kitchen at once), served, move; payment only where Hotel setup lets waiters take it.
 */
export default async function WaiterHome() {
	const desk = await deskOutlets("WAITER");
	const { outlet } = desk;
	const [orders, closed, menu, categories, happyHours, buckets, settings, terminals, outlets] =
		await Promise.all([
			outlet ? data.outlets.orders(outlet.id) : Promise.resolve([]),
			outlet
				? data.outlets.orders(outlet.id, { status: "CLOSED" })
				: Promise.resolve([]),
			outlet ? data.outlets.menu(outlet.id) : Promise.resolve([]),
			outlet ? data.outlets.categories(outlet.id) : Promise.resolve([]),
			outlet ? data.outlets.happyHours(outlet.id) : Promise.resolve([]),
			data.bookings.buckets(),
			data.outlets.settings(),
			data.payments.terminals(),
			data.outlets.list(),
		]);
	return (
		<BarTabsScreen
			mode="waiter"
			outlet={outlet}
			deskOutlets={desk.outlets}
			orders={orders.filter((o) => !o.ticketFrom)}
			closedTabs={closed.length}
			menu={menu}
			categories={categories}
			happyHours={happyHours}
			inHouse={settings.accommodation ? buckets.inHouse : []}
			settings={settings}
			terminals={terminals}
			outlets={outlets}
		/>
	);
}
