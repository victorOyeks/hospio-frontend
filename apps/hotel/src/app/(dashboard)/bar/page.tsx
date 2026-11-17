import { redirect } from "next/navigation";
import { BarTodayScreen } from "@/components/roles/bar/today";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Bar · Today: the outlet picked in "Serving at" (the first bar by default):'s open board, today's closed sales, menu, happy hours, stock, sales summary and the bar's till. */
export default async function BarHome({
	searchParams,
}: {
	searchParams: Promise<{ order?: string }>;
}) {
	const { order } = await searchParams;
	// A notification link (/dashboard?order=…) lands on the tab.
	if (order) redirect(`/dashboard/tabs?open=${encodeURIComponent(order)}`);
	const { outlet, peers } = await deskOutlets("BAR");
	const [
		orders,
		closed,
		menu,
		categories,
		happyHours,
		buckets,
		items,
		settings,
		terminals,
		sales,
		till,
		outlets,
	] = await Promise.all([
		outlet ? data.outlets.orders(outlet.id) : Promise.resolve([]),
		outlet
			? data.outlets.orders(outlet.id, { status: "CLOSED" })
			: Promise.resolve([]),
		outlet ? data.outlets.menu(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.categories(outlet.id) : Promise.resolve([]),
		outlet ? data.outlets.happyHours(outlet.id) : Promise.resolve([]),
		data.bookings.buckets(),
		data.inventory.items(),
		data.outlets.settings(),
		data.payments.terminals(),
		outlet ? data.outlets.sales(undefined, outlet.id) : Promise.resolve(null),
		data.finance.myTill("BAR"),
		data.outlets.list(),
	]);
	return (
		<BarTodayScreen
			outlet={outlet}
			peers={peers}
			orders={orders}
			closed={closed}
			menu={menu}
			categories={categories}
			happyHours={happyHours}
			inHouse={buckets.inHouse}
			stock={items.filter((i) => i.storeId === outlet?.storeId)}
			settings={settings}
			terminals={terminals}
			sales={sales}
			till={till}
			outlets={outlets}
		/>
	);
}
