import { z } from "zod";

/**
 * "Apply to be a partner" (hospio-backend docs/plan-marketers.md): what the form collects, checked here before it is sent
 * and again by platform-service, which has the last word.
 */

export const BUSINESS_KINDS = [
	{ value: "HOTEL", label: "Hotels" },
	{ value: "LOUNGE", label: "Lounges" },
	{ value: "BAR", label: "Bars" },
	{ value: "RESTAURANT", label: "Restaurants" },
] as const;

export const BUSINESS_COUNTS = [
	{ value: "1-2", label: "1–2" },
	{ value: "3-5", label: "3–5" },
	{ value: "6-10", label: "6–10" },
	{ value: "10+", label: "10+" },
] as const;

/** The 36 states and the FCT. */
export const STATES = [
	"Abia",
	"Adamawa",
	"Akwa Ibom",
	"Anambra",
	"Bauchi",
	"Bayelsa",
	"Benue",
	"Borno",
	"Cross River",
	"Delta",
	"Ebonyi",
	"Edo",
	"Ekiti",
	"Enugu",
	"FCT",
	"Gombe",
	"Imo",
	"Jigawa",
	"Kaduna",
	"Kano",
	"Katsina",
	"Kebbi",
	"Kogi",
	"Kwara",
	"Lagos",
	"Nasarawa",
	"Niger",
	"Ogun",
	"Ondo",
	"Osun",
	"Oyo",
	"Plateau",
	"Rivers",
	"Sokoto",
	"Taraba",
	"Yobe",
	"Zamfara",
] as const;

export const NOTE_MAX = 500;

/** A Nigerian mobile number as people write it: 0803 555 0192, 803 555 0192, 234 803… or +234 803…. */
export function isNigerianPhone(raw: string): boolean {
	const t = raw.trim();
	if (!/^\+?[0-9 ()-]+$/.test(t)) return false;
	const digits = t.replace(/\D/g, "");
	return /^(?:234|0)?[789][01]\d{8}$/.test(digits);
}

export const PartnerApplication = z.object({
	fullName: z
		.string()
		.trim()
		.min(1, "Enter your full name")
		.max(150, "Keep your name to 150 characters")
		.regex(/^[\p{L}\p{M} .'’-]{2,}$/u, "Enter your name using letters only"),
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address")
		.max(255, "That email is too long")
		.regex(
			/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,24}$/,
			"Enter a real email address, like ada@example.com",
		),
	phone: z
		.string()
		.trim()
		.min(1, "Enter your phone number")
		.refine(
			isNigerianPhone,
			"Enter a Nigerian phone number, like 0803 555 0192 or +234 803 555 0192",
		),
	city: z
		.string()
		.trim()
		.min(1, "Enter your city")
		.max(100, "Keep the city to 100 characters")
		.regex(/^[\p{L}\p{M}0-9 .,'’()/-]{2,}$/u, "Enter the name of your city"),
	state: z.enum(STATES, "Choose your state"),
	businessKinds: z
		.array(z.enum(BUSINESS_KINDS.map((k) => k.value)))
		.min(1, "Tick at least one kind of business you know"),
	businessCount: z.enum(
		BUSINESS_COUNTS.map((c) => c.value),
		"Choose roughly how many businesses you know",
	),
	networkNote: z
		.string()
		.trim()
		.max(NOTE_MAX, `Keep it to ${NOTE_MAX} characters`)
		.optional(),
	companyName: z
		.string()
		.trim()
		.max(150, "Keep the company name to 150 characters")
		.optional(),
	acceptedTerms: z.literal(
		true,
		"Tick the box to say you have read the Referral partner terms and the Privacy Policy",
	),
	/** The hidden field: people never fill it. */
	website: z.string().max(200).optional(),
});
export type PartnerApplication = z.infer<typeof PartnerApplication>;

export type PartnerField = keyof PartnerApplication;
export type FieldErrors = Partial<Record<PartnerField, string>>;

/** The first message per field from a failed check. */
export function fieldErrors(error: z.ZodError): FieldErrors {
	const out: FieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0] as PartnerField | undefined;
		if (field && !out[field]) out[field] = issue.message;
	}
	return out;
}

export type SubmitResult =
	| { ok: true; message: string }
	| { ok: false; error: string; fields?: FieldErrors };

export const RECEIVED_MESSAGE =
	"Thanks — we'll review and email you within 2 working days.";
