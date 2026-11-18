/**
 * Venue types (hospio-backend docs/plan-venue-type.md). A location (tenant-service's hotel) is a HOTEL, LOUNGE, BAR, RESTAURANT or
 * CLUB; the business has a kind (the same, or MIXED) that only defaults its new locations. Screens gate on the capability,
 * `hasAccommodation`, never on the label: a lounge that adds rooms gets rooms, bookings, folios and charge-to-room.
 */

export const VENUE_TYPES = ["HOTEL", "LOUNGE", "BAR", "RESTAURANT", "CLUB"] as const;
export type VenueTypeKey = (typeof VENUE_TYPES)[number];

export const BUSINESS_KINDS = [...VENUE_TYPES, "MIXED"] as const;
export type BusinessKindKey = (typeof BUSINESS_KINDS)[number];

export const VENUE_LABEL: Record<VenueTypeKey, string> = {
	HOTEL: "Hotel",
	LOUNGE: "Lounge",
	BAR: "Bar",
	RESTAURANT: "Restaurant",
	CLUB: "Club",
};

/** "What kind of business?" in both wizards. */
export const BUSINESS_KIND_OPTIONS: { value: BusinessKindKey; label: string; hint: string }[] = [
	{ value: "HOTEL", label: "Hotel", hint: "Rooms and stays, with a restaurant or bar if you have one" },
	{ value: "LOUNGE", label: "Lounge", hint: "Drinks, food and tabs; no rooms" },
	{ value: "BAR", label: "Bar", hint: "Drinks and tabs; no rooms" },
	{ value: "RESTAURANT", label: "Restaurant", hint: "Tables, kitchen and bar; no rooms" },
	{ value: "MIXED", label: "Mixed", hint: "For example a hotel and a lounge: pick the kind for each location" },
];

export const VENUE_TYPE_OPTIONS = VENUE_TYPES.map((v) => ({ value: v, label: VENUE_LABEL[v] }));

export function venueType(value: string | null | undefined): VenueTypeKey {
	const v = (value ?? "").toUpperCase();
	return (VENUE_TYPES as readonly string[]).includes(v) ? (v as VenueTypeKey) : "HOTEL";
}

export function businessKind(value: string | null | undefined): BusinessKindKey {
	const v = (value ?? "").toUpperCase();
	return (BUSINESS_KINDS as readonly string[]).includes(v) ? (v as BusinessKindKey) : "HOTEL";
}

/** The type a new location starts with in a business of this kind (MIXED starts as a hotel; the type is picked per location). */
export function defaultVenueFor(kind: string | null | undefined): VenueTypeKey {
	const k = businessKind(kind);
	return k === "MIXED" ? "HOTEL" : k;
}

type HasVenue = {
	venueType?: string | null;
	hasAccommodation?: boolean | null;
	roomCount?: number | null;
	rooms?: number | null;
};

/**
 * The accommodation capability: the server's `hasAccommodation` when it sent one, else a hotel or any location with rooms. No
 * location (a platform screen, demo data) counts as a hotel, so nothing hides by accident.
 */
export function hasAccommodation(h: HasVenue | null | undefined): boolean {
	if (!h) return true;
	if (typeof h.hasAccommodation === "boolean") return h.hasAccommodation;
	return venueType(h.venueType) === "HOTEL" || (h.roomCount ?? h.rooms ?? 0) > 0;
}

export function venueLabel(value: string | null | undefined): string {
	return VENUE_LABEL[venueType(value)];
}

/** "a lounge", "a restaurant": for "Not used at a lounge". */
export function venueNoun(h: HasVenue | null | undefined): string {
	const t = venueType(h?.venueType);
	if (t === "HOTEL") return "this location";
	return `a ${VENUE_LABEL[t].toLowerCase()}`;
}

/** Whether a business of this kind starts its locations without accommodation (the wizards skip rooms and check-in times). */
export function kindHasRooms(kind: string | null | undefined): boolean {
	return defaultVenueFor(kind) === "HOTEL";
}
