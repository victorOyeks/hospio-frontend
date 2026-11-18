import { z } from "zod";
import { MarketerInvited } from "./routes-admin";
import { pagedOf } from "./paged";

/**
 * "Apply to be a partner" (hospio-backend docs/plan-marketers.md): the review side in Marketers · Applications,
 * platform-service `/admin/partner-applications`. The landing site's public form posts on its own (apps/landing).
 * Spread into `createSchema` in ./schema.ts.
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

export const PartnerApplication = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phone: str,
	city: str,
	state: str,
	businessKinds: z.array(z.string()).nullable().optional(),
	businessCount: str,
	networkNote: str,
	companyName: str,
	status: z.string(),
	createdAt: str,
	decidedAt: str,
	decidedByName: str,
	declineReason: str,
	declineReasonShared: z.boolean().nullable().optional(),
	marketerProfileId: str,
	marketerName: str,
	ip: str,
	userAgent: str,
	rpaVersion: str,
	privacyVersion: str,
});
export type PartnerApplication = z.infer<typeof PartnerApplication>;

export const PartnerReviewDefaults = z.object({
	sharePct: z.number(),
	months: z.number(),
	canDecide: z.boolean(),
	canChangeTerms: z.boolean(),
});

export const PartnerApplicationApproved = z.object({
	application: PartnerApplication,
	invited: MarketerInvited,
});

export const partnerRoutes = {
	"@get/platform/admin/partner-applications": {
		query: z
			.object({
				status: z.string(),
				q: z.string(),
				page: z.number(),
				size: z.number(),
			})
			.partial()
			.optional(),
		output: envelope(pagedOf(PartnerApplication)),
	},
	"@get/platform/admin/partner-applications/defaults": {
		output: envelope(PartnerReviewDefaults),
	},
	"@get/platform/admin/partner-applications/:id": {
		params: z.object({ id: z.string() }),
		output: envelope(PartnerApplication),
	},
	"@post/platform/admin/partner-applications/:id/approve": {
		params: z.object({ id: z.string() }),
		input: z.object({
			fullName: str,
			email: str,
			phone: str,
			sharePct: num,
			months: num,
		}),
		output: envelope(PartnerApplicationApproved),
	},
	"@post/platform/admin/partner-applications/:id/decline": {
		params: z.object({ id: z.string() }),
		input: z.object({ reason: z.string(), shareReason: z.boolean() }),
		output: envelope(PartnerApplication),
	},
};
