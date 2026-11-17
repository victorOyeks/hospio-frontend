import { SalesScreen } from "@/components/roles/shared-staff/sales-screen";
import {
	type SalesSearchParams,
	salesFilters,
} from "@/components/roles/shared-staff/sales-params";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Kitchen · Sales: every sale of the kitchen and restaurant over the days chosen, with the unpaid ones to collect. */
export default async function SalesPage({
	searchParams,
}: {
	searchParams: SalesSearchParams;
}) {
	const [filters, desk] = await Promise.all([
		salesFilters(searchParams, "KITCHEN"),
		deskOutlets("KITCHEN"),
	]);
	const several = desk.outlets.length > 1;
	// Several outlets: the one picked in "Serving at", unless a manager or lead looks at them all.
	if (several && !desk.all && desk.outlet) filters.outletId = desk.outlet.id;
	const where = desk.all ? "All outlets" : (desk.outlet?.name ?? "Kitchen");
	const [result, buckets, terminals] = await Promise.all([
		data.outlets.salesHistory(filters),
		data.bookings.buckets(),
		data.payments.terminals(),
	]);
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
							kind: "KITCHEN",
							all: desk.all,
							current: desk.outlet
								? { id: desk.outlet.id, name: desk.outlet.name }
								: undefined,
						}
					: undefined
			}
			subtitle={`${several && !desk.all ? `Every ${where} sale` : "Every kitchen and restaurant sale"} · open one to see it, collect it or charge it to a room`}
			payDesk={"KITCHEN"}
			terminals={terminals}
			inHouse={buckets.inHouse}
		/>
	);
}
