import { BarTabsScreen } from "@/components/roles/bar/tabs";
import { OutletSwitch } from "@/components/roles/shared-staff/outlet-switch";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function BarTabsPage() {
	const outlet = await data.outlets.forRole("BAR");
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
	] = await Promise.all([
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
		<>
			<OutletSwitch
				desk="BAR"
				outlets={await data.outlets.forRoleAll("BAR")}
				current={outlet?.id}
			/>
			<BarTabsScreen
				outlet={outlet}
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
		</>
	);
}
