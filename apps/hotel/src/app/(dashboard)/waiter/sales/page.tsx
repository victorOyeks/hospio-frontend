import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { data } from "@hospio/api/data";
import { getActiveHotel } from "@hospio/api/dal";
import { hasAccommodation } from "@hospio/api/venue";

export const dynamic = "force-dynamic";

/**
 * Waiter · My sales: the sales this waiter opened over the days chosen (fnb-service never widens a waiter past their own).
 */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const filters = await salesFilters(searchParams, "WAITER");
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	const rooms = hasAccommodation(await getActiveHotel());
	return (
		<SalesScreen
			result={result}
			filters={filters}
			management={false}
			title="My sales"
			subtitle={`Every tab and sale you opened · open one to see it${rooms ? ", collect it or charge it to a room" : " or collect it"}`}
			payDesk={"WAITER"}
			terminals={terminals}
			inHouse={rooms ? buckets.inHouse : []}
		/>
	);
}
