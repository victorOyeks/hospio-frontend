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

/** Bar · Sales: every sale of the bar over the days chosen, with the unpaid ones to collect. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const [filters, desk] = await Promise.all([
		salesFilters(searchParams, "BAR"),
		deskOutlets("BAR"),
	]);
	const several = desk.outlets.length > 1;
	// Several outlets: the one picked in "Serving at", unless a manager or lead looks at them all.
	if (several && !desk.all && desk.outlet) filters.outletId = desk.outlet.id;
	const where = desk.all ? "All outlets" : (desk.outlet?.name ?? "Bar");
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
	// No rooms at a lounge, bar or restaurant (hospio-backend docs/plan-venue-type.md).
	const rooms = hasAccommodation(await getActiveHotel());
	return (
		<SalesScreen
			result={result}
			filters={filters}
			management={false}
			title={`${where} · sales`}
			outletView={
				several
					? {
							peers: desk.peers,
							kind: "BAR",
							all: desk.all,
							current: desk.outlet
								? { id: desk.outlet.id, name: desk.outlet.name }
								: undefined,
						}
					: undefined
			}
			subtitle={`${several && !desk.all ? `Every ${where} sale` : "Every bar sale"} · open one to see it${rooms ? ", collect it or charge it to a room" : " or collect it"}`}
			payDesk={"BAR"}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
