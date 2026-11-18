import { z } from "zod";
import { OrderItem } from "./routes-fnb";

/**
 * A sale's bill (hospio-backend docs/plan-venue-type.md, phase 4): fnb-service `/orders/{id}/bill`, splitting it and paying each
 * part, discounts and complimentary items, void and discount requests from the floor, tips, and the outlets a person works;
 * platform-service's "decide on this device" for a manager's PIN. Spread into `createSchema` in ./schema.ts. Fields are nullable
 * so a service that is behind or ahead never breaks a screen.
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
const money = z.number();

export const BillPartItem = z.object({
	lineId: z.string(),
	name: z.string(),
	share: str,
	amount: num,
});

export const BillPart = z.object({
	id: z.string(),
	position: z.number(),
	label: z.string(),
	amount: money,
	tax: num,
	serviceCharge: num,
	paidAmount: money,
	due: money,
	status: z.string(),
	method: str,
	roomNumber: str,
	items: z.array(BillPartItem).nullable().optional(),
	paidAt: str,
	paidByName: str,
});

export const BillSplit = z.object({
	id: z.string(),
	mode: z.string(),
	amount: money,
	createdByName: str,
	createdAt: str,
	parts: z.array(BillPart),
	paid: money,
	remaining: money,
	canUndo: z.boolean(),
});

export const BillPayment = z.object({
	paymentId: z.string(),
	method: z.string(),
	amount: money,
	at: str,
	reference: str,
	takenByName: str,
	partId: str,
	tip: num,
});

export const SaleRequestItem = z.object({
	id: z.string(),
	approvalId: z.string(),
	kind: z.string(),
	orderId: z.string(),
	orderNumber: str,
	outletName: str,
	lineId: str,
	summary: str,
	pct: num,
	amount: num,
	worth: num,
	reason: z.string(),
	status: z.string(),
	requestedBy: str,
	requestedByName: str,
	requestedAt: str,
	decidedByName: str,
	decisionNote: str,
	decidedAt: str,
});

export const BillCan = z.object({
	pay: z.boolean(),
	split: z.boolean(),
	undoSplit: z.boolean(),
	chargeToRoom: z.boolean(),
	discount: z.boolean(),
	discountLimitPct: num,
	voidAsks: z.boolean(),
	tips: z.boolean(),
	decide: z.boolean(),
	note: str,
});

export const BillItem = z.object({
	order: OrderItem,
	balance: money,
	split: BillSplit.nullable().optional(),
	payments: z.array(BillPayment),
	requests: z.array(SaleRequestItem),
	tips: z.array(
		z.object({ paymentId: z.string(), amount: money, method: z.string(), staffName: str, at: str }),
	),
	tipsTotal: money,
	can: BillCan,
});

export const BillOutcome = z.object({
	bill: BillItem,
	request: SaleRequestItem.nullable().optional(),
	message: str,
});

export const StaffOutletAssignment = z.object({
	userId: str,
	restricted: z.boolean(),
	outletIds: z.array(z.string()),
});

const TipSums = { count: z.number(), total: money, cash: money };

export const TipsReport = z.object({
	from: z.string(),
	to: z.string(),
	...TipSums,
	card: money,
	transfer: money,
	byStaff: z.array(z.object({ staffId: str, name: str, ...TipSums, other: money })),
	byDay: z.array(z.object({ date: z.string(), ...TipSums, other: money })),
	tips: z.array(
		z.object({
			orderId: z.string(),
			number: str,
			outletName: str,
			at: str,
			staffName: str,
			method: z.string(),
			amount: money,
			takenByName: str,
		}),
	),
	truncated: z.boolean(),
});

const id = z.object({ id: z.string() });

export const billRoutes = {
	"@get/fnb/orders/:id/bill": { params: id, output: envelope(BillItem) },
	"@post/fnb/orders/:id/split": {
		params: id,
		input: z.object({
			mode: z.enum(["EQUAL", "ITEM", "AMOUNT"]),
			people: z.number().nullable().optional(),
			amounts: z.array(z.number()).nullable().optional(),
			parts: z
				.array(
					z.object({
						label: z.string().nullable().optional(),
						lines: z.array(z.object({ lineId: z.string(), shares: z.number().optional() })),
					}),
				)
				.nullable()
				.optional(),
		}),
		output: envelope(BillItem),
	},
	"@delete/fnb/orders/:id/split": { params: id, output: envelope(BillItem) },
	"@post/fnb/orders/:id/parts/:partId/charge-to-room": {
		params: z.object({ id: z.string(), partId: z.string() }),
		query: z.object({ roomId: z.string() }).partial().optional(),
		output: envelope(BillItem),
	},
	"@post/fnb/orders/:id/discount": {
		params: id,
		input: z.object({
			lineId: z.string().nullable().optional(),
			pct: z.number().nullable().optional(),
			amount: z.number().nullable().optional(),
			complimentary: z.boolean().nullable().optional(),
			reason: z.string(),
		}),
		output: envelope(BillOutcome),
	},
	"@delete/fnb/orders/:id/discount": {
		params: id,
		query: z.object({ lineId: z.string() }).partial().optional(),
		output: envelope(BillItem),
	},
	"@post/fnb/orders/:id/void-request": {
		params: id,
		input: z.object({ lineId: z.string().nullable().optional(), reason: z.string() }),
		output: envelope(BillOutcome),
	},
	"@get/fnb/sale-requests": {
		query: z.object({ status: z.string(), mine: z.boolean() }).partial().optional(),
		output: envelope(z.array(SaleRequestItem)),
	},
	"@get/fnb/sale-requests/:id": { params: id, output: envelope(SaleRequestItem) },
	"@get/fnb/staff-outlets/mine": { output: envelope(StaffOutletAssignment) },
	"@get/fnb/staff-outlets": { output: envelope(z.record(z.string(), z.array(z.string()))) },
	"@put/fnb/staff-outlets/:userId": {
		params: z.object({ userId: z.string() }),
		input: z.object({ outletIds: z.array(z.string()) }),
		output: envelope(StaffOutletAssignment),
	},
	"@get/fnb/tips/report": {
		query: z.object({ from: z.string(), to: z.string(), staffId: z.string() }).partial().optional(),
		output: envelope(TipsReport),
	},
	/** A manager's PIN (the owner's password) typed on the requester's screen: the decision is recorded in the manager's name. */
	"@post/platform/approvals/:id/decide-on-device": {
		params: id,
		input: z.object({
			approver: z.string(),
			secret: z.string(),
			decision: z.string(),
			note: z.string().nullable().optional(),
		}),
		output: envelope(z.object({ id: z.string(), status: z.string() }).passthrough()),
	},
};
