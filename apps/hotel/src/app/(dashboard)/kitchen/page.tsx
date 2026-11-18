import { KitchenOrdersScreen } from "@/components/roles/kitchen/orders";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { getActiveHotel } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { hasAccommodation } from "@hospio/api/venue";

export const dynamic = "force-dynamic";

/** Kitchen · Orders: the board of the outlet picked in "Serving at" (the first KITCHEN or RESTAURANT one by default), its menu, tables and the settings that rule room charging. */
export default async function KitchenHome() {
	const { outlet, peers } = await deskOutlets("KITCHEN");
	const [
		orders,
		closed,
		menu,
		categories,
		buckets,
		settings,
		terminals,
		outlets,
		hotel,
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
		getActiveHotel(),
	]);
	return (
		<KitchenOrdersScreen
			orders={orders}
			closed={closed}
			menu={menu}
			categories={categories}
			outlet={outlet}
			peers={peers}
			inHouse={buckets.inHouse}
			settings={settings}
			terminals={terminals}
			outlets={outlets}
			hasRooms={hasAccommodation(hotel) || buckets.inHouse.length > 0}
		/>
	);
}
