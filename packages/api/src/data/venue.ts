import "server-only";

/**
 * Venue dashboards and reports (hospio-backend docs/plan-venue-type.md phase 2): today at a lounge, bar or restaurant, the venue
 * reports over a period, card payments by POS and stock used by sales. Real data only: nothing is made up in demo mode either (the
 * seams answer null and the screens show their empty states). Each read is for the active location unless run inside `atHotel`.
 */

import { api } from "@hospio/api/api/client";
import type {
	ItemUsageData,
	TerminalTotalRow,
	VenueReportData,
	VenueTodayData,
} from "@hospio/api/api/routes-venue";
import { withSession } from "@hospio/api/api/server";
import { live } from "./live";

export type VenueToday = VenueTodayData;
export type VenueReport = VenueReportData;
export type TerminalTotal = TerminalTotalRow;
export type ItemUsage = ItemUsageData;

/** Who is on the clock now at the location (clocked in today, not yet out), from finance-service's clock. */
export type OnShiftRow = { userId: string; name: string; since: string | null };

function failed<T>(what: string, error: unknown, empty: T): T {
	console.error(`${what}:`, error);
	return empty;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const venueData = {
	/** Today at the outlets (`/fnb/sales/today`); null when it cannot be read (or in demo mode: no sample numbers). */
	today: async (staleHours?: number): Promise<VenueToday | null> => {
		if (!live("fnb")) return null;
		const { data: res, error } = await api("@get/fnb/sales/today", {
			...(await withSession()),
			query: staleHours ? { staleHours } : {},
		});
		if (error || !res) return failed("fnb-service venue today", error, null);
		return res.data;
	},
	/** The venue reports over the Lagos days from..to, every outlet or one. */
	report: async (
		from: string,
		to: string,
		outletId?: string,
	): Promise<{ ok: true; data: VenueReport } | { ok: false; error: string }> => {
		if (!DAY.test(from) || !DAY.test(to))
			return { ok: false, error: "Pick the dates of the period" };
		if (!live("fnb"))
			return { ok: false, error: "Venue reports need the live outlets" };
		const { data: res, error } = await api("@get/fnb/sales/report", {
			...(await withSession()),
			query: { from, to, ...(outletId ? { outletId } : {}) },
		});
		if (error || !res) {
			console.error("fnb-service venue report:", error);
			const message = (error as { message?: string } | null)?.message;
			return { ok: false, error: message ?? "The report could not be built" };
		}
		return { ok: true, data: res.data };
	},
	/** Approved outlet payments per method and POS terminal; null when payment-service can't be read. */
	terminals: async (
		from: string,
		to: string,
	): Promise<TerminalTotal[] | null> => {
		if (!live("payment")) return null;
		const { data: res, error } = await api("@get/payment/payments/by-terminal", {
			...(await withSession()),
			query: { from, to },
		});
		if (error || !res)
			return failed("payment-service by terminal", error, null);
		return res.data;
	},
	/** Stock drawn by sales, used by hand, wasted and counted per item; null when inventory can't be read. */
	stockUsage: async (from: string, to: string): Promise<ItemUsage | null> => {
		if (!live("inventory")) return null;
		const { data: res, error } = await api("@get/inventory/usage/items", {
			...(await withSession()),
			query: { from, to },
		});
		if (error || !res)
			return failed("inventory-service usage by item", error, null);
		return res.data;
	},
	/** Who is clocked in right now; null when the clock can't be read. */
	onShift: async (): Promise<OnShiftRow[] | null> => {
		if (!live("finance")) return null;
		const { data: res, error } = await api("@get/finance/workforce/clock", {
			...(await withSession()),
			query: {},
		});
		if (error || !res) return failed("finance-service clock", error, null);
		const seen = new Set<string>();
		const out: OnShiftRow[] = [];
		for (const e of res.data) {
			if (!e.userId || e.clockOut || seen.has(e.userId)) continue;
			seen.add(e.userId);
			out.push({
				userId: e.userId,
				name: e.userName ?? "Someone",
				since: e.clockIn ?? null,
			});
		}
		return out.sort((a, b) => (a.since ?? "").localeCompare(b.since ?? ""));
	},
};
