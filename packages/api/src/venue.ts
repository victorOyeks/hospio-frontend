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

/**
 * Wording (docs/plan-venue-type.md, phase 5): the words a screen uses for the place it is about. A hotel reads exactly what it
 * always read; a lounge, bar, restaurant or club reads its own noun; a business that is not hotels only reads "location(s)".
 * Mirrors hospio-backend `com.hospio.common.venue.VenueWording`. Plain data, so a server page can hand it to a client screen.
 */
export type Wording = {
	/** True when the words are the hotel ones: nothing is rewritten. */
	hotel: boolean;
	/** "hotel", "lounge", "bar", "restaurant", "club" or "location". */
	place: string;
	places: string;
	Place: string;
	Places: string;
	/** The settings area: "Hotel setup", "Lounge setup"…, or "Setup" for a whole business that is not hotels only. */
	setup: string;
};

function words(noun: string, hotel: boolean, setup?: string): Wording {
	const Place = noun.charAt(0).toUpperCase() + noun.slice(1);
	return { hotel, place: noun, places: `${noun}s`, Place, Places: `${Place}s`, setup: setup ?? `${Place} setup` };
}

export const HOTEL_WORDING: Wording = words("hotel", true);
export const LOCATION_WORDING: Wording = words("location", false, "Setup");

/** The words for one location (the active one). No location reads as a hotel, so nothing changes by accident. */
export function wording(h: HasVenue | null | undefined): Wording {
	const t = venueType(h?.venueType);
	return t === "HOTEL" ? HOTEL_WORDING : words(VENUE_LABEL[t].toLowerCase(), false);
}

/**
 * The words for a whole business: "hotel(s)" while every location is a hotel (and the kind, when known, is Hotel), otherwise
 * "location(s)".
 */
export function businessWording(
	locations: readonly HasVenue[] | null | undefined,
	kind?: string | null,
): Wording {
	const list = locations ?? [];
	if (list.length > 0) return list.every((h) => venueType(h.venueType) === "HOTEL") ? HOTEL_WORDING : LOCATION_WORDING;
	return kind == null || kind === "" || businessKind(kind) === "HOTEL" ? HOTEL_WORDING : LOCATION_WORDING;
}

// "hotel" as a word of our own copy: never inside an address (/hotel-owner, hotel-setup), an email (name@hotel.com) or a
// message placeholder ({{hotel}}, @hotel).
// Also never "hotel guest": that is someone staying in a room, which only a hotel has.
const HOTEL_WORD = /(?<![\w/@{.-])([Hh])otel(s?)(?![\w-]| guests?\b)/g;

/**
 * Rewrites the hotel words of a piece of OUR OWN copy (a label, a hint, a help step) for these words. Hotel wording comes back
 * untouched. Never pass text that holds a name someone typed (a location called "Palm Hotel Bar" must stay as typed): adapt the
 * fixed part and join the name after.
 * `setup` names the settings area when it differs from `w.setup` (business-level copy still opens the active location's setup).
 */
export function adaptText(text: string, w: Wording, setup?: string): string {
	const area = setup ?? w.setup;
	if (w.hotel && area === "Hotel setup") return text;
	// The setup's name is put in last, so "Hotel setup" at a mixed business's hotel is not reworded to "Location setup".
	let out = text.replace(/\bHotel setup\b/g, "\u0001").replace(/\bhotel setup\b/g, "\u0002");
	if (!w.hotel)
		out = out.replace(HOTEL_WORD, (_m, h: string, s: string) =>
			h === "H" ? (s ? w.Places : w.Place) : s ? w.places : w.place,
		);
	return out.replaceAll("\u0001", area).replaceAll("\u0002", area.toLowerCase());
}
