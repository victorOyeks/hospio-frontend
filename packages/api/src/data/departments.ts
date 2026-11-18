import { readableSummary } from "./activity-labels";
import type { DepartmentLive } from "./types";

/**
 * Manager · Departments from live data: the last hour from platform-service's board (Redis, fed by every event),
 * who is clocked in and scheduled today from the finance rota, and each team's open work from its own service.
 * Nothing here is invented: a team with no source reads 0 and "nothing recorded", and a team the hotel does
 * not run (no rooms, no bar, nobody in the role) is marked `present: false` so the board leaves it out.
 */

/** The board's departments; the key is the hotel role, `board` is platform-service's department key. */
export const BOARD_DEPARTMENTS: {
	key: string;
	name: string;
	board: string;
	openLabel: [string, string];
	rooms?: boolean;
}[] = [
	{ key: "FRONT_OFFICE", name: "Front office", board: "FRONT_OFFICE", openLabel: ["arrival left", "arrivals left"], rooms: true },
	{ key: "HOUSEKEEPING", name: "Housekeeping", board: "HOUSEKEEPING", openLabel: ["room to clean", "rooms to clean"], rooms: true },
	{ key: "LAUNDRY", name: "Laundry", board: "LAUNDRY", openLabel: ["order in progress", "orders in progress"], rooms: true },
	{ key: "MAINTENANCE", name: "Maintenance", board: "MAINTENANCE", openLabel: ["open repair", "open repairs"] },
	{ key: "KITCHEN", name: "Kitchen", board: "KITCHEN", openLabel: ["order open", "orders open"] },
	{ key: "BAR", name: "Bar", board: "BAR", openLabel: ["tab or sale open", "tabs and sales open"] },
	{ key: "INVENTORY", name: "Store", board: "STORE", openLabel: ["request waiting", "requests waiting"] },
	{ key: "FINANCE", name: "Finance", board: "FINANCE", openLabel: ["till open", "tills open"] },
];

/** Teams whose open work is something to act on (the rest is the normal flow: orders cooking, tills open). */
const ATTENTION = new Set(["HOUSEKEEPING", "MAINTENANCE", "INVENTORY"]);

export type DepartmentInputs = {
	board: Record<string, { actionsLastHour: number; lastAt?: string | null; lastAction?: string | null }> | null;
	/** Today's clock entries: in now = clockIn and no clockOut. */
	clock: { userId?: string | null; clockIn?: string | null; clockOut?: string | null }[];
	/** Today's rota (cancelled shifts left out by the caller). */
	shifts: { userId: string; role: string }[];
	/** The hotel's people and their roles (a person clocked in without a shift counts for their role). */
	staff: { userId?: string; role: string; status?: string }[];
	hasRooms: boolean;
	outletKinds: string[];
	/** Open work per board key; an urgent/overdue count makes Maintenance urgent. */
	open: Record<string, number>;
	urgentRepairs: number;
};

export function buildDepartments(x: DepartmentInputs): DepartmentLive[] {
	const staffRoles = new Map<string, Set<string>>();
	for (const s of x.staff) {
		if (!s.userId) continue;
		const set = staffRoles.get(s.userId) ?? new Set<string>();
		set.add(s.role);
		staffRoles.set(s.userId, set);
	}
	const shiftRoles = new Map<string, Set<string>>();
	for (const s of x.shifts) {
		const set = shiftRoles.get(s.userId) ?? new Set<string>();
		set.add(s.role);
		shiftRoles.set(s.userId, set);
	}
	const inNow = x.clock.filter((e) => e.userId && e.clockIn && !e.clockOut);
	const hasKitchen = x.outletKinds.some((k) => k !== "BAR");
	const hasBar = x.outletKinds.includes("BAR");
	return BOARD_DEPARTMENTS.map((d) => {
		const b = x.board?.[d.board];
		const actions = b?.actionsLastHour ?? 0;
		const open = x.open[d.key] ?? 0;
		// Their shift's role first; someone clocked in with no shift today counts for the role they hold.
		const onShift = inNow.filter((e) => {
			const roles = shiftRoles.get(e.userId as string) ?? staffRoles.get(e.userId as string);
			return roles?.has(d.key) ?? false;
		}).length;
		const scheduled = x.shifts.filter((s) => s.role === d.key).length;
		const people = x.staff.filter((s) => s.role === d.key && s.status !== "SUSPENDED").length;
		const runs =
			people > 0 ||
			scheduled > 0 ||
			open > 0 ||
			actions > 0 ||
			(d.rooms ? x.hasRooms : d.key === "KITCHEN" ? hasKitchen : d.key === "BAR" ? hasBar : false);
		const tone: DepartmentLive["tone"] =
			d.key === "MAINTENANCE" && x.urgentRepairs > 0
				? "danger"
				: ATTENTION.has(d.key) && open > 0
					? "warning"
					: actions > 0 || onShift > 0 || open > 0
						? "success"
						: "grey";
		return {
			key: d.key,
			name: d.name,
			onShift,
			scheduled,
			actionsLastHour: actions,
			lastAction: b?.lastAction ? readableSummary(b.lastAction) : "",
			lastAt: b?.lastAt ?? "",
			open,
			openLabel: open === 1 ? d.openLabel[0] : d.openLabel[1],
			tone,
			present: runs,
		};
	});
}
