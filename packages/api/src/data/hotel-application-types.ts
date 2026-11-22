/**
 * "Book a demo" requests as the admin portal reads them (Hotel applications, hospio-backend docs/onboarding.md "Applications").
 * Types only, so client components can import them.
 */

export type HotelApplicationStatus =
	| "NEW"
	| "CONTACTED"
	| "MEETING_BOOKED"
	| "APPROVED"
	| "ONBOARDED"
	| "DECLINED";

export const HOTEL_APPLICATION_STATUSES: {
	value: HotelApplicationStatus;
	label: string;
}[] = [
	{ value: "NEW", label: "New" },
	{ value: "CONTACTED", label: "Contacted" },
	{ value: "MEETING_BOOKED", label: "Meeting booked" },
	{ value: "APPROVED", label: "Approved" },
	{ value: "ONBOARDED", label: "Onboarded" },
	{ value: "DECLINED", label: "Declined" },
];

export const APPLICATION_TYPES: Record<string, string> = {
	HOTEL: "Hotel",
	LOUNGE: "Lounge",
	BAR: "Bar",
	RESTAURANT: "Restaurant",
	MIXED: "Mixed",
};

export const HEARD_FROM_LABELS: Record<string, string> = {
	SEARCH: "Search (Google)",
	SOCIAL: "Social media",
	FRIEND: "A friend or another business",
	MARKETER: "A Hospio360 partner",
	EVENT: "An event",
	OTHER: "Other",
};

/**
 * "Average monthly sales" from the Book a demo form, highest band first (the order the list sorts by).
 * Information for the call only. Requests sent before 21 Nov 2026 have none: "Not asked".
 */
export const MONTHLY_SALES_BANDS: { value: string; label: string }[] = [
	{ value: "ABOVE_20M", label: "Above ₦20 million" },
	{ value: "FROM_5M_TO_20M", label: "₦5 million – ₦20 million" },
	{ value: "FROM_1M_TO_5M", label: "₦1 million – ₦5 million" },
	{ value: "UNDER_1M", label: "Under ₦1 million" },
	{ value: "PREFER_NOT", label: "Prefer not to say" },
];
/** The list filter for requests sent before the question existed. */
export const MONTHLY_SALES_NOT_ASKED = "NOT_ASKED";
export const monthlySalesLabel = (code?: string) =>
	(code && MONTHLY_SALES_BANDS.find((b) => b.value === code)?.label) || "Not asked";
/** The list's sort: highest band first, Prefer not to say then Not asked last (the server's SALES order). */
export const monthlySalesRank = (code?: string) => {
	const i = MONTHLY_SALES_BANDS.findIndex((b) => b.value === code);
	return i < 0 ? MONTHLY_SALES_BANDS.length : i;
};

export const CALL_TIME_LABELS: Record<string, string> = {
	MORNING: "Morning (9am–12pm)",
	AFTERNOON: "Afternoon (12pm–4pm)",
	EVENING: "Evening (4pm–6pm)",
	ANYTIME: "Any time",
};

export type HotelApplicationNoteRow = {
	id: string;
	/** NOTE (a person wrote it), STATUS (a status change) or SYSTEM (assignee, meeting, a repeat from the website). */
	kind: "NOTE" | "STATUS" | "SYSTEM";
	body: string;
	authorName: string;
	createdAt: string;
};

/** "City, State", either alone, or "" when neither was given (both optional on the short form, 22 Nov 2026). */
export const applicationPlace = (a: { city: string; state: string }) =>
	[a.city, a.state].filter((s) => s?.trim()).join(", ");

export type HotelApplicationRow = {
	id: string;
	ownerName: string;
	/** "" when not given (optional since the short form, 22 Nov 2026). */
	email: string;
	phone: string;
	businessName: string;
	/** HOTEL, LOUNGE, BAR, RESTAURANT or MIXED. */
	businessType: string;
	/** "" when not given. */
	city: string;
	/** "" when not given. */
	state: string;
	rooms?: number;
	/** A MONTHLY_SALES_BANDS code; undefined when the request came before the question ("Not asked"). */
	monthlySales?: string;
	heardFrom?: string;
	preferredTime?: string;
	message?: string;
	referralCode?: string;
	marketerProfileId?: string;
	marketerName?: string;
	status: HotelApplicationStatus;
	statusChangedAt?: string;
	assigneeId?: string;
	assigneeName?: string;
	meetingAt?: string;
	declineReason?: string;
	businessId?: string;
	linkedBusinessName?: string;
	onboardedAt?: string;
	createdAt: string;
	ip?: string;
	userAgent?: string;
	/** Only on the detail; empty in the list. */
	notes: HotelApplicationNoteRow[];
};

export type HotelApplicationPermissions = {
	/** Super admin and Support work the requests. */
	canUpdate: boolean;
	/** Declining follows the partner-application rule: super admin and Support. */
	canDecline: boolean;
};

export const applicationTypeLabel = (t: string) => APPLICATION_TYPES[t] ?? t;
export const applicationStatusLabel = (s: string) =>
	HOTEL_APPLICATION_STATUSES.find((x) => x.value === s)?.label ?? s;
/** The business kind the "Set up a business" panel takes: the same five kinds (hotel when unknown). */
export const venueKindOf = (t: string): "HOTEL" | "LOUNGE" | "BAR" | "RESTAURANT" | "MIXED" =>
	t === "LOUNGE" || t === "BAR" || t === "RESTAURANT" || t === "MIXED" ? t : "HOTEL";
