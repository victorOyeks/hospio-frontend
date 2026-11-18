"use server";

import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	BillItem,
	SaleRequestItem,
	StaffOutletAssignment,
	TipsReport,
} from "@hospio/api/api/routes-bill";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { revalidateOps } from "./ops-helpers";

/**
 * A sale's bill (hospio-backend docs/plan-venue-type.md, phase 4): read it, split it (equally, by item, by amount) and undo the
 * split, put one part on a room, give a discount or a complimentary item, ask a manager for a void or a bigger discount, and let a
 * manager decide on this screen with their own PIN. Payments for a part go through `recordPayment` with `partId`.
 */

export type Bill = z.infer<typeof BillItem>;
export type BillPartView = Bill["split"] extends infer S ? (S extends { parts: (infer P)[] } ? P : never) : never;
export type SaleRequestView = z.infer<typeof SaleRequestItem>;
export type StaffOutlets = z.infer<typeof StaffOutletAssignment>;
export type TipsReportView = z.infer<typeof TipsReport>;
/** What a discount or void call did: `request` is set when it went to a manager instead of happening now. */
export type BillOutcomeView = { bill: Bill; request: SaleRequestView | null; message: string };

const off = { ok: false as const, error: "Not available in the demo" };
const fnbLive = () => live("fnb");

export async function readBill(orderId: string): Promise<ActionResult<Bill>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@get/fnb/orders/:id/bill", {
		...(await withSession()),
		params: { id: orderId },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The bill could not be read") };
	return { ok: true, data: data.data };
}

export type SplitInput =
	| { mode: "EQUAL"; people: number }
	| { mode: "AMOUNT"; amounts: number[] }
	| { mode: "ITEM"; parts: { label?: string; lines: { lineId: string; shares?: number }[] }[] };

export async function splitBill(orderId: string, input: SplitInput): Promise<ActionResult<Bill>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@post/fnb/orders/:id/split", {
		...(await withSession()),
		params: { id: orderId },
		body: input,
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The bill could not be split") };
	revalidateOps();
	return { ok: true, data: data.data };
}

export async function undoSplit(orderId: string): Promise<ActionResult<Bill>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@delete/fnb/orders/:id/split", {
		...(await withSession()),
		params: { id: orderId },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The split could not be undone") };
	revalidateOps();
	return { ok: true, data: data.data };
}

export async function chargePartToRoom(orderId: string, partId: string, roomId: string): Promise<ActionResult<Bill>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@post/fnb/orders/:id/parts/:partId/charge-to-room", {
		...(await withSession()),
		params: { id: orderId, partId },
		query: { roomId },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "That part could not be charged to the room") };
	revalidateOps();
	return { ok: true, data: data.data };
}

export type DiscountInput = {
	lineId?: string;
	pct?: number;
	amount?: number;
	complimentary?: boolean;
	reason: string;
};

export async function giveDiscount(orderId: string, input: DiscountInput): Promise<ActionResult<BillOutcomeView>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@post/fnb/orders/:id/discount", {
		...(await withSession()),
		params: { id: orderId },
		body: {
			lineId: input.lineId ?? null,
			pct: input.pct ?? null,
			amount: input.amount ?? null,
			complimentary: input.complimentary ?? null,
			reason: input.reason,
		},
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The discount could not be given") };
	revalidateOps();
	return {
		ok: true,
		data: { bill: data.data.bill, request: data.data.request ?? null, message: data.data.message ?? data.message ?? "Done" },
	};
}

export async function removeDiscount(orderId: string, lineId?: string): Promise<ActionResult<Bill>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@delete/fnb/orders/:id/discount", {
		...(await withSession()),
		params: { id: orderId },
		query: lineId ? { lineId } : {},
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The discount could not be removed") };
	revalidateOps();
	return { ok: true, data: data.data };
}

/** Ask a manager to void an item already sent (`lineId`) or the whole sale. */
export async function requestVoid(orderId: string, reason: string, lineId?: string): Promise<ActionResult<BillOutcomeView>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@post/fnb/orders/:id/void-request", {
		...(await withSession()),
		params: { id: orderId },
		body: { lineId: lineId ?? null, reason },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The request could not be sent") };
	revalidateOps();
	return {
		ok: true,
		data: { bill: data.data.bill, request: data.data.request ?? null, message: data.data.message ?? "Sent to a manager for approval" },
	};
}

/** Requests waiting at this location (a manager's: everyone's; anyone else's: their own). `all` adds the decided ones. */
export async function saleRequests(opts: { all?: boolean; mine?: boolean } = {}): Promise<SaleRequestView[]> {
	if (!fnbLive()) return [];
	const { data } = await api("@get/fnb/sale-requests", {
		...(await withSession()),
		query: { ...(opts.all ? { status: "ALL" } : {}), ...(opts.mine ? { mine: true } : {}) },
	}).catch(() => ({ data: null }));
	return data?.data ?? [];
}

/**
 * A manager decides on this screen: they are picked by name and type their own PIN (the owner, who has no PIN, their password).
 * platform-service checks it with identity-service and records the decision in the manager's name.
 */
export async function decideOnDevice(input: {
	approvalId: string;
	approver: string;
	secret: string;
	decision: "APPROVED" | "DECLINED";
	note?: string;
}): Promise<ActionResult<{ status: string }>> {
	if (!live("platform")) return off;
	const { data, error } = await api("@post/platform/approvals/:id/decide-on-device", {
		...(await withSession()),
		params: { id: input.approvalId },
		body: { approver: input.approver, secret: input.secret, decision: input.decision, note: input.note?.trim() || null },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The decision could not be saved") };
	revalidateOps();
	return { ok: true, data: { status: data.data.status } };
}

/** The managers and owner who can approve at the active location, for the "approve here" picker (names only). */
export async function approversHere(): Promise<{ id: string; name: string; owner: boolean }[]> {
	if (!live("identity")) return [];
	const { data } = await api("@get/identity/users/colleagues", await withSession()).catch(() => ({ data: null }));
	const out: { id: string; name: string; owner: boolean }[] = [];
	for (const u of data?.data ?? []) {
		const roles = (u.grants ?? []).filter((g) => !g.paused).map((g) => g.role);
		if (roles.includes("OWNER")) out.push({ id: u.id, name: u.fullName, owner: true });
		else if (roles.includes("MANAGER")) out.push({ id: u.id, name: u.fullName, owner: false });
	}
	return out;
}

/** The location's reasons for a discount and for a void (Hotel setup → Reasons & lists); empty when they can't be read. */
export async function saleReasons(): Promise<{ discount: string[]; void: string[] }> {
	if (!live("hotel-config")) return { discount: [], void: [] };
	const s = await withSession();
	const read = (listName: string) =>
		api("@get/hotel-config/setup/lists/:listName", { ...s, params: { listName }, query: { activeOnly: true } })
			.then((r) => (r.data?.data ?? []).map((i) => i.label).filter((x): x is string => !!x))
			.catch(() => [] as string[]);
	const [discount, voids] = await Promise.all([read("DISCOUNT_REASONS"), read("VOID_REASONS")]);
	return { discount, void: voids };
}

// ---- the outlets a person works -----------------------------------------------------------------------

/** The signed-in person's outlets: `restricted` false means every outlet of the location. */
export async function myOutlets(): Promise<StaffOutlets> {
	const all: StaffOutlets = { userId: null, restricted: false, outletIds: [] };
	if (!fnbLive()) return all;
	const { data } = await api("@get/fnb/staff-outlets/mine", await withSession()).catch(() => ({ data: null }));
	return data?.data ?? all;
}

/** Everyone at the location kept to a list of outlets: user id → outlet ids. A person not in it works every outlet. */
export async function staffOutletsMap(hotelId?: string): Promise<Record<string, string[]>> {
	if (!fnbLive()) return {};
	const { data } = await api("@get/fnb/staff-outlets", await withSession(hotelId ? { hotelId } : undefined)).catch(() => ({
		data: null,
	}));
	return data?.data ?? {};
}

/** Keep a person to these outlets; an empty list (or every outlet) means every outlet again. */
export async function setStaffOutlets(userId: string, outletIds: string[], hotelId?: string): Promise<ActionResult<StaffOutlets>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@put/fnb/staff-outlets/:userId", {
		...(await withSession(hotelId ? { hotelId } : undefined)),
		params: { userId },
		body: { outletIds },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The outlets could not be saved") };
	revalidateOps();
	return { ok: true, data: data.data };
}

// ---- tips ---------------------------------------------------------------------------------------------

export async function tipsReport(from: string, to: string, staffId?: string): Promise<ActionResult<TipsReportView>> {
	if (!fnbLive()) return off;
	const { data, error } = await api("@get/fnb/tips/report", {
		...(await withSession()),
		query: { from, to, ...(staffId ? { staffId } : {}) },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The tips report could not be read") };
	return { ok: true, data: data.data };
}
