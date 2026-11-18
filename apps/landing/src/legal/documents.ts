import { z } from "zod";
import raw from "./documents.json";

/**
 * The published Hospio360 legal documents (Oyeks Global Limited). The text lives in documents.json, exactly as supplied
 * for this version; it is checked against this schema when the module loads, so a malformed file fails the build rather
 * than a page. Paragraph text is plain text in which **double asterisks** mark bold; it is always rendered as text.
 */

export const LEGAL_SLUGS = [
	"terms",
	"privacy",
	"data-processing",
	"fees",
	"devices",
	"support",
	"referral-partners",
	"staff-terms",
] as const;

export const LegalSlug = z.enum(LEGAL_SLUGS);
export type LegalSlug = z.infer<typeof LegalSlug>;

export const LegalSection = z.object({
	heading: z.string().min(1),
	paragraphs: z.array(z.string()),
});
export type LegalSection = z.infer<typeof LegalSection>;

export const LegalDocument = z.object({
	slug: LegalSlug,
	title: z.string().min(1),
	version: z.string().min(1),
	effectiveDate: z.iso.date(),
	summary: z.string().min(1),
	sections: z.array(LegalSection).min(1),
});
export type LegalDocument = z.infer<typeof LegalDocument>;

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = z
	.array(LegalDocument)
	.parse(raw);

export function getLegalDocument(slug: string): LegalDocument | undefined {
	return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}

/** The legal entity line shown on every legal page, with the location (REGISTERED_OFFICE in components/site.tsx). */
export const LEGAL_ENTITY = "Oyeks Global Ltd (RC 10001123), Lagos, Nigeria";
export const LEGAL_EMAIL = "hello@oyeksglobal.com";

/** "2026-11-18" → "18 November 2026", without time-zone drift. */
export function formatLegalDate(isoDate: string): string {
	const [y, m, d] = isoDate.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

/** A stable anchor id for a section heading ("5. Fees and payment" → "fees-and-payment"). */
export function sectionId(heading: string): string {
	return heading
		.toLowerCase()
		.replace(/^\d+\.\s*/, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
