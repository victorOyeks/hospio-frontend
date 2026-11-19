import { z } from "zod";

/**
 * Real suspension of a business (hospio-backend docs/suspension.md). The hotel app asks tenant-service whether the signed-in
 * person's business is suspended (the full-page "This account is suspended" screen); the admin portal's suspension candidates,
 * the 7 days' notice, Suspend and Reactivate are platform-service's. Spread into `createSchema` in ./schema.ts.
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

/** reasonType: UNPAID_INVOICE or OTHER. `reason` only when Hospio360 chose to show its note to the business. */
export const SuspensionStatus = z.object({
	suspended: z.boolean(),
	since: str,
	reasonType: str,
	reason: str,
});

export const OverdueInvoice = z.object({
	id: z.string(),
	number: z.string(),
	monthLabel: str,
	outstanding: z.number(),
	dueOn: z.string(),
	daysOverdue: z.number(),
	restricted: z.boolean(),
});

export const SuspensionNotice = z.object({
	id: z.string(),
	sentOn: z.string(),
	suspendOn: z.string(),
	invoiceNumbers: z.string(),
	total: z.number(),
	recipient: str,
	outcome: z.string(),
	sentByName: str,
	createdAt: str,
});

/** A business's suspension as the admin portal shows it. */
export const SuspensionState = z.object({
	businessId: z.string(),
	businessName: str,
	stage: z.string(),
	suspended: z.boolean(),
	suspendedAt: str,
	reasonType: str,
	reason: str,
	showReason: z.boolean(),
	noticeSentOn: str,
	previousStage: str,
	suspendedByName: str,
	overdue: z.array(OverdueInvoice),
	overdueTotal: z.number(),
	oldestDaysOverdue: z.number(),
	candidate: z.boolean(),
	lastNotice: SuspensionNotice.nullable().optional(),
	warnings: z.array(z.string()).nullable().optional(),
});

/** One row of "Suspension candidates": not suspended, an invoice 30+ days past its due date. */
export const SuspensionCandidate = z.object({
	businessId: z.string(),
	businessName: str,
	stage: str,
	ownerName: str,
	ownerEmail: str,
	overdue: z.array(OverdueInvoice),
	overdueTotal: z.number(),
	oldestDaysOverdue: z.number(),
	lastNotice: SuspensionNotice.nullable().optional(),
	noticeElapsed: z.boolean(),
});

const business = z.object({ businessId: z.string() });

export const suspensionRoutes = {
	"@get/tenant/businesses/suspension": { output: envelope(SuspensionStatus) },
	"@get/platform/admin/suspension/candidates": { output: envelope(z.array(SuspensionCandidate)) },
	"@get/platform/admin/businesses/:businessId/suspension": { params: business, output: envelope(SuspensionState) },
	"@post/platform/admin/businesses/:businessId/suspension/notice": {
		params: business,
		input: z.object({ suspendOn: z.string().nullable() }),
		output: envelope(SuspensionState),
	},
	"@post/platform/admin/businesses/:businessId/suspend": {
		params: business,
		input: z.object({
			reasonType: z.enum(["UNPAID_INVOICE", "OTHER"]),
			note: z.string(),
			showNote: z.boolean(),
			noticeSent: z.boolean(),
			noticeSentOn: z.string().nullable(),
		}),
		output: envelope(SuspensionState),
	},
	"@post/platform/admin/businesses/:businessId/reactivate": {
		params: business,
		input: z.object({ note: z.string() }),
		output: envelope(SuspensionState),
	},
};
