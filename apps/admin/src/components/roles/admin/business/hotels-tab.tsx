"use client";

import { parseAsString, useQueryState } from "nuqs";
import type { BusinessRow, HotelSummary } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { HotelDrawer, type HotelRef } from "../hotels/drawer";
import { roomsOrKind } from "../onboarding/shared";

/**
 * Business · Hotels: a row opens the same hotel panel as Customers → Hotels (`?hotel=`), so the hotel's figures, POS keys,
 * Hospio fees and guest messages open here without leaving the business.
 */
export function HotelsTab({
	business,
	hotels,
	role,
}: {
	business: BusinessRow;
	hotels: HotelSummary[];
	role: AdminRole;
}) {
	const [, setHotel] = useQueryState(
		"hotel",
		parseAsString.withOptions({ history: "push", scroll: false }),
	);
	const refs: HotelRef[] = hotels.map((h) => ({
		id: h.id,
		name: h.name,
		businessId: business.id,
		businessName: business.name,
		stage: business.stage,
		city: h.city,
		address: h.address,
		rooms: h.rooms,
		timezone: h.timezone,
		manager: h.manager,
	}));
	return (
		<>
			<DataTable
				data={hotels}
				onRowClick={(h) => void setHotel(h.id)}
				columns={[
					{
						accessorKey: "name",
						header: "Hotel",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={
									[row.original.city, row.original.address]
										.filter(Boolean)
										.join(" · ") || "—"
								}
							/>
						),
					},
					{
						accessorKey: "rooms",
						header: "Rooms",
						// A lounge, bar or restaurant shows its kind, not "0" (hospio-backend docs/plan-venue-type.md).
						cell: ({ row }) => roomsOrKind(row.original),
					},
					{ accessorKey: "manager", header: "Manager" },
					{ accessorKey: "timezone", header: "Time zone" },
					{
						accessorKey: "occupancy",
						header: "Occupancy tonight",
						cell: ({ row }) => (
							<span>
								{row.original.occupancy ? `${row.original.occupancy}%` : "—"}
							</span>
						),
					},
					{
						id: "open",
						header: "",
						cell: () => (
							<span className="text-[13px] font-semibold text-brand">
								Open →
							</span>
						),
					},
				]}
				emptyTitle="No locations yet"
				emptyHint="Locations are added during onboarding. Continue onboarding from the button at the top."
			/>
			<HotelDrawer hotels={refs} role={role} />
		</>
	);
}
