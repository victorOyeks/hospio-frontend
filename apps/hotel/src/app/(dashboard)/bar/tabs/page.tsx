import { BarTabsScreen, type OutletKit } from "@/components/roles/bar/tabs";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/**
 * Bar · Tabs: the open tabs of the outlet picked in "Serving at", or of every bar outlet when a manager or lead
 * picked "All outlets" (one read of /fnb/orders without an outlet, kept to the bar's outlets).
 */
export default async function BarTabsPage() {
	const desk = await deskOutlets("BAR");
	const { outlet, all } = desk;
	const ids = new Set(desk.peers);
	const ofBar = (rows: Awaited<ReturnType<typeof data.outlets.orders>>) =>
		rows.filter((o) => !!o.outletId && ids.has(o.outletId));
	const others = all ? desk.outlets.filter((o) => o.id !== outlet?.id) : [];
	const [
		orders,
		closed,
		menu,
		categories,
		happyHours,
		buckets,
		settings,
		terminals,
		outlets,
		kitList,
	] = await Promise.all([
		all
			? data.outlets.orders().then(ofBar)
			: outlet
				? data.outlets.orders(outlet.id)
				: Promise.resolve([]),
		all
			? data.outlets.orders(undefined, { status: "CLOSED" }).then(ofBar)
			: outlet
				? data.outlets.orders(outlet.id, { status: "CLOSED" })
				: Promise.resolve([]),
		outlet ? data.outlets.menu(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.categories(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.happyHours(outlet.id) : Promise.resolve([]),
		data.bookings.buckets(),
		data.outlets.settings(),
		data.payments.terminals(),
		data.outlets.list(),
		// "All outlets": the other bars' menus, so a tab of theirs can take more drinks from here.
		Promise.all(
			others.map(async (o): Promise<[string, OutletKit]> => {
				const [m, c, h] = await Promise.all([
					data.outlets.menu(o.id),
					data.outlets.categories(o.id),
					data.outlets.happyHours(o.id),
				]);
				return [o.id, { menu: m, categories: c, happyHours: h }];
			}),
		),
	]);
	return (
		<BarTabsScreen
			outlet={outlet}
			deskOutlets={desk.outlets}
			all={all}
			kits={Object.fromEntries(kitList)}
			orders={orders}
			closedTabs={closed.filter((o) => o.kind === "TAB").length}
			menu={menu}
			categories={categories}
			happyHours={happyHours}
			inHouse={buckets.inHouse}
			settings={settings}
			terminals={terminals}
			outlets={outlets}
		/>
	);
}
