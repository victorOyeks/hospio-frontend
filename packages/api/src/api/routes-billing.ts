import { z } from "zod";
import { DailyFee } from "./routes-fees";

/**
 * Hospio360's monthly invoice (hospio-backend docs/plan-monthly-invoices.md, platform-service BillingController): one invoice per
 * business per month (HIN-YYYYMM-NNNN) with the platform fee per location, guest messages, devices & internet, carried-in months
 * and credits. The hotel app's banner, Billing & invoices and Pay now; the admin portal's Invoices tab and its actions.
 * Spread into `createSchema` in ./schema.ts. New fields are nullable so a service that is behind or ahead never breaks a screen.
 */

const envelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		requestTime: z.string(),
		requestType: z.string(),
		referenceId: z.string(),
		status: z.boolean(),
		message: z.string().nullable(),
		data,
	});

const str = z.string().nullable().optional();
const num = z.number().nullable().optional();

/** One line of an invoice. section: PLATFORM, MESSAGES, DEVICES, CARRIED, ADJUSTMENT. */
export const InvoiceLine = z.object({
	id: z.string(),
	section: z.string(),
	hotelId: str,
	hotelName: str,
	label: z.string(),
	detail: str,
	baseAmount: num,
	rate: num,
	amount: z.number(),
	sourceType: str,
	sourceId: str,
	createdByName: str,
	createdAt: str,
});

export const InvoicePayment = z.object({
	id: z.string(),
	receiptNumber: str,
	amount: z.number(),
	via: str,
	reference: str,
	paidOn: str,
	recordedByName: str,
	note: str,
	createdAt: str,
});

/** The reminder log and every action on the invoice (admin only). */
export const InvoiceEvent = z.object({
	id: z.string(),
	kind: z.string(),
	onDate: str,
	recipient: str,
	outcome: str,
	note: str,
	actorName: str,
	createdAt: str,
});

export const SectionTotals = z.object({
	platform: z.number(),
	messages: z.number(),
	devices: z.number(),
	carriedIn: z.number(),
	adjustments: z.number(),
});

/** status: DUE, OVERDUE, PAID, CARRIED_FORWARD, VOID. displayStatus adds DUE_SOON and RESTRICTED. */
export const MonthlyInvoice = z.object({
	id: z.string(),
	number: z.string(),
	businessId: z.string(),
	businessName: str,
	month: z.string(),
	monthLabel: str,
	issuedOn: z.string(),
	dueOn: z.string(),
	graceUntil: str,
	lastDay: str,
	restrictFrom: str,
	status: z.string(),
	displayStatus: z.string(),
	sections: SectionTotals,
	vatPct: num,
	vatAmount: num,
	total: z.number(),
	paidAmount: z.number(),
	outstanding: z.number(),
	paidAt: str,
	paidVia: str,
	extendedUntil: str,
	extensionReason: str,
	extendedByName: str,
	restricted: z.boolean(),
	restrictedAt: str,
	carriedIntoNumber: str,
	voidReason: str,
	reissueOfNumber: str,
	replacedByNumber: str,
	canPay: z.boolean(),
	lines: z.array(InvoiceLine),
	payments: z.array(InvoicePayment),
	events: z.array(InvoiceEvent).nullable().optional(),
});

export const MonthlyInvoiceRow = z.object({
	id: z.string(),
	number: z.string(),
	businessId: z.string(),
	businessName: str,
	month: z.string(),
	monthLabel: str,
	issuedOn: z.string(),
	dueOn: z.string(),
	lastDay: str,
	status: z.string(),
	displayStatus: z.string(),
	sections: SectionTotals,
	total: z.number(),
	paidAmount: z.number(),
	outstanding: z.number(),
	restricted: z.boolean(),
	extendedUntil: str,
});

export const MonthlyInvoiceList = z.object({
	invoices: z.array(MonthlyInvoiceRow),
	counts: z.record(z.string(), z.number()),
	totals: z.record(z.string(), z.number()),
});

/** The hotel app's banner. state: NONE, DUE, DUE_SOON, DUE_TODAY, OVERDUE, FINAL_WARNING, RESTRICTED. */
export const BillingStatus = z.object({
	state: z.string(),
	invoiceId: str,
	number: str,
	monthLabel: str,
	outstanding: num,
	dueOn: str,
	lastDay: str,
	restrictFrom: str,
	restricted: z.boolean(),
	canPay: z.boolean(),
	title: str,
	message: str,
});

/** state: NO_INVOICES, PAID_UP, DUE, OVERDUE, RESTRICTED. */
export const BusinessBilling = z.object({
	state: z.string(),
	openInvoices: z.number(),
	outstanding: z.number(),
	latestNumber: str,
	latestStatus: str,
	restricted: z.boolean(),
});

export const BillingCheckout = z.object({ authorizationUrl: z.string(), reference: z.string() });

export const IssueRun = z.object({
	month: z.string(),
	issued: z.number(),
	carriedForward: z.number(),
	skipped: z.number(),
	notes: z.array(z.string()),
});

const id = z.object({ id: z.string() });
const adminQuery = z.object({ status: z.string().optional(), month: z.string().optional(), businessId: z.string().optional() });

export const billingRoutes = {
	// ---- the hotel app (owner and managers; staff only ever get NONE or RESTRICTED) ----
	"@get/platform/billing/status": { output: envelope(BillingStatus) },
	"@get/platform/billing/invoices": { output: envelope(z.array(MonthlyInvoiceRow)) },
	"@get/platform/billing/invoices/:id": { params: id, output: envelope(MonthlyInvoice) },
	"@get/platform/billing/invoices/:id/days": { params: id, output: envelope(z.array(DailyFee)) },
	"@post/platform/billing/invoices/:id/pay": {
		params: id,
		input: z.object({ returnUrl: z.string() }),
		output: envelope(BillingCheckout),
	},
	"@post/platform/billing/payments/confirm": {
		query: z.object({ reference: z.string() }),
		output: envelope(MonthlyInvoice),
	},
	// ---- Hospio360 admin ----
	"@get/platform/admin/billing/invoices": { query: adminQuery, output: envelope(MonthlyInvoiceList) },
	"@get/platform/admin/billing/invoices/:id": { params: id, output: envelope(MonthlyInvoice) },
	"@get/platform/admin/billing/invoices/:id/days": { params: id, output: envelope(z.array(DailyFee)) },
	"@post/platform/admin/billing/invoices/:id/payments": {
		params: id,
		input: z.object({
			amount: z.number(),
			via: z.string(),
			reference: z.string().nullable(),
			paidOn: z.string().nullable(),
			note: z.string().nullable(),
		}),
		output: envelope(MonthlyInvoice),
	},
	"@post/platform/admin/billing/invoices/:id/extend": {
		params: id,
		input: z.object({ until: z.string(), reason: z.string() }),
		output: envelope(MonthlyInvoice),
	},
	"@post/platform/admin/billing/invoices/:id/adjust": {
		params: id,
		input: z.object({ amount: z.number(), reason: z.string() }),
		output: envelope(MonthlyInvoice),
	},
	"@post/platform/admin/billing/invoices/:id/void": {
		params: id,
		input: z.object({ reason: z.string(), reissue: z.boolean() }),
		output: envelope(MonthlyInvoice),
	},
	/** SUPER_ADMIN: a month that has ended; every business (IssueRun) or one (the invoice). */
	"@post/platform/admin/billing/invoices/run": {
		query: z.object({ month: z.string().optional(), businessId: z.string().optional() }),
		output: envelope(z.unknown()),
	},
	"@get/platform/admin/businesses/:businessId/billing": {
		params: z.object({ businessId: z.string() }),
		output: envelope(BusinessBilling),
	},
};
