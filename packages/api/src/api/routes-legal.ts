import { z } from "zod";

/**
 * Legal documents and their online acceptance (hospio-backend docs/legal-acceptance.md, platform-service): what the signed-in person
 * must accept, accepting, the owner's and admins' records, the handover's "links shared" note, new versions, and the owner's device
 * terms per package. Spread into `createSchema` in ./schema.ts.
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

/** One document version: TERMS, PRIVACY, DPA, DEBIT, DEVICES, SUPPORT, RPA or STAFF. */
export const LegalDoc = z.object({
	key: z.string(),
	version: z.string(),
	title: z.string(),
	slug: z.string(),
	url: z.string(),
	effectiveFrom: z.string(),
	material: z.boolean(),
	summary: str,
	/** DEBIT only: the share of daily sales the box states — the business's own rate for its owner (signed addendum), else the default. */
	ratePct: z.number().nullable().optional(),
});
export type LegalDoc = z.infer<typeof LegalDoc>;

/** An append-only record: ACCEPTED (who, version, when, IP, browser, how) or LINKS_SHARED (the back office's note). */
export const LegalRecord = z.object({
	id: z.string(),
	event: z.string(),
	method: z.string(),
	docKey: z.string(),
	title: z.string(),
	version: z.string(),
	userId: str,
	userName: str,
	userEmail: str,
	role: str,
	businessId: str,
	businessName: str,
	hotelId: str,
	reference: str,
	channel: str,
	sharedOn: str,
	note: str,
	ip: str,
	userAgent: str,
	recordedByName: str,
	at: z.string(),
	/** DEBIT: the rate the box stated when ticked (null on records from before 18 Nov 2026, whose box said 1.5%). */
	ratePct: z.number().nullable().optional(),
});
export type LegalRecord = z.infer<typeof LegalRecord>;

export const MyLegal = z.object({
	required: z.array(LegalDoc),
	pending: z.array(LegalDoc),
	upcoming: z.array(LegalDoc),
	records: z.array(LegalRecord),
	canAccept: z.boolean(),
});
export type MyLegal = z.infer<typeof MyLegal>;

export const LegalVersion = z.object({
	id: z.string(),
	docKey: z.string(),
	version: z.string(),
	title: z.string(),
	slug: z.string(),
	effectiveFrom: z.string(),
	material: z.boolean(),
	summary: str,
	createdByName: str,
	createdAt: str,
});
export type LegalVersion = z.infer<typeof LegalVersion>;

export const AcceptLegalInput = z.object({
	/** `ratePct`: for DEBIT, the rate the box showed; the server refuses (409) if it isn't the business's rate. */
	documents: z.array(z.object({ key: z.string(), version: z.string(), ratePct: z.number().optional() })).min(1),
	method: z.enum(["SELF_SIGN_UP", "HANDOVER", "PORTAL"]).optional(),
});

/** What to send for a ticked document: its key and version, and for DEBIT the rate its box stated. */
export function acceptItem(d: Pick<LegalDoc, "key" | "version" | "ratePct">): { key: string; version: string; ratePct?: number } {
	return d.key === "DEBIT" && d.ratePct != null ? { key: d.key, version: d.version, ratePct: d.ratePct } : { key: d.key, version: d.version };
}

export const SHARE_CHANNELS = ["WHATSAPP", "EMAIL", "SMS", "IN_PERSON", "PHONE_CALL", "OTHER"] as const;
export const LinksSharedInput = z.object({
	channel: z.enum(SHARE_CHANNELS),
	sharedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	note: z.string().max(300).optional(),
});

export const PublishLegalInput = z.object({
	key: z.string(),
	version: z.string().min(2).max(40),
	title: z.string().optional(),
	effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	material: z.boolean().optional(),
	summary: z.string().max(500).optional(),
});

export const legalRoutes = {
	"@get/platform/public/legal/documents": {
		output: envelope(z.object({ current: z.array(LegalDoc), upcoming: z.array(LegalDoc) })),
	},
	"@get/platform/legal/me": { output: envelope(MyLegal) },
	"@post/platform/legal/accept": { input: AcceptLegalInput, output: envelope(MyLegal) },
	"@get/platform/owner/legal/acceptances": { output: envelope(z.array(LegalRecord)) },
	"@get/platform/admin/legal/acceptances": {
		query: z.object({ businessId: z.string() }),
		output: envelope(z.array(LegalRecord)),
	},
	"@post/platform/admin/legal/businesses/:businessId/links-shared": {
		params: z.object({ businessId: z.string() }),
		input: LinksSharedInput,
		output: envelope(z.array(LegalRecord)),
	},
	"@get/platform/admin/legal/documents": { output: envelope(z.array(LegalVersion)) },
	"@post/platform/admin/legal/documents": { input: PublishLegalInput, output: envelope(LegalVersion) },
	"@post/platform/owner/devices/:id/accept-terms": {
		params: z.object({ id: z.string() }),
		input: z.object({ version: z.string().optional() }),
		output: envelope(z.object({ id: z.string(), termsAcceptedAt: str, termsVersion: str })),
	},
} as const;
