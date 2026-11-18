import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";
import { getActiveHotel } from "@hospio/api/dal";
import { hasAccommodation } from "@hospio/api/venue";

export const dynamic = "force-dynamic";

/**
 * Cashier · Sales: every sale of the location's outlets over the days chosen, with the unpaid ones to collect.
 */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const [filters, desk] = await Promise.all([
		salesFilters(searchParams, "CASHIER"),
		deskOutlets("CASHIER"),
	]);
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
			title="Sales"
			subtitle={`Every sale at ${desk.outlets.length > 1 ? "the outlets" : (desk.outlet?.name ?? "the outlet")} · open one to see it${rooms ? ", collect it or charge it to a room" : " or collect it"}`}
			payDesk={"CASHIER"}
			terminals={terminals}
			inHouse={rooms ? buckets.inHouse : []}
		/>
	);
}
