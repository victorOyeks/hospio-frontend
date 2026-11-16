"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { adminData } from "@hospio/api/data/admin";
import type { HotelDirectoryRow, HotelOverviewData, TicketItem } from "@hospio/api/data/admin-types";
import { data } from "@hospio/api/data";

/**
 * The admin portal's search (⌘K) and hotel panel: what they read when they open, so the pages behind them don't have to
 * load it up front.
 */

export type SearchIndex = {
	businesses: { id: string; name: string; ownerName: string; city: string; stage: string }[];
	hotels: { id: string; name: string; businessId: string; businessName: string; city: string }[];
};

/** Every business, read once when the search opens and filtered as the person types (one paged list: quick). */
export async function adminSearchBusinesses(): Promise<ActionResult<SearchIndex["businesses"]>> {
	try {
		const businesses = await data.platform.businesses();
		return {
			ok: true,
			data: businesses.map((b) => ({ id: b.id, name: b.name, ownerName: b.ownerName, city: b.city, stage: b.stage })),
		};
	} catch {
		return { ok: false, error: "Search could not load businesses" };
	}
}

/** Every hotel (a call per business, so slower): loaded beside the businesses and added when it lands. */
export async function adminSearchHotels(): Promise<ActionResult<SearchIndex["hotels"]>> {
	try {
		const hotels = await adminData.hotels.directory();
		return {
			ok: true,
			data: hotels.map((h) => ({ id: h.id, name: h.name, businessId: h.businessId, businessName: h.businessName, city: h.city })),
		};
	} catch {
		return { ok: false, error: "Search could not load hotels" };
	}
}

/** Tickets whose subject or business match (the support service searches them). */
export async function adminSearchTickets(q: string): Promise<ActionResult<TicketItem[]>> {
	try {
		const page = await adminData.support.tickets({ q, size: 6 });
		return { ok: true, data: page.content };
	} catch {
		return { ok: false, error: "Tickets could not be searched" };
	}
}

/** Today's figures for one hotel (the hotel panel's Overview tab). */
export async function loadHotelOverview(businessId: string, hotelId: string): Promise<ActionResult<HotelOverviewData | null>> {
	try {
		return { ok: true, data: await adminData.hotelOverview(businessId, hotelId) };
	} catch {
		return { ok: false, error: "Today's figures could not be loaded" };
	}
}

/** The Hotels and POS lists' fee columns, filled in after the list shows (one fee-collection call per hotel). */
export async function loadHotelFees(rows: HotelDirectoryRow[]): Promise<ActionResult<HotelDirectoryRow[]>> {
	try {
		return { ok: true, data: await adminData.hotels.withFees(rows) };
	} catch {
		return { ok: false, error: "POS keys and fee states could not be loaded" };
	}
}
