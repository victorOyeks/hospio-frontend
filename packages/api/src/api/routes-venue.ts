import { z } from "zod";

/**
 * Venue dashboards and reports (hospio-backend docs/plan-venue-type.md phase 2): fnb-service `/sales/today` and `/sales/report`,
 * payment-service `/payments/by-terminal`, inventory-service `/usage/items`. Spread into `createSchema` in ./schema.ts. New fields are
 * nullable so a service that is behind or ahead never breaks a screen.
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
const money = z.number();
const count = z.number();

export const VenueOutletRow = z.object({
	outletId: z.string(),
	name: str,
	kind: str,
	sales: count,
	sold: money,
	paid: money,
	unpaid: money,
	onRooms: money,
	cancelled: count,
});

export const VenueItemRow = z.object({
	menuItemId: z.string(),
	name: z.string(),
	category: z.string(),
	outletId: str,
	outletName: str,
	quantity: count,
	revenue: money,
});

export const VenueMethodRow = z.object({
	method: z.string(),
	count: count,
	amount: money,
});

export const VenueVoidRow = z.object({
	kind: z.enum(["ORDER", "ITEM"]),
	orderId: z.string(),
	number: z.string(),
	outletName: str,
	at: str,
	item: str,
	quantity: count,
	amount: money,
	reason: str,
	byId: str,
	by: str,
});

export const VenueToday = z.object({
	date: z.string(),
	at: z.string(),
	today: z.object({
		sales: count,
		sold: money,
		paid: money,
		unpaid: money,
		cancelled: count,
		itemsSold: count,
	}),
	lastWeek: z
		.object({
			date: z.string(),
			soFarSales: count,
			soFar: money,
			daySales: count,
			day: money,
		})
		.nullable()
		.optional(),
	takenByMethod: z.array(VenueMethodRow),
	byOutlet: z.array(VenueOutletRow),
	topItems: z.array(VenueItemRow),
	openTabs: z.object({
		count: count,
		value: money,
		oldestAt: str,
		staleHours: z.number(),
		staleCount: count,
		stale: z.array(
			z.object({
				orderId: z.string(),
				number: z.string(),
				outletName: str,
				guestName: str,
				openedBy: str,
				openedAt: str,
				balance: money,
			}),
		),
	}),
	unpaid: z.object({ count: count, amount: money }),
	voids: z.object({
		count: count,
		amount: money,
		latest: z.array(VenueVoidRow),
	}),
	priceChangesWaiting: count,
});

export const VenueReport = z.object({
	from: z.string(),
	to: z.string(),
	outletId: str,
	outlets: z.array(z.object({ id: z.string(), name: z.string(), kind: str })),
	totals: z.object({
		sales: count,
		sold: money,
		paid: money,
		unpaid: money,
		onRooms: money,
		cancelled: count,
		cancelledAmount: money,
		discounts: money,
		serviceCharge: money,
		tax: money,
		itemsSold: count,
		itemSales: money,
		voids: count,
		voidAmount: money,
		complimentary: count,
		complimentaryAmount: money,
	}),
	byOutlet: z.array(VenueOutletRow),
	byItem: z.array(VenueItemRow),
	byCategory: z.array(
		z.object({
			category: z.string(),
			quantity: count,
			revenue: money,
			items: count,
		}),
	),
	byStaff: z.array(
		z.object({
			userId: str,
			name: z.string(),
			sales: count,
			sold: money,
			paid: money,
			cancelled: count,
			voids: count,
			voidAmount: money,
		}),
	),
	byHour: z.array(z.object({ hour: z.number(), sales: count, sold: money })),
	byMethod: z.array(VenueMethodRow),
	voids: z.array(VenueVoidRow),
	voidsTruncated: z.boolean(),
	discounts: z.array(
		z.object({
			orderId: z.string(),
			number: z.string(),
			outletName: str,
			at: str,
			discount: money,
			total: money,
			complimentary: z.boolean(),
			openedBy: str,
			/** Phase 4: the part given by hand (the rest is happy hour), complimentary items and their worth, why, who gave and who approved. */
			byHand: z.number().nullable().optional(),
			complimentaryItems: z.number().nullable().optional(),
			complimentaryAmount: z.number().nullable().optional(),
			reasons: str,
			givenBy: str,
			approvedBy: str,
		}),
	),
	discountsTruncated: z.boolean(),
	stockUse: z.array(z.object({ stockItemId: z.string(), quantity: z.number() })),
	itemsWithRecipe: count,
	itemsWithoutRecipe: count,
});

export const TerminalTotal = z.object({
	method: z.string(),
	terminalId: str,
	terminal: str,
	provider: str,
	count: count,
	amount: money,
});

export const ItemUsageReport = z.object({
	from: z.string(),
	to: z.string(),
	items: z.array(
		z.object({
			itemId: z.string(),
			name: z.string(),
			unit: str,
			category: str,
			soldUse: z.number(),
			otherUse: z.number(),
			waste: z.number(),
			countDifference: z.number(),
		}),
	),
});

const period = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
});

export const venueRoutes = {
	"@get/fnb/sales/today": {
		query: z.object({ staleHours: z.number().optional() }).optional(),
		output: envelope(VenueToday),
	},
	"@get/fnb/sales/report": {
		query: period.extend({ outletId: z.string().optional() }),
		output: envelope(VenueReport),
	},
	"@get/payment/payments/by-terminal": {
		query: period,
		output: envelope(z.array(TerminalTotal)),
	},
	"@get/inventory/usage/items": {
		query: period,
		output: envelope(ItemUsageReport),
	},
} as const;

export type VenueTodayData = z.infer<typeof VenueToday>;
export type VenueReportData = z.infer<typeof VenueReport>;
export type TerminalTotalRow = z.infer<typeof TerminalTotal>;
export type ItemUsageData = z.infer<typeof ItemUsageReport>;
