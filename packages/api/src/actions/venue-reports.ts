import "server-only";

import { atHotel } from "@hospio/api/api/server";
import { data } from "@hospio/api/data";
import type { VenueReport } from "@hospio/api/data/venue";

/**
 * The outlet reports for lounges, bars and restaurants (hospio-backend docs/plan-venue-type.md phase 2), also offered to hotels for
 * their restaurant and bar: built from fnb-service `/sales/report` per location, with card payments by POS (payment-service) and stock
 * drawn by sales (inventory-service). Money is in naira, plain numbers, so a spreadsheet adds it up. Real data only.
 */

export const VENUE_REPORT_KINDS = [
	"SALES_BY_OUTLET",
	"SALES_BY_ITEM",
	"SALES_BY_CATEGORY",
	"SALES_BY_STAFF",
	"SALES_BY_HOUR",
	"PAYMENTS_BY_METHOD",
	"VOIDS_DISCOUNTS",
	"STOCK_USE",
] as const;
export type VenueReportKind = (typeof VENUE_REPORT_KINDS)[number];

export const isVenueReport = (k: string): k is VenueReportKind =>
	(VENUE_REPORT_KINDS as readonly string[]).includes(k);

type Built = { columns: string[]; rows: (string | number)[][]; note?: string };
type Hotel = { id: string; name: string };

const METHOD: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card",
	TRANSFER: "Transfer",
	ROOM: "On rooms",
};

const when = (iso?: string | null) =>
	iso
		? new Date(iso).toLocaleString("en-GB", {
				timeZone: "Africa/Lagos",
				dateStyle: "medium",
				timeStyle: "short",
			})
		: "";
const hour = (h: number) => `${String(h).padStart(2, "0")}:00-${String((h + 1) % 24).padStart(2, "0")}:00`;
const round = (n: number) => Math.round(n * 1000) / 1000;

/** One location's report, or the reason it couldn't be read. */
async function reportAt(h: Hotel, from: string, to: string) {
	return atHotel(h.id, () => data.venue.report(from, to));
}

export async function buildVenueReport(
	kind: VenueReportKind,
	from: string,
	to: string,
	hotels: Hotel[],
): Promise<{ ok: true; data: Built } | { ok: false; error: string }> {
	const all = await Promise.all(
		hotels.map(async (h) => ({ hotel: h, r: await reportAt(h, from, to) })),
	);
	const failedAt = all.find((x) => !x.r.ok);
	if (failedAt && !failedAt.r.ok)
		return {
			ok: false,
			error: `${failedAt.hotel.name}: ${failedAt.r.error}`,
		};
	const reps = all.map((x) => ({
		hotel: x.hotel,
		r: (x.r as { ok: true; data: VenueReport }).data,
	}));

	switch (kind) {
		case "SALES_BY_OUTLET": {
			const rows = reps.flatMap(({ hotel, r }) =>
				r.byOutlet
					.filter((o) => o.sales > 0 || o.cancelled > 0)
					.map((o) => [
						hotel.name,
						o.name ?? "Outlet",
						o.sales,
						o.sold,
						o.paid,
						o.unpaid,
						o.onRooms,
						o.cancelled,
					]),
			);
			return {
				ok: true,
				data: {
					columns: [
						"Location",
						"Outlet",
						"Sales",
						"Sold (NGN)",
						"Paid (NGN)",
						"Still to pay (NGN)",
						"On rooms (NGN)",
						"Cancelled",
					],
					rows,
					note: "Sales are counted on the day they were opened; open tabs count once settled. Sold includes tax and service charge.",
				},
			};
		}
		case "SALES_BY_ITEM": {
			const rows = reps.flatMap(({ hotel, r }) =>
				r.byItem.map((i) => [
					hotel.name,
					i.outletName ?? "",
					i.category,
					i.name,
					i.quantity,
					i.revenue,
				]),
			);
			return {
				ok: true,
				data: {
					columns: ["Location", "Outlet", "Category", "Item", "Quantity", "Revenue (NGN)"],
					rows,
					note: "Revenue is the menu price times the quantity less discounts, before service charge. Cancelled items are left out (see Voids & discounts).",
				},
			};
		}
		case "SALES_BY_CATEGORY": {
			const rows = reps.flatMap(({ hotel, r }) =>
				r.byCategory.map((c) => [hotel.name, c.category, c.items, c.quantity, c.revenue]),
			);
			return {
				ok: true,
				data: {
					columns: ["Location", "Category", "Items sold", "Quantity", "Revenue (NGN)"],
					rows,
					note: "The menu category of each item; items without one are under Other.",
				},
			};
		}
		case "SALES_BY_STAFF": {
			const rows = reps.flatMap(({ hotel, r }) =>
				r.byStaff.map((s) => [
					hotel.name,
					s.name,
					s.sales,
					s.sold,
					s.paid,
					s.cancelled,
					s.voids,
					s.voidAmount,
				]),
			);
			return {
				ok: true,
				data: {
					columns: [
						"Location",
						"Staff",
						"Sales opened",
						"Sold (NGN)",
						"Paid (NGN)",
						"Their sales cancelled",
						"Voids they made",
						"Voided (NGN)",
					],
					rows,
					note: "Sales by who opened them; voids by who cancelled the sale or the item.",
				},
			};
		}
		case "SALES_BY_HOUR": {
			const rows = reps.flatMap(({ hotel, r }) =>
				r.byHour
					.filter((h) => h.sales > 0)
					.map((h) => [hotel.name, hour(h.hour), h.sales, h.sold]),
			);
			return {
				ok: true,
				data: {
					columns: ["Location", "Hour (Lagos)", "Sales", "Sold (NGN)"],
					rows,
					note: "When each sale was opened, over every day of the period. Hours without sales are left out.",
				},
			};
		}
		case "PAYMENTS_BY_METHOD": {
			const terminals = await Promise.all(
				reps.map(({ hotel }) => atHotel(hotel.id, () => data.venue.terminals(from, to))),
			);
			const notes: string[] = [];
			const rows = reps.flatMap(({ hotel, r }, n) => {
				const out: (string | number)[][] = [];
				for (const m of r.byMethod) {
					const pos = terminals[n]?.filter((t) => t.method === "CARD") ?? null;
					if (m.method === "CARD" && pos && pos.length > 0) {
						for (const t of pos)
							out.push([hotel.name, "Card", t.terminal ?? "No POS recorded", t.count, t.amount]);
						const posSum = pos.reduce((s, t) => s + t.amount, 0);
						if (Math.abs(posSum - m.amount) >= 0.01)
							notes.push(
								`${hotel.name}: card payments by POS add up to ₦${posSum.toLocaleString("en-NG")} and the outlets recorded ₦${m.amount.toLocaleString("en-NG")} (a payment approved just before or after midnight lands on different days).`,
							);
					} else {
						out.push([
							hotel.name,
							METHOD[m.method] ?? m.method,
							m.method === "CARD" ? "POS not known" : "",
							m.method === "ROOM" ? "" : m.count,
							m.amount,
						]);
					}
				}
				return out;
			});
			return {
				ok: true,
				data: {
					columns: ["Location", "Method", "POS terminal", "Payments", "Amount (NGN)"],
					rows,
					note: [
						"Money taken at the outlets in the period, by when it was taken. Tips are not recorded in Hospio360, so there is no tips column.",
						...notes,
					].join(" "),
				},
			};
		}
		case "VOIDS_DISCOUNTS": {
			const rows = reps.flatMap(({ hotel, r }) => [
				...r.voids.map((v) => [
					hotel.name,
					v.kind === "ORDER" ? "Sale cancelled" : "Item voided",
					when(v.at),
					v.number,
					v.outletName ?? "",
					v.item ?? "",
					v.quantity,
					v.amount,
					v.by ?? "Not recorded",
					v.reason ?? "",
				]),
				...r.discounts.map((d) => [
					hotel.name,
					d.complimentary ? "Complimentary" : "Discount",
					when(d.at),
					d.number,
					d.outletName ?? "",
					"",
					"",
					d.complimentary ? d.total : d.discount,
					d.openedBy ?? "Not recorded",
					"",
				]),
			]);
			const cut = reps.some(({ r }) => r.voidsTruncated || r.discountsTruncated);
			return {
				ok: true,
				data: {
					columns: [
						"Location",
						"What",
						"When",
						"Sale",
						"Outlet",
						"Item",
						"Quantity",
						"Amount (NGN)",
						"By",
						"Reason",
					],
					rows,
					note: `A cancelled sale's amount is what was on it; a voided item's is its price times the quantity. Discounts list who opened the sale.${cut ? " Only the latest 500 of each are listed: pick a shorter period for all of them." : ""}`,
				},
			};
		}
		case "STOCK_USE": {
			const extra = await Promise.all(
				reps.map(({ hotel }) =>
					atHotel(hotel.id, async () => ({
						usage: await data.venue.stockUsage(from, to),
						// Names of items the sales called for but that never moved; the stock list is read once per request, so only for one location.
						items: reps.length === 1 ? await data.inventory.items().catch(() => []) : [],
					})),
				),
			);
			let noRecipe = 0;
			let withRecipe = 0;
			const rows = reps.flatMap(({ hotel, r }, n) => {
				noRecipe += r.itemsWithoutRecipe;
				withRecipe += r.itemsWithRecipe;
				const usage = new Map((extra[n].usage?.items ?? []).map((u) => [u.itemId, u]));
				const names = new Map(extra[n].items.map((i) => [i.id, i]));
				const ids = new Set([...r.stockUse.map((s) => s.stockItemId), ...usage.keys()]);
				const called = new Map(r.stockUse.map((s) => [s.stockItemId, s.quantity]));
				return [...ids]
					.map((id) => {
						const u = usage.get(id);
						const it = names.get(id);
						const expected = called.get(id) ?? 0;
						const drawn = u?.soldUse ?? 0;
						return [
							hotel.name,
							u?.name ?? it?.name ?? "Removed item",
							u?.unit ?? it?.unit ?? "",
							round(expected),
							round(drawn),
							round(drawn - expected),
							round(u?.otherUse ?? 0),
							round(u?.waste ?? 0),
							round(u?.countDifference ?? 0),
						];
					})
					.sort((a, b) => String(a[1]).localeCompare(String(b[1])));
			});
			return {
				ok: true,
				data: {
					columns: [
						"Location",
						"Stock item",
						"Unit",
						"Sold (by recipes)",
						"Drawn by sales",
						"Drawn less sold",
						"Used by hand",
						"Wasted",
						"Count difference",
					],
					rows,
					note: `Sold (by recipes) is what each item's recipe calls for times the quantity sold; Drawn by sales is what the store gave out when the sales settled (less when the store ran short; open tabs draw once settled). ${withRecipe} item(s) sold have a recipe, ${noRecipe} do not and draw no stock. A negative count difference is stock found short at a count.`,
				},
			};
		}
	}
}
