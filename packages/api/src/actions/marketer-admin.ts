"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { MarketerAgreement } from "@hospio/api/api/routes-admin";
import { withSession } from "@hospio/api/api/server";
import {
	adminData,
	toAgreementRow,
	toMarketerProfileRow,
	toStatementDetail,
} from "@hospio/api/data/admin";
import type {
	BusinessMarketerData,
	MarketerChangeResult,
	MarketerProfileRow,
	MarketerStatementDetail,
	StatementRunResult,
} from "@hospio/api/data/admin-types";
import { env } from "@hospio/api/env";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * The admin portal's marketer money and "Referred by" (platform-service, docs/plan-marketers.md): monthly statements
 * (make, approve, record the payment, export), finance's bank check, and who referred a business. Money calls are for
 * Super admin and Finance admin; the server refuses anyone else.
 */

function revalidateMarketers(businessId?: string) {
	revalidatePath("/admin/marketers");
	if (businessId) revalidatePath(`/admin/businesses/${businessId}`, "layout");
}

/** GET /platform/admin/marketer-statements/{id}: totals, lines per business, clawbacks and statements carried in. */
export async function loadMarketerStatement(
	id: string,
): Promise<ActionResult<MarketerStatementDetail>> {
	const d = await adminData.marketers.statement(id);
	return d
		? { ok: true, data: d }
		: { ok: false, error: "That statement didn't load" };
}

/** POST /platform/admin/marketer-statements/run?month=yyyy-MM (Super admin): make a month's statements now. */
export async function runMarketerStatements(
	month: string,
): Promise<ActionResult<StatementRunResult>> {
	if (!live("platform")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				month,
				made: 2,
				carriedOver: 1,
				skipped: 0,
				notes: [],
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/marketer-statements/run",
		{ ...(await withSession()), query: { month } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statements could not be made"),
		};
	revalidateMarketers();
	return { ok: true, data: { ...data.data, notes: data.data.notes ?? [] } };
}

/** POST /platform/admin/marketer-statements/{id}/approve: `answer` is required when the marketer queried it. */
export async function approveMarketerStatement(
	id: string,
	answer?: string,
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
					status: "APPROVED",
					queryAnswer: answer || fallback.statement.queryAnswer,
					approvedAt: new Date().toISOString(),
					approvedByName: "You",
					canQuery: false,
				},
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/marketer-statements/:id/approve",
		{
			...(await withSession()),
			params: { id },
			body: { answer: answer?.trim() || null },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The statement could not be approved"),
		};
	revalidateMarketers();
	return { ok: true, data: toStatementDetail(data.data) };
}

/** POST /platform/admin/marketer-statements/{id}/payment: the bank transfer (amount = payable); the marketer is emailed. */
export async function recordMarketerStatementPayment(
	id: string,
	input: { reference: string; paidOn: string; amount: number },
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
					status: "PAID",
					paidAmount: input.amount,
					paidReference: input.reference,
					paidOn: input.paidOn,
					paidRecordedName: "You",
				},
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/marketer-statements/:id/payment",
		{ ...(await withSession()), params: { id }, body: input },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The payment could not be recorded"),
		};
	revalidateMarketers();
	return { ok: true, data: toStatementDetail(data.data) };
}

/**
 * GET /platform/admin/marketer-statements/export?month=&status= as CSV. Fetched here with the session's token (the browser
 * has none) and handed back as text for the screen to save.
 */
export async function exportMarketerStatements(query: {
	month?: string;
	status?: string;
}): Promise<ActionResult<{ name: string; text: string }>> {
	const name = `marketer-statements${query.month ? `-${query.month}` : ""}.csv`;
	if (!live("platform")) {
		await demoDelay(300);
		const list = await adminData.marketers.statements(query);
		const rows = list.data.statements.map((s) =>
			[s.month, s.marketerName, s.status, s.gross, s.wht, s.net, s.payable]
				.map((v) => `"${String(v).replace(/"/g, '""')}"`)
				.join(","),
		);
		return {
			ok: true,
			data: {
				name,
				text: ["month,marketer,status,gross,wht,net,payable", ...rows].join(
					"\n",
				),
			},
		};
	}
	const session = await withSession();
	const params = new URLSearchParams();
	if (query.month) params.set("month", query.month);
	if (query.status) params.set("status", query.status);
	const qs = params.toString();
	const res = await fetch(
		`${env.NEXT_PUBLIC_API_URL}/platform/admin/marketer-statements/export${qs ? `?${qs}` : ""}`,
		{
			headers: {
				Accept: "text/csv",
				...(session.auth
					? { Authorization: `Bearer ${session.auth.token}` }
					: {}),
			},
			cache: "no-store",
		},
	).catch(() => null);
	if (!res) return { ok: false, error: "Can't reach the server" };
	const text = await res.text();
	if (!res.ok) {
		let message = "The export could not be made";
		try {
			const body = JSON.parse(text) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			// not JSON: keep the general sentence
		}
		return { ok: false, error: message };
	}
	const disposition = res.headers.get("Content-Disposition") ?? "";
	const named = /filename="?([^";]+)"?/.exec(disposition)?.[1];
	return { ok: true, data: { name: named ?? name, text } };
}

/** POST /platform/admin/marketers/{id}/bank-checked (money roles): needed before their statements can be approved. */
export async function markMarketerBankChecked(
	id: string,
	fallback?: MarketerProfileRow,
): Promise<ActionResult<MarketerProfileRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		if (!fallback) return { ok: false, error: "Marketer not found" };
		return {
			ok: true,
			data: {
				...fallback,
				bankCheckedAt: new Date().toISOString(),
				bankCheckedByName: "You",
				bankChecked: true,
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/marketers/:id/bank-checked",
		{ ...(await withSession()), params: { id } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The bank details could not be marked checked"),
		};
	revalidateMarketers();
	return {
		ok: true,
		data: toMarketerProfileRow(data.data, { ...fallback, bankChecked: null }),
	};
}

const agreementsOf = (xs: MarketerAgreement[] | null | undefined) =>
	(xs ?? []).map(toAgreementRow);

/** GET /platform/admin/businesses/{id}/marketer: who referred the business (name, code) and its agreements. */
export async function loadBusinessMarketer(
	businessId: string,
): Promise<ActionResult<BusinessMarketerData>> {
	if (!live("platform")) {
		await demoDelay(200);
		return { ok: true, data: { businessId, agreements: [] } };
	}
	const { data, error } = await api(
		"@get/platform/admin/businesses/:businessId/marketer",
		{ ...(await withSession()), params: { businessId } },
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Who referred the business didn't load"),
		};
	const d = data.data;
	return {
		ok: true,
		data: {
			businessId: d.businessId,
			profileId: d.profileId ?? undefined,
			fullName: d.fullName ?? undefined,
			referralCode: d.referralCode ?? undefined,
			status: d.status ?? undefined,
			agreements: agreementsOf(d.agreements),
		},
	};
}

/**
 * PUT /platform/admin/businesses/{id}/marketer: set or change who referred the business (`profileId` null = nobody) with a
 * reason (5+ characters). Ends the old marketer's agreement and opens the new one today when the business is live.
 */
export async function changeBusinessMarketer(
	businessId: string,
	profileId: string | null,
	reason: string,
): Promise<ActionResult<MarketerChangeResult>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: { businessId, toProfileId: profileId ?? undefined, ended: [] },
		};
	}
	const { data, error } = await api(
		"@put/platform/admin/businesses/:businessId/marketer",
		{
			...(await withSession()),
			params: { businessId },
			body: { profileId, reason: reason.trim() },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Referred by could not be changed"),
		};
	revalidateMarketers(businessId);
	revalidatePath(`/admin/onboarding/${businessId}`);
	const d = data.data;
	return {
		ok: true,
		data: {
			businessId: d.businessId,
			fromProfileId: d.fromProfileId ?? undefined,
			fromName: d.fromName ?? undefined,
			toProfileId: d.toProfileId ?? undefined,
			toName: d.toName ?? undefined,
			ended: agreementsOf(d.ended),
			opened: d.opened ? toAgreementRow(d.opened) : undefined,
		},
	};
}

/** The marketer profiles a business can be credited to (any status but ENDED), for the "Referred by" pickers. */
export async function loadReferrerOptions(): Promise<
	ActionResult<MarketerProfileRow[]>
> {
	const rows = await adminData.marketers.list();
	return { ok: true, data: rows.filter((m) => m.status !== "ENDED") };
}
