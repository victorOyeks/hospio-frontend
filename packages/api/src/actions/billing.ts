"use server";

import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type {
	BillingStatus,
	BusinessBilling,
	ChargesBanner,
	ChargesStartPreview,
	ChargesStartRow,
	ChargesStartView,
	IssueRun,
	InvoiceEvent,
	InvoiceLine,
	InvoicePayment,
	MonthlyInvoice,
	MonthlyInvoiceList,
	MonthlyInvoiceRow,
} from "@hospio/api/api/routes-billing";
import type { DailyFee } from "@hospio/api/api/routes-fees";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { demoInvoice, demoInvoiceRow } from "@hospio/api/demo/fixtures/billing";
import { demoDelay } from "@hospio/api/demo/mode";
import { env } from "@hospio/api/env";

/**
 * Hospio360's monthly invoice (hospio-backend docs/plan-monthly-invoices.md): the hotel app's banner, Billing & invoices
 * (owner pays, managers read their locations' lines) and the admin portal's Invoices (record a payment, extend once, credit
 * note or adjustment, void and reissue, issue a month). Demo mode answers from one made-up invoice.
 */

export type BillingStatusView = z.infer<typeof BillingStatus>;
export type InvoiceView = z.infer<typeof MonthlyInvoice>;
export type InvoiceRowView = z.infer<typeof MonthlyInvoiceRow>;
export type InvoiceListView = z.infer<typeof MonthlyInvoiceList>;
export type InvoiceLineView = z.infer<typeof InvoiceLine>;
export type InvoicePaymentView = z.infer<typeof InvoicePayment>;
export type InvoiceEventView = z.infer<typeof InvoiceEvent>;
export type BusinessBillingView = z.infer<typeof BusinessBilling>;
export type IssueRunView = z.infer<typeof IssueRun>;
export type ChargesStartRowView = z.infer<typeof ChargesStartRow>;
export type ChargesStartDetail = z.infer<typeof ChargesStartView>;
export type ChargesStartPreviewView = z.infer<typeof ChargesStartPreview>;
export type ChargesBannerView = z.infer<typeof ChargesBanner>;
export type InvoiceDay = z.infer<typeof DailyFee>;
/** A file from the services: CSV as text, a PDF as base64, for the browser to save. */
export type BillingFile = { name: string; type: string; text?: string; base64?: string };

const fail = <T>(error: unknown, fallback: string): ActionResult<T> => ({ ok: false, error: errorMessage(error, fallback) });
const NONE: BillingStatusView = {
	state: "NONE",
	invoiceId: null,
	number: null,
	monthLabel: null,
	outstanding: null,
	dueOn: null,
	lastDay: null,
	restrictFrom: null,
	restricted: false,
	canPay: false,
	title: null,
	message: null,
};

// ---- the hotel app -------------------------------------------------------------------------------------------------

/** GET /platform/billing/status: the banner. Never fails a page: anything wrong reads as "nothing to show". */
export async function billingStatus(): Promise<BillingStatusView> {
	if (!live("platform")) return NONE;
	const { data, error } = await api("@get/platform/billing/status", await withSession());
	return error || !data ? NONE : data.data;
}

export async function myInvoices(): Promise<ActionResult<InvoiceRowView[]>> {
	if (!live("platform")) return { ok: true, data: [demoInvoiceRow()] };
	const { data, error } = await api("@get/platform/billing/invoices", await withSession());
	return error || !data ? fail(error, "Your invoices could not be loaded") : { ok: true, data: data.data };
}

export async function myInvoice(id: string): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: true, data: { ...demoInvoice(), events: [] } };
	const { data, error } = await api("@get/platform/billing/invoices/:id", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The invoice could not be loaded") : { ok: true, data: data.data };
}

export async function myInvoiceDays(id: string): Promise<ActionResult<InvoiceDay[]>> {
	if (!live("platform")) return { ok: true, data: [] };
	const { data, error } = await api("@get/platform/billing/invoices/:id/days", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The days could not be loaded") : { ok: true, data: data.data };
}

/** Starts Paystack's checkout for the full outstanding amount (owner only); the browser goes to `authorizationUrl`. */
export async function payInvoice(id: string, returnUrl: string): Promise<ActionResult<{ authorizationUrl: string; reference: string }>> {
	if (!live("platform")) return { ok: false, error: "Paying needs the live services (demo mode)" };
	const { data, error } = await api("@post/platform/billing/invoices/:id/pay", {
		...(await withSession()),
		params: { id },
		body: { returnUrl },
	});
	return error || !data ? fail(error, "The payment could not be started") : { ok: true, data: data.data };
}

/** Back from Paystack (?reference=): confirms the payment (the webhook may already have done it). */
export async function confirmInvoicePayment(reference: string): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: false, error: "Paying needs the live services (demo mode)" };
	const { data, error } = await api("@post/platform/billing/payments/confirm", { ...(await withSession()), query: { reference } });
	return error || !data ? fail(error, "The payment could not be confirmed yet") : { ok: true, data: data.data };
}

// ---- files (PDF, CSV) ------------------------------------------------------------------------------------------------

const seg = (s: string) => encodeURIComponent(s);

/**
 * One of the invoice's files, fetched here with the session's token (the browser has none) and handed back for the screen
 * to save: the invoice PDF, a payment's receipt PDF, or the day-by-day CSV. `admin` reads through the admin routes.
 */
export async function invoiceFile(
	file: { kind: "pdf"; id: string } | { kind: "receipt"; id: string; paymentId: string } | { kind: "days"; id: string },
	admin = false,
): Promise<ActionResult<BillingFile>> {
	if (!live("platform")) return { ok: false, error: "Downloads need the live services (demo mode)" };
	const base = `${env.NEXT_PUBLIC_API_URL}/platform/${admin ? "admin/" : ""}billing/invoices/${seg(file.id)}`;
	const url =
		file.kind === "pdf"
			? `${base}/pdf`
			: file.kind === "receipt"
				? `${base}/payments/${seg(file.paymentId)}/receipt`
				: admin
					? null
					: `${base}/days.csv`;
	if (!url) return { ok: false, error: "Not available" };
	return download(url, file.kind === "days" ? "text/csv" : "application/pdf", file.kind === "days" ? "invoice-days.csv" : "invoice.pdf");
}

/** GET /platform/admin/billing/invoices/export (same filters as the list) as CSV. */
export async function exportInvoices(q: { status?: string; month?: string; businessId?: string }): Promise<ActionResult<BillingFile>> {
	if (!live("platform")) return { ok: false, error: "The export needs the live services (demo mode)" };
	const params = new URLSearchParams();
	for (const [k, v] of Object.entries(q)) if (v) params.set(k, v);
	const qs = params.toString();
	return download(`${env.NEXT_PUBLIC_API_URL}/platform/admin/billing/invoices/export${qs ? `?${qs}` : ""}`, "text/csv", `hospio360-invoices${q.month ? `-${q.month}` : ""}.csv`);
}

async function download(url: string, type: string, fallbackName: string): Promise<ActionResult<BillingFile>> {
	const session = await withSession();
	const res = await fetch(url, {
		headers: {
			Accept: `${type}, application/json`,
			...(session.auth ? { Authorization: `Bearer ${session.auth.token}` } : {}),
		},
		cache: "no-store",
	}).catch(() => null);
	if (!res) return { ok: false, error: "Can't reach the server" };
	if (!res.ok) {
		let message = "The file could not be downloaded";
		try {
			const body = JSON.parse(await res.text()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			// not JSON: keep the general sentence
		}
		return { ok: false, error: message };
	}
	const disposition = res.headers.get("Content-Disposition") ?? "";
	const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
	if (type === "text/csv") return { ok: true, data: { name, type, text: await res.text() } };
	const bytes = Buffer.from(await res.arrayBuffer());
	return { ok: true, data: { name, type, base64: bytes.toString("base64") } };
}

// ---- Hospio360 admin -------------------------------------------------------------------------------------------------

export async function adminInvoices(q: { status?: string; month?: string; businessId?: string }): Promise<ActionResult<InvoiceListView>> {
	if (!live("platform")) {
		await demoDelay(200);
		const row = demoInvoiceRow();
		const rows = (!q.status || q.status === row.displayStatus) && (!q.month || q.month === row.month) ? [row] : [];
		return {
			ok: true,
			data: {
				invoices: rows,
				counts: { DUE: 1, DUE_SOON: 0, OVERDUE: 0, RESTRICTED: 0, PAID: 0, CARRIED_FORWARD: 0, VOID: 0 },
				totals: { invoiced: row.total, paid: 0, outstanding: row.outstanding, platformFee: row.sections.platform },
			},
		};
	}
	const query = Object.fromEntries(Object.entries(q).filter(([, v]) => !!v));
	const { data, error } = await api("@get/platform/admin/billing/invoices", { ...(await withSession()), query });
	return error || !data ? fail(error, "Invoices could not be loaded") : { ok: true, data: data.data };
}

export async function adminInvoice(id: string): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: true, data: demoInvoice() };
	const { data, error } = await api("@get/platform/admin/billing/invoices/:id", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The invoice could not be loaded") : { ok: true, data: data.data };
}

export async function adminInvoiceDays(id: string): Promise<ActionResult<InvoiceDay[]>> {
	if (!live("platform")) return { ok: true, data: [] };
	const { data, error } = await api("@get/platform/admin/billing/invoices/:id/days", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The days could not be loaded") : { ok: true, data: data.data };
}

const DEMO_WRITE = "Needs the live services (demo mode)";

/** Money roles: a payment taken outside Paystack (part payments allowed); a receipt is made and the restriction lifts when paid. */
export async function recordInvoicePayment(
	id: string,
	body: { amount: number; via: string; reference: string; paidOn: string; note: string },
): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/billing/invoices/:id/payments", {
		...(await withSession()),
		params: { id },
		body: {
			amount: body.amount,
			via: body.via,
			reference: body.reference.trim() || null,
			paidOn: body.paidOn || null,
			note: body.note.trim() || null,
		},
	});
	return error || !data ? fail(error, "The payment could not be recorded") : { ok: true, data: data.data };
}

/** Money roles, once per invoice: a new last day before the restriction. */
export async function extendInvoice(id: string, until: string, reason: string): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/billing/invoices/:id/extend", {
		...(await withSession()),
		params: { id },
		body: { until, reason: reason.trim() },
	});
	return error || !data ? fail(error, "The extension could not be saved") : { ok: true, data: data.data };
}

/** Money roles: a credit note (negative) or an adjustment (positive), with the reason shown on the invoice. */
export async function adjustInvoice(id: string, amount: number, reason: string): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/billing/invoices/:id/adjust", {
		...(await withSession()),
		params: { id },
		body: { amount, reason: reason.trim() },
	});
	return error || !data ? fail(error, "The adjustment could not be saved") : { ok: true, data: data.data };
}

/** Money roles: void (lifts any restriction); `reissue` makes a fresh invoice for the same month. */
export async function voidInvoice(id: string, reason: string, reissue: boolean): Promise<ActionResult<InvoiceView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/billing/invoices/:id/void", {
		...(await withSession()),
		params: { id },
		body: { reason: reason.trim(), reissue },
	});
	return error || !data ? fail(error, "The invoice could not be voided") : { ok: true, data: data.data };
}

/** Super admin: issue a month that has ended, for every business or one. Answers in a sentence. */
export async function issueInvoices(month: string, businessId?: string): Promise<ActionResult<string>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@post/platform/admin/billing/invoices/run", {
		...(await withSession()),
		query: { month, ...(businessId ? { businessId } : {}) },
	});
	if (error || !data) return fail(error, "The invoices could not be issued");
	const d = data.data as Partial<IssueRunView & InvoiceView> | null;
	if (d && typeof d.issued === "number")
		return { ok: true, data: `${d.issued} issued, ${d.carriedForward ?? 0} carried forward, ${d.skipped ?? 0} skipped` };
	return { ok: true, data: d?.number ? `${d.number} issued` : "Done" };
}

export async function businessBilling(businessId: string): Promise<ActionResult<BusinessBillingView>> {
	if (!live("platform"))
		return { ok: true, data: { state: "DUE", openInvoices: 1, outstanding: demoInvoice().outstanding, latestNumber: demoInvoice().number, latestStatus: "DUE", restricted: false } };
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/billing", { ...(await withSession()), params: { businessId } });
	return error || !data ? fail(error, "Billing could not be loaded") : { ok: true, data: data.data };
}

// ---- free until charges start --------------------------------------------------------------------------------------

/** The hotel app's Billing & invoices banner. Never fails a page: anything wrong reads as nothing to show (null). */
export async function chargesBanner(): Promise<ChargesBannerView | null> {
	if (!live("platform"))
		return { state: "FREE", chargesStartOn: null, ratePct: 1.5, title: "Free: no charges until Hospio360 tells you", message: "Devices you lease from us are still billed monthly." };
	const { data, error } = await api("@get/platform/billing/charges", await withSession());
	return error || !data ? null : data.data;
}

/** Every business with a charges start record (a business missing from it is free), keyed by business id. */
export async function chargesStartRows(): Promise<Record<string, ChargesStartRowView>> {
	if (!live("platform")) return {};
	const { data, error } = await api("@get/platform/admin/billing/charges-start", await withSession());
	if (error || !data) return {};
	const out: Record<string, ChargesStartRowView> = {};
	for (const r of data.data.rows ?? []) out[r.businessId] = r;
	return out;
}

export async function chargesStart(businessId: string): Promise<ActionResult<ChargesStartDetail>> {
	if (!live("platform"))
		return {
			ok: true,
			data: { businessId, chargesStartOn: null, state: "FREE", label: "Free", ratePct: 1.5, canEdit: false, setByName: null, setAt: null, reason: null, history: [] },
		};
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/charges-start", { ...(await withSession()), params: { businessId } });
	return error || !data ? fail(error, "The charges start date could not be loaded") : { ok: true, data: data.data };
}

/** What a new date (null = clear) would do to the days not invoiced yet. */
export async function previewChargesStart(businessId: string, date: string | null): Promise<ActionResult<ChargesStartPreviewView>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/charges-start/preview", {
		...(await withSession()),
		params: { businessId },
		query: date ? { date } : {},
	});
	return error || !data ? fail(error, "The change could not be checked") : { ok: true, data: data.data };
}

/** Money roles: set, move or clear (null) the date, with a reason; `confirmEarlier` when free days would become billable. */
export async function setChargesStart(
	businessId: string,
	body: { chargesStartOn: string | null; reason: string; confirmEarlier?: boolean },
): Promise<ActionResult<ChargesStartDetail>> {
	if (!live("platform")) return { ok: false, error: DEMO_WRITE };
	const { data, error } = await api("@put/platform/admin/businesses/:businessId/charges-start", {
		...(await withSession()),
		params: { businessId },
		body: { chargesStartOn: body.chargesStartOn, reason: body.reason.trim(), confirmEarlier: body.confirmEarlier ?? false },
	});
	return error || !data ? fail(error, "The charges start date could not be saved") : { ok: true, data: data.data };
}
