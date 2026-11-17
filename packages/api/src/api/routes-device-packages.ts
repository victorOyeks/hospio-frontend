import { z } from "zod";

/**
 * Devices and internet Hospio360 supplies to hotels (hospio-backend docs/plan-device-packages.md): the catalogue, each hotel's
 * package, its payments, the owner's and manager's read-only view (platform-service). Spread into `createSchema` in ./schema.ts.
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

export const DeviceCatalogueItem = z.object({
	id: z.string(),
	name: z.string(),
	kind: z.string(),
	unitPrice: z.number(),
	active: z.boolean(),
	sortOrder: z.number(),
});

export const DeviceItem = z.object({
	id: z.string(),
	catalogueId: str,
	name: z.string(),
	kind: z.string(),
	quantity: z.number(),
	unitPrice: z.number(),
	lineTotal: z.number(),
});

export const DevicePaymentRow = z.object({
	id: z.string(),
	source: z.string(),
	amount: z.number(),
	reference: z.string(),
	paidOn: z.string(),
	note: str,
	recordedByName: str,
	createdAt: str,
});

export const DevicePackage = z.object({
	id: z.string(),
	businessId: z.string(),
	hotelId: z.string(),
	hotelName: str,
	status: z.string(),
	paymentOption: z.string(),
	deviceRate: num,
	months: num,
	monthlyInstalment: num,
	total: z.number(),
	paid: z.number(),
	remaining: z.number(),
	dataPlanMonthly: z.number(),
	notes: str,
	agreedByName: str,
	agreedAt: str,
	installedAt: str,
	paidOffAt: str,
	items: z.array(DeviceItem),
	payments: z.array(DevicePaymentRow),
	last30Days: num,
	daysLeft: num,
	expectedFinish: str,
	updatedAt: str,
});

const hotelParams = z.object({ businessId: z.string(), hotelId: z.string() });
const idParams = z.object({ id: z.string() });
const catalogueBody = z.object({
	name: z.string(),
	kind: z.string(),
	unitPrice: z.number(),
	active: z.boolean().optional(),
	sortOrder: z.number().optional(),
});

export const devicePackageRoutes = {
	"@get/platform/admin/devices/catalogue": { output: envelope(z.array(DeviceCatalogueItem)) },
	"@post/platform/admin/devices/catalogue": { input: catalogueBody, output: envelope(DeviceCatalogueItem) },
	"@put/platform/admin/devices/catalogue/:id": { params: idParams, input: catalogueBody, output: envelope(DeviceCatalogueItem) },
	"@get/platform/admin/devices/packages": {
		query: z.object({ status: z.array(z.string()).optional() }).optional(),
		output: envelope(z.array(DevicePackage)),
	},
	"@get/platform/admin/businesses/:businessId/device-packages": {
		params: z.object({ businessId: z.string() }),
		output: envelope(z.array(DevicePackage)),
	},
	"@get/platform/admin/businesses/:businessId/hotels/:hotelId/device-package": {
		params: hotelParams,
		output: envelope(DevicePackage.nullable()),
	},
	"@put/platform/admin/businesses/:businessId/hotels/:hotelId/device-package": {
		params: hotelParams,
		input: z.object({
			paymentOption: z.string(),
			items: z.array(
				z.object({
					catalogueId: z.string().nullable(),
					name: z.string(),
					kind: z.string(),
					quantity: z.number(),
					unitPrice: z.number(),
				}),
			),
			deviceRate: z.number().nullable(),
			months: z.number().nullable(),
			notes: z.string().nullable(),
		}),
		output: envelope(DevicePackage),
	},
	"@post/platform/admin/device-packages/:id/install": {
		params: idParams,
		input: z.object({ installedOn: z.string().nullable() }),
		output: envelope(DevicePackage),
	},
	"@post/platform/admin/device-packages/:id/payments": {
		params: idParams,
		input: z.object({ amount: z.number(), reference: z.string(), paidOn: z.string().nullable(), note: z.string().nullable() }),
		output: envelope(DevicePackage),
	},
	"@post/platform/admin/device-packages/:id/cancel": { params: idParams, output: envelope(DevicePackage) },
	"@get/platform/owner/devices": { output: envelope(z.array(DevicePackage)) },
	"@get/platform/devices": { output: envelope(DevicePackage.nullable()) },
} as const;
