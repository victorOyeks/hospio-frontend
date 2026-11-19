"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	OverdueInvoice,
	SuspensionCandidate,
	SuspensionNotice,
	SuspensionState,
	SuspensionStatus,
} from "@hospio/api/api/routes-suspension";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";

/**
 * Real suspension of a business (hospio-backend docs/suspension.md). The hotel app: is my business suspended (the full-page
 * screen). The admin portal: who is 30+ days overdue, the 7 days' notice, suspend and reactivate. Demo mode: nobody is suspended.
 */

export type SuspensionStatusView = z.infer<typeof SuspensionStatus>;
export type SuspensionStateView = z.infer<typeof SuspensionState>;
export type SuspensionCandidateView = z.infer<typeof SuspensionCandidate>;
export type SuspensionNoticeView = z.infer<typeof SuspensionNotice>;
export type OverdueInvoiceView = z.infer<typeof OverdueInvoice>;
export type SuspensionReasonType = "UNPAID_INVOICE" | "OTHER";

const NOT_SUSPENDED: SuspensionStatusView = { suspended: false, since: null, reasonType: null, reason: null };
const DEMO_WRITE = "Needs the live services (demo mode)";
const fail = <T>(error: unknown, fallback: string): ActionResult<T> => ({ ok: false, error: errorMessage(error, fallback) });

/**
 * GET /tenant/businesses/suspension: whether the signed-in person's business is suspended. Never fails a page: when it can't
 * be read the answer is "not suspended" (the services still refuse every call if it is).
 */
export async function mySuspension(): Promise<SuspensionStatusView> {
	if (!live("tenant")) return NOT_SUSPENDED;
	const { data, error } = await api("@get/tenant/businesses/suspension", await withSession());
	return error || !data ? NOT_SUSPENDED : data.data;
}

// ---- Hospio360 admin ---------------------------------------------------------------------------------------------

function revalidateBusiness(businessId: string) {
	for (const p of ["/admin", "/admin/businesses", `/admin/businesses/${businessId}`, "/admin/fees"]) revalidatePath(p);
}

export async function suspensionCandidates(): Promise<ActionResult<SuspensionCandidateView[]>> {
	if (!live("platform")) return { ok: true, data: [] };
	const { data, error } = await api("@get/platform/admin/suspension/candidates", await withSession());
	return error || !data ? fail(error, "Suspension candidates could not be loaded") : { ok: true, data: data.data };
}

export async function businessSuspension(businessId: string): Promise<ActionResult<SuspensionStateView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/suspension", { ...(await withSession()), params: { businessId } });
	return error || !data ? fail(error, "The suspension details could not be loaded") : { ok: true, data: data.data };
}

/** Emails the owner the 7 days' notice (bell to owners and managers) and records its date. */
export async function sendSuspensionNotice(businessId: string, suspendOn?: string | null): Promise<ActionResult<SuspensionStateView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/businesses/:businessId/suspension/notice", {
		...(await withSession()),
		params: { businessId },
		body: { suspendOn: suspendOn ?? null },
	});
	if (error || !data) return fail(error, "The notice could not be sent");
	revalidateBusiness(businessId);
	return { ok: true, data: data.data };
}

export async function suspendBusiness(
	businessId: string,
	input: { reasonType: SuspensionReasonType; note: string; showNote: boolean; noticeSent: boolean; noticeSentOn: string | null },
): Promise<ActionResult<SuspensionStateView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/businesses/:businessId/suspend", {
		...(await withSession()),
		params: { businessId },
		body: input,
	});
	if (error || !data) return fail(error, "The business could not be suspended");
	revalidateBusiness(businessId);
	return { ok: true, data: data.data };
}

export async function reactivateBusiness(businessId: string, note: string): Promise<ActionResult<SuspensionStateView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/businesses/:businessId/reactivate", {
		...(await withSession()),
		params: { businessId },
		body: { note },
	});
	if (error || !data) return fail(error, "The business could not be reactivated");
	revalidateBusiness(businessId);
	return { ok: true, data: data.data };
}
