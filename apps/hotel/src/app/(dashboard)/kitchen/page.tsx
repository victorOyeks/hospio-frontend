import { KitchenOrdersScreen } from "@/components/roles/kitchen/orders";
import { OutletSwitch } from "@/components/roles/shared-staff/outlet-switch";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Kitchen · Orders: the board of the kitchen's outlet (the first KITCHEN or RESTAURANT one), its menu, tables and the settings that rule room charging. */
export default async function KitchenHome() {
	const outlet = await data.outlets.forRole("KITCHEN");
	const [
		orders,
		closed,
		menu,
		categories,
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
			data.bookings.buckets(),
			data.outlets.settings(),
			data.payments.terminals(),
			data.outlets.list(),
		]);
	return (
		<>
			<OutletSwitch
				desk="KITCHEN"
				outlets={await data.outlets.forRoleAll("KITCHEN")}
				current={outlet?.id}
			/>
			<KitchenOrdersScreen
				orders={orders}
				closed={closed}
				menu={menu}
				categories={categories}
				outlet={outlet}
				inHouse={buckets.inHouse}
				settings={settings}
				terminals={terminals}
				outlets={outlets}
			/>
		</>
	);
}
