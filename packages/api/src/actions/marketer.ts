"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import {
	adminData,
	toMarketerProfileRow,
	toReferralItem,
	toStatementDetail,
} from "@hospio/api/data/admin";
import type {
	CommissionStatementData,
	MarketerProfileRow,
	MarketerStatementDetail,
	ReferralItem,
} from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * The marketer portal's reads and writes (`/platform/marketer/**`): the agreement, bank details, a new referral, a
 * statement and a query on it.
 */

function revalidateMarketer() {
	for (const p of [
		"/marketer",
		"/marketer/businesses",
		"/marketer/commissions",
		"/marketer/refer",
	])
		revalidatePath(p);
}

/**
 * PUT /platform/marketer/me/bank: bank, 10-digit account number and account name. `note` (why) is required by the server
 * when saved details change; every save waits for finance to check the details again.
 */
export async function saveMarketerBank(
	input: {
		bankName: string;
		bankAccount: string;
		bankAccountName: string;
		note?: string;
	},
	fallback?: MarketerProfileRow,
): Promise<ActionResult<MarketerProfileRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Profile not found" };
		return {
			ok: true,
			data: {
				...fallback,
				bankName: input.bankName,
				bankAccount: input.bankAccount,
				bankAccountName: input.bankAccountName,
				bankChangeNote: input.note,
				bankSavedAt: new Date().toISOString(),
				bankCheckedAt: undefined,
				bankCheckedByName: undefined,
				bankChecked: false,
			},
		};
	}
	const { data, error } = await api("@put/platform/marketer/me/bank", {
		...(await withSession()),
		body: { ...input, note: input.note?.trim() || null },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The bank details could not be saved"),
		};
	revalidateMarketer();
	// A save clears finance's check: read it from the saved profile, not the row on screen.
	return {
		ok: true,
		data: toMarketerProfileRow(data.data, { ...fallback, bankChecked: null }),
	};
}

export async function createReferral(input: {
	hotelName: string;
	ownerName?: string;
	phone?: string;
	email?: string;
	city?: string;
	note?: string;
}): Promise<ActionResult<ReferralItem>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: `rf-${Date.now()}`,
				hotelName: input.hotelName,
				ownerName: input.ownerName ?? "—",
				phone: input.phone ?? "",
				email: input.email,
				city: input.city ?? "",
				stage: "LEAD",
				note: input.note,
				sentAt: new Date().toISOString(),
			},
		};
	}
	const { data, error } = await api("@post/platform/marketer/referrals", {
		...(await withSession()),
		body: {
			hotelName: input.hotelName,
			ownerName: input.ownerName ?? null,
			phone: input.phone ?? null,
			email: input.email ?? null,
			city: input.city ?? null,
			note: input.note ?? null,
		},
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The referral could not be sent"),
		};
	revalidateMarketer();
	return { ok: true, data: toReferralItem(data.data) };
}

/** GET /platform/marketer/commissions/statement?month=: the month's statement as text, for the download. */
export async function loadCommissionStatement(
	month: string,
): Promise<ActionResult<CommissionStatementData>> {
	if (!live("platform")) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				month,
				marketerName: "Kunle Oshodi",
				gross: 124200,
				wht: 6210,
				net: 117990,
				text: `Hospio360 · Commission statement · ${month}\n\nMarketer: Kunle Oshodi\nGross commission: ₦124,200\nWithholding tax (5%): -₦6,210\nNet paid: ₦117,990\n\nThis is a demo statement.`,
			},
		};
	}
	const { data, error } = await api(
		"@get/platform/marketer/commissions/statement",
		{ ...(await withSession()), query: { month } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statement could not be prepared"),
		};
	const d = data.data;
	return {
		ok: true,
		data: {
			month: d.month,
			marketerName: d.marketerName ?? "",
			gross: Number(d.gross ?? 0),
			wht: Number(d.wht ?? 0),
			net: Number(d.net ?? 0),
			text: d.text,
		},
	};
}

/** POST /platform/marketer/agreement: accept the Referral Partner Agreement (the version the portal shows). */
export async function acceptMarketerAgreement(
	version: string,
	fallback?: MarketerProfileRow,
): Promise<ActionResult<MarketerProfileRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Profile not found" };
		return {
			ok: true,
			data: {
				...fallback,
				agreementVersion: version,
				agreementAcceptedAt: new Date().toISOString(),
				agreementAcceptedName: fallback.fullName,
				agreementAccepted: true,
			},
		};
	}
	const { data, error } = await api("@post/platform/marketer/agreement", {
		...(await withSession()),
		body: { version },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The agreement could not be accepted"),
		};
	revalidateMarketer();
	return {
		ok: true,
		data: toMarketerProfileRow(data.data, {
			...fallback,
			agreementAccepted: true,
		}),
	};
}

/** GET /platform/marketer/statements/{id}: one of my statements with its lines per business. */
export async function loadMyStatement(
	id: string,
): Promise<ActionResult<MarketerStatementDetail>> {
	const d = await adminData.marketer.statement(id);
	return d ? { ok: true, data: d } : { ok: false, error: "That statement didn't load" };
}

/** POST /platform/marketer/statements/{id}/query: raise a query (within 7 days of the statement being made). */
export async function queryMyStatement(
	id: string,
	note: string,
	fallback?: MarketerStatementDetail,
): Promise<ActionResult<MarketerStatementDetail>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Statement not found" };
		return {
			ok: true,
			data: {
				...fallback,
				statement: {
					...fallback.statement,
					status: "QUERIED",
					queryNote: note,
					queriedAt: new Date().toISOString(),
					canQuery: false,
				},
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/marketer/statements/:id/query",
		{ ...(await withSession()), params: { id }, body: { note } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The query could not be sent"),
		};
	revalidateMarketer();
	return { ok: true, data: toStatementDetail(data.data) };
}
