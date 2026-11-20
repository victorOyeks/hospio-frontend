import { z } from "zod";
import { pagedOf } from "./paged";

/**
 * "Book a demo" (hospio-backend docs/onboarding.md, "Applications"): the admin portal's Hotel applications, platform-service
 * `/admin/hotel-applications`. The landing site's public form posts on its own (apps/landing). Spread into `createSchema` in
 * ./schema.ts.
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

export const HotelApplicationNote = z.object({
	id: z.string(),
	kind: z.string(),
	body: z.string(),
	authorId: str,
	authorName: str,
	createdAt: str,
});

export const HotelApplication = z.object({
	id: z.string(),
	ownerName: z.string(),
	email: z.string(),
	phone: str,
	businessName: z.string(),
	businessType: z.string(),
	city: str,
	state: str,
	rooms: z.number().nullable().optional(),
	heardFrom: str,
	preferredTime: str,
	message: str,
	referralCode: str,
	marketerProfileId: str,
	marketerName: str,
	status: z.string(),
	statusChangedAt: str,
	assigneeId: str,
	assigneeName: str,
	meetingAt: str,
	declineReason: str,
	businessId: str,
	linkedBusinessName: str,
	onboardedAt: str,
	createdAt: str,
	ip: str,
	userAgent: str,
	notes: z.array(HotelApplicationNote).nullable().optional(),
});
export type HotelApplication = z.infer<typeof HotelApplication>;

const one = (input?: z.ZodTypeAny) => ({
	params: z.object({ id: z.string() }),
	...(input ? { input } : {}),
	output: envelope(HotelApplication),
});

export const hotelApplicationRoutes = {
	"@get/platform/admin/hotel-applications": {
		query: z
			.object({
				status: z.string(),
				q: z.string(),
				assigneeId: z.string(),
				page: z.number(),
				size: z.number(),
			})
			.partial()
			.optional(),
		output: envelope(pagedOf(HotelApplication)),
	},
	"@get/platform/admin/hotel-applications/new-count": {
		output: envelope(z.object({ count: z.number() })),
	},
	"@get/platform/admin/hotel-applications/permissions": {
		output: envelope(z.object({ canUpdate: z.boolean(), canDecline: z.boolean() })),
	},
	"@get/platform/admin/hotel-applications/:id": one(),
	"@put/platform/admin/hotel-applications/:id/status": one(
		z.object({ status: z.string(), meetingAt: str, reason: str, note: str }),
	),
	"@post/platform/admin/hotel-applications/:id/notes": one(z.object({ text: z.string() })),
	"@put/platform/admin/hotel-applications/:id/assignee": one(z.object({ assigneeId: str })),
	"@put/platform/admin/hotel-applications/:id/meeting": one(z.object({ meetingAt: str })),
	"@post/platform/admin/hotel-applications/:id/link": one(z.object({ businessId: z.string() })),
};
