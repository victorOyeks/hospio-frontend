import { z } from "zod";
import { isNigerianPhone, STATES } from "@/partners/schema";

/**
 * "Book a demo" (hospio-backend docs/onboarding.md, "Applications"): what the form collects, checked here before it is sent and
 * again by platform-service, which has the last word. Self sign-up is off; the team calls, meets and onboards the business.
 */

export const BUSINESS_TYPES = [
	{ value: "HOTEL", label: "Hotel" },
	{ value: "LOUNGE", label: "Lounge" },
	{ value: "BAR", label: "Bar" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "MIXED", label: "Mixed" },
] as const;

/** The types with accommodation: only these are asked for a number of rooms. */
export const WITH_ROOMS: readonly string[] = ["HOTEL", "MIXED"];

export const HEARD_FROM = [
	{ value: "SEARCH", label: "Search (Google)" },
	{ value: "SOCIAL", label: "Social media" },
	{ value: "FRIEND", label: "A friend or another business" },
	{ value: "MARKETER", label: "A Hospio360 partner" },
	{ value: "EVENT", label: "An event" },
	{ value: "OTHER", label: "Other" },
] as const;

/**
 * "Average monthly sales": required, information for the call only (nothing is scored on it). The words
 * are platform-service's (MonthlySales) and the admin portal's.
 */
export const MONTHLY_SALES = [
	{ value: "UNDER_1M", label: "Under ₦1 million" },
	{ value: "FROM_1M_TO_5M", label: "₦1 million – ₦5 million" },
	{ value: "FROM_5M_TO_20M", label: "₦5 million – ₦20 million" },
	{ value: "ABOVE_20M", label: "Above ₦20 million" },
	{ value: "PREFER_NOT", label: "Prefer not to say" },
] as const;

export const CALL_TIMES = [
	{ value: "MORNING", label: "Morning (9am–12pm)" },
	{ value: "AFTERNOON", label: "Afternoon (12pm–4pm)" },
	{ value: "EVENING", label: "Evening (4pm–6pm)" },
	{ value: "ANYTIME", label: "Any time" },
] as const;

export { STATES };

export const MESSAGE_MAX = 1000;
export const MAX_ROOMS = 5000;

export const DemoRequest = z
	.object({
		ownerName: z
			.string()
			.trim()
			.min(1, "Enter your full name")
			.max(150, "Keep your name to 150 characters")
			.regex(/^[\p{L}\p{M} .'’-]{2,}$/u, "Enter your name using letters only"),
		phone: z
			.string()
			.trim()
			.min(1, "Enter your phone number")
			.refine(
				isNigerianPhone,
				"Enter a Nigerian phone number, like 0803 555 0192 or +234 803 555 0192",
			),
		email: z
			.string()
			.trim()
			.min(1, "Enter your email address")
			.max(255, "That email is too long")
			.regex(
				/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/,
				"Enter a real email address, like ada@example.com",
			),
		businessName: z
			.string()
			.trim()
			.min(1, "Enter your business name")
			.max(150, "Keep the business name to 150 characters")
			.regex(
				/^[\p{L}\p{M}0-9 .,&'’()/@+-]{2,}$/u,
				"Enter the business name (letters, numbers and . , & ' ( ) only)",
			)
			.refine((v) => /\p{L}/u.test(v), "Enter the business name"),
		businessType: z.enum(
			BUSINESS_TYPES.map((t) => t.value),
			"Choose what kind of business it is",
		),
		city: z
			.string()
			.trim()
			.min(1, "Enter your city")
			.max(100, "Keep the city to 100 characters")
			.regex(/^[\p{L}\p{M}0-9 .,'’()/-]{2,}$/u, "Enter the name of your city"),
		state: z.enum(STATES, "Choose your state"),
		rooms: z
			.number()
			.int("Enter a whole number of rooms")
			.min(1, "Enter the number of rooms, or leave it empty")
			.max(MAX_ROOMS, `Enter up to ${MAX_ROOMS} rooms`)
			.optional(),
		monthlySales: z.enum(
			MONTHLY_SALES.map((m) => m.value),
			"Choose your average monthly sales (an estimate is fine)",
		),
		heardFrom: z.enum(
			HEARD_FROM.map((h) => h.value),
			"Tell us how you heard about Hospio360",
		),
		preferredTime: z.enum(CALL_TIMES.map((t) => t.value)).optional(),
		message: z
			.string()
			.trim()
			.max(MESSAGE_MAX, `Keep the message to ${MESSAGE_MAX} characters`)
			.optional(),
		/** A marketer's code from the link (?ref=). */
		referralCode: z.string().trim().max(20).optional(),
		/** The hidden field: people never fill it. */
		website: z.string().max(200).optional(),
	})
	// Rooms are only for a business with accommodation; the server drops them otherwise too.
	.transform((v) => (WITH_ROOMS.includes(v.businessType) ? v : { ...v, rooms: undefined }));
export type DemoRequest = z.input<typeof DemoRequest>;

export type DemoField = keyof DemoRequest;
export type FieldErrors = Partial<Record<DemoField, string>>;

/** The first message per field from a failed check. */
export function fieldErrors(error: z.ZodError): FieldErrors {
	const out: FieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as DemoField | undefined;
		if (field && !out[field]) out[field] = issue.message;
	}
	return out;
}

export type SubmitResult =
	| { ok: true; message: string }
	| { ok: false; error: string; fields?: FieldErrors };

export const RECEIVED_MESSAGE =
	"Thanks — we've received your request. Our team will call you within 1 working day.";

/** A referral code as the API accepts it, or undefined. */
export function cleanRef(raw: string | string[] | undefined): string | undefined {
	const v = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase();
	return v && /^[A-Z0-9-]{3,20}$/.test(v) ? v : undefined;
}
