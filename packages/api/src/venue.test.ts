import { describe, expect, test } from "bun:test";
import {
	adaptText,
	businessWording,
	defaultVenueFor,
	hasAccommodation,
	HOTEL_WORDING,
	kindHasRooms,
	LOCATION_WORDING,
	venueNoun,
	venueType,
	wording,
} from "./venue";
import { isStayOnlyPath } from "../../ui/src/links";

describe("venue types (hospio-backend docs/plan-venue-type.md)", () => {
	test("accommodation follows the server, else a hotel or any rooms", () => {
		expect(hasAccommodation({ venueType: "LOUNGE", hasAccommodation: false })).toBe(false);
		expect(hasAccommodation({ venueType: "LOUNGE", roomCount: 0 })).toBe(false);
		expect(hasAccommodation({ venueType: "LOUNGE", roomCount: 4 })).toBe(true);
		expect(hasAccommodation({ venueType: null, roomCount: 0 })).toBe(true);
		expect(hasAccommodation(null)).toBe(true);
	});
	test("a business kind sets the first location's type", () => {
		expect(defaultVenueFor("RESTAURANT")).toBe("RESTAURANT");
		expect(defaultVenueFor("MIXED")).toBe("HOTEL");
		expect(defaultVenueFor(undefined)).toBe("HOTEL");
		expect(kindHasRooms("LOUNGE")).toBe(false);
		expect(venueType("spaceship")).toBe("HOTEL");
		expect(venueNoun({ venueType: "LOUNGE" })).toBe("a lounge");
	});
	test("stay-only pages per role", () => {
		expect(isStayOnlyPath("MANAGER", "/dashboard/bookings/new")).toBe(true);
		expect(isStayOnlyPath("MANAGER", "/dashboard/night-audit")).toBe(false);
		expect(isStayOnlyPath("OWNER", "/dashboard/bookings")).toBe(true);
		expect(isStayOnlyPath("FRONT_OFFICE", "/dashboard")).toBe(true);
		expect(isStayOnlyPath("FRONT_OFFICE", "/dashboard/inbox")).toBe(false);
		expect(isStayOnlyPath("BAR", "/dashboard/tabs")).toBe(false);
		expect(isStayOnlyPath("MAINTENANCE", "/dashboard/rooms")).toBe(true);
	});
	test("wording: a hotel reads its text untouched, a lounge its own word (phase 5)", () => {
		const lounge = wording({ venueType: "LOUNGE" });
		const hotel = wording({ venueType: "HOTEL" });
		const text = "Remove from hotel · set in Hotel setup → Money · your hotels";
		expect(adaptText(text, hotel)).toBe(text);
		expect(adaptText(text, wording(null))).toBe(text);
		expect(adaptText(text, lounge)).toBe("Remove from lounge · set in Lounge setup → Money · your lounges");
		expect(adaptText("Hotel basics", wording({ venueType: "RESTAURANT" }))).toBe("Restaurant basics");
		// Never an address, an email, a placeholder or someone staying in a room.
		expect(adaptText("/dashboard/hotel-setup name@hotel.com {{hotel}} @hotel hotel-config Hotel guest", lounge)).toBe(
			"/dashboard/hotel-setup name@hotel.com {{hotel}} @hotel hotel-config Hotel guest",
		);
	});
	test("wording: the business says hotels only while every location is one; the setup keeps the active location's name", () => {
		expect(businessWording([{ venueType: "HOTEL" }, { venueType: null }])).toBe(HOTEL_WORDING);
		expect(businessWording([{ venueType: "HOTEL" }, { venueType: "LOUNGE" }])).toBe(LOCATION_WORDING);
		expect(businessWording([], "LOUNGE")).toBe(LOCATION_WORDING);
		expect(businessWording([], undefined)).toBe(HOTEL_WORDING);
		// A mixed business with its hotel chosen: "All locations", but still "Hotel setup".
		expect(adaptText("All hotels · Hotel setup", LOCATION_WORDING, "Hotel setup")).toBe("All locations · Hotel setup");
		expect(adaptText("All hotels · Hotel setup", LOCATION_WORDING, "Lounge setup")).toBe("All locations · Lounge setup");
		expect(adaptText("Hotels", HOTEL_WORDING, "Hotel setup")).toBe("Hotels");
	});
});
