import { z } from "zod";

/**
 * Hospio's daily fee and each hotel's POS keys (hospio-backend docs/plan-daily-fees.md, docs/pos-providers.md): the owner's
 * Hospio fees, the admin portal's daily fees, fee collection switch and POS keys (platform-service and payment-service).
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

export const SalesLine = z.object({
	source: z.string(),
	label: z.string(),
	amount: z.number(),
	count: z.number(),
});

export const DailyFee = z.object({
	id: z.string(),
	businessId: z.string(),
	hotelId: z.string(),
	hotelName: str,
	date: z.string(),
	sales: z.number(),
	lines: z.array(SalesLine).nullable().optional(),
	rate: z.number(),
	fee: z.number(),
	carriedIn: num,
	due: z.number(),
	collected: num,
	status: z.string(),
	provider: str,
	debitRef: str,
	attempts: num,
	lastError: str,
	statementSentAt: str,
	debitedAt: str,
});

export const ProviderState = z.object({
	provider: z.string(),
	debitConfigured: z.boolean(),
	hotelKeys: z.boolean(),
	reason: str,
});

export const FeeCollection = z.object({
	hotelId: z.string(),
	provider: str,
	debitEnabled: z.boolean(),
	posPaused: z.boolean(),
	changedByName: str,
	changedAt: str,
	providers: z.array(ProviderState),
});

export const PosConfig = z.object({
	hotelId: z.string(),
	provider: str,
	fields: z.record(z.string(), z.string().nullable()),
	complete: z.boolean(),
	posPaused: z.boolean(),
	updatedByName: str,
	updatedAt: str,
	keyStoreReady: z.boolean(),
});

export const DayRun = z.object({
	date: z.string(),
	worked: z.number(),
	skipped: z.number(),
	statements: z.number(),
	notes: z.array(z.string()),
});

export const DebitRun = z.object({
	tried: z.number(),
	paid: z.number(),
	pending: z.number(),
	unpaid: z.number(),
	paused: z.number(),
	resumed: z.number(),
});

const range = z.object({ from: z.string().optional(), to: z.string().optional() });

export const feeRoutes = {
	"@get/platform/owner/fees/daily": { query: range, output: envelope(z.array(DailyFee)) },
	"@get/platform/admin/fees/daily": {
		query: range.extend({ businessId: z.string().optional(), hotelId: z.string().optional() }),
		output: envelope(z.array(DailyFee)),
	},
	"@post/platform/admin/fees/daily/run": { query: z.object({ date: z.string() }), output: envelope(DayRun) },
	"@post/platform/admin/fees/daily/debit": { output: envelope(DebitRun) },
	"@post/platform/admin/fees/daily/:id/redo": { params: z.object({ id: z.string() }), output: envelope(DailyFee) },
	"@get/platform/admin/businesses/:businessId/hotels/:hotelId/fee-collection": {
		params: z.object({ businessId: z.string(), hotelId: z.string() }),
		output: envelope(FeeCollection),
	},
	"@put/platform/admin/businesses/:businessId/hotels/:hotelId/fee-collection": {
		params: z.object({ businessId: z.string(), hotelId: z.string() }),
		input: z.object({ provider: z.string().nullable(), debitEnabled: z.boolean() }),
		output: envelope(FeeCollection),
	},
	"@get/payment/admin/hotels/:hotelId/pos-config": {
		params: z.object({ hotelId: z.string() }),
		output: envelope(PosConfig),
	},
	"@put/payment/admin/hotels/:hotelId/pos-config": {
		params: z.object({ hotelId: z.string() }),
		input: z.object({ businessId: z.string(), provider: z.string(), fields: z.record(z.string(), z.string()) }),
		output: envelope(PosConfig),
	},
	"@delete/payment/admin/hotels/:hotelId/pos-config": {
		params: z.object({ hotelId: z.string() }),
		output: envelope(PosConfig),
	},
	"@get/payment/pos-config": { output: envelope(PosConfig) },
	// The admin portal's Hotels page, in one call each: every hotel's fee state and every hotel's POS status (no keys).
	"@get/platform/admin/fees/hotels": {
		output: envelope(
			z.array(
				z.object({
					hotelId: z.string(),
					provider: str,
					debitEnabled: z.boolean(),
					posPaused: z.boolean(),
					lastFee: DailyFee.nullable().optional(),
				}),
			),
		),
	},
	"@get/payment/admin/pos-configs": {
		output: envelope(
			z.array(z.object({ hotelId: z.string(), provider: str, complete: z.boolean(), posPaused: z.boolean() })),
		),
	},
};
