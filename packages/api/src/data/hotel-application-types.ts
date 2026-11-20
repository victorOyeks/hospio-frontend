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

export type HotelApplicationRow = {
	id: string;
	ownerName: string;
	email: string;
	phone: string;
	businessName: string;
	/** HOTEL, LOUNGE, BAR, RESTAURANT or MIXED. */
	businessType: string;
	city: string;
	state: string;
	rooms?: number;
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
