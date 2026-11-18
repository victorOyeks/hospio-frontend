import { BarTabsScreen } from "@/components/roles/bar/tabs";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/**
 * Cashier · To pay (hospio-backend docs/plan-venue-type.md, phase 3): every open tab and sale of the location that still owes
 * money, whoever opened it, each with its outlet. The cashier takes the payment (cash into the cashier till, card or transfer on
 * the outlet's POS) and prints the receipt; nothing is rung up or taken off here.
 */
export default async function CashierHome() {
	const desk = await deskOutlets("CASHIER");
	const ids = new Set(desk.peers);
	const [orders, closed, buckets, settings, terminals, outlets] = await Promise.all([
		data.outlets.orders(),
		data.outlets.orders(undefined, { status: "CLOSED" }),
		data.bookings.buckets(),
		data.outlets.settings(),
		data.payments.terminals(),
		data.outlets.list(),
	]);
	const mine = (rows: typeof orders) =>
		rows.filter((o) => !o.ticketFrom && (!o.outletId || ids.has(o.outletId)));
	return (
		<BarTabsScreen
			mode="cashier"
			outlet={desk.outlet}
			deskOutlets={desk.outlets}
			all={desk.outlets.length > 1}
			orders={mine(orders)}
			closedTabs={mine(closed).length}
			menu={[]}
			categories={[]}
			happyHours={[]}
			inHouse={settings.accommodation ? buckets.inHouse : []}
			settings={settings}
			terminals={terminals}
			outlets={outlets}
		/>
	);
}
