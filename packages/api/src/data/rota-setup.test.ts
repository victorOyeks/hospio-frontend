import { describe, expect, test } from "bun:test";
import {
	BUILT_IN_SHIFTS,
	checkEntry,
	departmentFor,
	parseDepartment,
	parseShift,
	shiftsSentence,
	toRotaSetup,
} from "./rota-setup";

describe("shifts", () => {
	test("the ways a manager writes a shift", () => {
		expect(parseShift("Early 07:00–15:00")).toEqual({ name: "Early", starts: "07:00", ends: "15:00" });
		expect(parseShift("Morning (07:00-15:00)")).toEqual({ name: "Morning", starts: "07:00", ends: "15:00" });
		expect(parseShift("Late 7:30 to 16:00")).toEqual({ name: "Late", starts: "07:30", ends: "16:00" });
		expect(parseShift("Night 2300-0700")).toEqual({ name: "Night", starts: "23:00", ends: "07:00" });
		expect(parseShift("Double shift 06:00 - 22:00")).toEqual({ name: "Double shift", starts: "06:00", ends: "22:00" });
	});
	test("what is refused", () => {
		expect(parseShift("Morning")).toBeNull();
		expect(parseShift("Early 25:00-15:00")).toBeNull();
		expect(parseShift("Same 07:00-07:00")).toBeNull();
		expect(checkEntry("shift", "Morning", [])).toHaveProperty("error");
		expect(checkEntry("shift", "early 08:00-16:00", ["Early 07:00–15:00"])).toEqual({ error: "There is already a shift called early" });
		expect(checkEntry("shift", "Early (7:00-15:00)", [])).toEqual({ label: "Early 07:00–15:00" });
	});
	test("an empty or unreadable list falls back to the built-in three", () => {
		expect(toRotaSetup([], []).shifts).toEqual(BUILT_IN_SHIFTS);
		expect(toRotaSetup(["rubbish"], []).customShifts).toBe(false);
		expect(toRotaSetup(["Early 07:00–15:00"], []).shifts).toHaveLength(1);
		expect(shiftsSentence([{ name: "Night", starts: "22:00", ends: "06:00" }])).toBe("Night 10pm–6am (ends the next morning)");
	});
});

describe("departments", () => {
	test("a name and roles, or a bare role", () => {
		expect(parseDepartment("Food & drink: Kitchen, Bar")).toEqual({ name: "Food & drink", roles: ["KITCHEN", "BAR"] });
		expect(parseDepartment("Rooms: Housekeeping and Laundry")).toEqual({ name: "Rooms", roles: ["HOUSEKEEPING", "LAUNDRY"] });
		expect(parseDepartment("Housekeeping")).toEqual({ name: "Housekeeping", roles: ["HOUSEKEEPING"] });
		expect(parseDepartment("Food & drink")).toBeNull();
		expect(parseDepartment("Food: Kitchen, Chefs")).toBeNull();
	});
	test("a role sits in one department and a name is used once", () => {
		expect(checkEntry("department", "Drinks: Bar", ["Food & drink: Kitchen, Bar"])).toEqual({ error: "Bar is already in Food & drink" });
		expect(checkEntry("department", "food & drink: Laundry", ["Food & drink: Kitchen, Bar"])).toHaveProperty("error");
		expect(checkEntry("department", "rooms: housekeeping + laundry", [])).toEqual({ label: "rooms: Housekeeping, Laundry" });
	});
	test("the rota heading: the hotel's departments first, then the built-in ones", () => {
		const setup = toRotaSetup([], ["Food & drink: Kitchen, Bar", "Rooms: Housekeeping, Laundry"]);
		expect(departmentFor(setup, "BAR")).toEqual({ name: "Food & drink", rank: 0 });
		expect(departmentFor(setup, "LAUNDRY")).toEqual({ name: "Rooms", rank: 1 });
		expect(departmentFor(setup, "FRONT_OFFICE").name).toBe("Front office");
		expect(departmentFor(setup, "FRONT_OFFICE").rank).toBeGreaterThan(1);
		expect(departmentFor(toRotaSetup([], []), "INVENTORY").name).toBe("Store");
	});
});
