import { describe, expect, test } from "bun:test";
import { defaultVenueFor, hasAccommodation, kindHasRooms, venueNoun, venueType } from "./venue";
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
});
