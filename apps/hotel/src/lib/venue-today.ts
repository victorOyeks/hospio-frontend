import "server-only";

import { atHotel } from "@hospio/api/api/server";
import { data } from "@hospio/api/data";
import { live } from "@hospio/api/data/live";
import { lagosDate } from "@hospio/api/data/mappers/finance";
import type { VenueLocationToday } from "@/components/venue/venue-today";

/**
 * Today at one venue location (hospio-backend docs/plan-venue-type.md phase 2): outlet sales, tills, who is clocked in, today's rota
 * and card payments by POS, all read at that location (`atHotel`), so the owner can see each venue and all of them together.
 * Nothing comes from the demo fixtures: a part that can't be read is null and its card says so.
 */
export async function venueToday(hotel: {
	id: string;
	name: string;
}): Promise<VenueLocationToday> {
	const day = lagosDate();
	return atHotel(hotel.id, async () => {
		const finance = live("finance");
		const [today, tills, onShift, shifts, terminals] = await Promise.all([
			data.venue.today().catch(() => null),
			finance ? data.finance.tills().catch(() => null) : Promise.resolve(null),
			data.venue.onShift().catch(() => null),
			finance
				? data.staff.shifts(day, day).catch(() => null)
				: Promise.resolve(null),
			data.venue.terminals(day, day).catch(() => null),
		]);
		return {
			hotelId: hotel.id,
			name: hotel.name,
			today,
			tills,
			onShift,
			rota: shifts
				? shifts.filter((s) => s.date === day && s.status !== "CANCELLED").length
				: null,
			terminals,
		};
	});
}
