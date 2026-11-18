/**
 * Hotel setup → Staff & shifts: the hotel's own shifts and departments, kept as plain labels in the SHIFTS and
 * DEPARTMENTS lists (hotel-config) and read here for the rota.
 *
 * - A shift is a name and times: "Early 07:00–15:00" (also "Early (07:00-15:00)", "Early 7:00 to 15:00"). An end before
 *   the start runs into the next morning.
 * - A department is a name and the roles in it: "Food & drink: Kitchen, Bar". A bare role name ("Housekeeping") is a
 *   department of that one role.
 *
 * With no valid shift the built-in Morning, Afternoon and Night are offered; roles in no department keep their own
 * heading. Pure: used on the server (the rota page) and in the browser (the setup page checks each entry as it is added).
 */

export type ShiftPreset = { name: string; starts: string; ends: string };
export type DepartmentDef = { name: string; roles: string[] };
export type RotaSetup = {
	shifts: ShiftPreset[];
	/** True when the shifts are the hotel's own, not the built-in three. */
	customShifts: boolean;
	departments: DepartmentDef[];
};

export const BUILT_IN_SHIFTS: ShiftPreset[] = [
	{ name: "Morning", starts: "06:00", ends: "14:00" },
	{ name: "Afternoon", starts: "14:00", ends: "22:00" },
	{ name: "Night", starts: "22:00", ends: "06:00" },
];

export const BUILT_IN_ROTA: RotaSetup = {
	shifts: BUILT_IN_SHIFTS,
	customShifts: false,
	departments: [],
};

/** The heading each role has on the rota when no department of the hotel's names it. */
export const DEFAULT_DEPARTMENT: Record<string, string> = {
	OWNER: "Management",
	MANAGER: "Management",
	FRONT_OFFICE: "Front office",
	HOUSEKEEPING: "Housekeeping",
	LAUNDRY: "Laundry",
	MAINTENANCE: "Maintenance",
	KITCHEN: "Kitchen",
	BAR: "Bar",
	WAITER: "Service",
	CASHIER: "Cashier",
	INVENTORY: "Store",
	FINANCE: "Finance",
};

/** The words a manager may use for each role in a department entry. */
const ROLE_WORDS: Record<string, string> = {
	management: "MANAGER",
	manager: "MANAGER",
	managers: "MANAGER",
	"front office": "FRONT_OFFICE",
	"front desk": "FRONT_OFFICE",
	reception: "FRONT_OFFICE",
	housekeeping: "HOUSEKEEPING",
	laundry: "LAUNDRY",
	maintenance: "MAINTENANCE",
	kitchen: "KITCHEN",
	bar: "BAR",
	service: "WAITER",
	"service (waiters)": "WAITER",
	waiters: "WAITER",
	waiter: "WAITER",
	servers: "WAITER",
	cashier: "CASHIER",
	cashiers: "CASHIER",
	store: "INVENTORY",
	stores: "INVENTORY",
	inventory: "INVENTORY",
	finance: "FINANCE",
	accounts: "FINANCE",
};

/** The roles a department can hold, as the setup page offers them. */
export const ROLE_OPTIONS: { role: string; label: string }[] = [
	{ role: "MANAGER", label: "Management" },
	{ role: "FRONT_OFFICE", label: "Front office" },
	{ role: "HOUSEKEEPING", label: "Housekeeping" },
	{ role: "LAUNDRY", label: "Laundry" },
	{ role: "MAINTENANCE", label: "Maintenance" },
	{ role: "KITCHEN", label: "Kitchen" },
	{ role: "BAR", label: "Bar" },
	{ role: "WAITER", label: "Service (waiters)" },
	{ role: "CASHIER", label: "Cashier" },
	{ role: "INVENTORY", label: "Store" },
	{ role: "FINANCE", label: "Finance" },
];

export const ROLE_WORD_HINT =
	"Management, Front office, Housekeeping, Laundry, Maintenance, Kitchen, Bar, Store, Finance";

const TIME = String.raw`(\d{1,2})(?::?(\d{2}))`;
const SHIFT_RE = new RegExp(
	String.raw`^(.+?)\s*\(?\s*${TIME}\s*(?:-|–|—|to)\s*${TIME}\s*\)?$`,
	"i",
);

const hm = (h: string, m: string | undefined) => {
	const hh = Number(h);
	const mm = Number(m ?? "0");
	if (hh > 23 || mm > 59) return null;
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export function parseShift(label: string): ShiftPreset | null {
	const m = SHIFT_RE.exec(label.trim());
	if (!m) return null;
	const name = m[1].trim().replace(/[\s:,-]+$/, "");
	const starts = hm(m[2], m[3]);
	const ends = hm(m[4], m[5]);
	if (!name || !starts || !ends || starts === ends) return null;
	return { name, starts, ends };
}

export const shiftLabel = (s: ShiftPreset) => `${s.name} ${s.starts}–${s.ends}`;

const roleOf = (word: string) =>
	ROLE_WORDS[word.trim().toLowerCase().replace(/\s+/g, " ")];

export function parseDepartment(label: string): DepartmentDef | null {
	const text = label.trim();
	const colon = text.indexOf(":");
	if (colon < 0) {
		const role = roleOf(text);
		return role ? { name: text, roles: [role] } : null;
	}
	const name = text.slice(0, colon).trim();
	const words = text
		.slice(colon + 1)
		.split(/,|\+|\/|&|\band\b/i)
		.map((w) => w.trim())
		.filter(Boolean);
	if (!name || words.length === 0) return null;
	const roles = words.map(roleOf);
	if (roles.some((r) => !r)) return null;
	return { name, roles: [...new Set(roles as string[])] };
}

export const departmentLabel = (d: DepartmentDef) => {
	const words = d.roles.map(
		(r) => ROLE_OPTIONS.find((o) => o.role === r)?.label ?? r.toLowerCase(),
	);
	return d.roles.length === 1 && roleOf(d.name) === d.roles[0]
		? d.name
		: `${d.name}: ${words.join(", ")}`;
};

/**
 * The setup page's check for a new entry: an error to show, or the tidied label to keep. `others` are the entries
 * already in the list (a role may sit in one department only; a name is used once).
 */
export function checkEntry(
	format: "shift" | "department",
	label: string,
	others: string[],
): { error: string } | { label: string } {
	if (format === "shift") {
		const s = parseShift(label);
		if (!s)
			return {
				error:
					"Write a name and the times, e.g. Early 07:00–15:00 (a night shift can end the next morning)",
			};
		if (
			others.some(
				(o) => parseShift(o)?.name.toLowerCase() === s.name.toLowerCase(),
			)
		)
			return { error: `There is already a shift called ${s.name}` };
		return { label: shiftLabel(s) };
	}
	const d = parseDepartment(label);
	if (!d)
		return {
			error: label.includes(":")
				? `After the colon list roles from: ${ROLE_WORD_HINT}`
				: `Write a name and its roles, e.g. Food & drink: Kitchen, Bar (roles: ${ROLE_WORD_HINT})`,
		};
	for (const o of others) {
		const od = parseDepartment(o);
		if (!od) continue;
		if (od.name.toLowerCase() === d.name.toLowerCase())
			return { error: `There is already a department called ${d.name}` };
		const clash = d.roles.find((r) => od.roles.includes(r));
		if (clash)
			return {
				error: `${departmentLabel({ name: "x", roles: [clash] }).replace(/^x: /, "")} is already in ${od.name}`,
			};
	}
	return { label: departmentLabel(d) };
}

/** The two lists (labels, in their order) → what the rota uses. Entries that don't read are left out. */
export function toRotaSetup(
	shiftLabels: string[],
	departmentLabels: string[],
): RotaSetup {
	const shifts = shiftLabels
		.map(parseShift)
		.filter((s): s is ShiftPreset => !!s);
	const seen = new Set<string>();
	const departments: DepartmentDef[] = [];
	for (const d of departmentLabels.map(parseDepartment)) {
		if (!d) continue;
		const roles = d.roles.filter((r) => !seen.has(r));
		for (const r of roles) seen.add(r);
		if (roles.length) departments.push({ name: d.name, roles });
	}
	return {
		shifts: shifts.length ? shifts : BUILT_IN_SHIFTS,
		customShifts: shifts.length > 0,
		departments,
	};
}

/** The rota heading for a role, and its place: the hotel's departments in their order, then the built-in headings. */
export function departmentFor(setup: RotaSetup, role: string) {
	const i = setup.departments.findIndex((d) => d.roles.includes(role));
	if (i >= 0) return { name: setup.departments[i].name, rank: i };
	const name = DEFAULT_DEPARTMENT[role] ?? "Other";
	const order = Object.values(DEFAULT_DEPARTMENT).filter(
		(v, j, a) => a.indexOf(v) === j,
	);
	const k = order.indexOf(name);
	return {
		name,
		rank: setup.departments.length + (k < 0 ? order.length : k),
	};
}

/** "06:00" → "6am", "14:30" → "2:30pm". */
export function ampm(t: string) {
	const [h, m] = t.split(":").map(Number);
	const suffix = h < 12 ? "am" : "pm";
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

export const shiftsSentence = (shifts: ShiftPreset[]) =>
	shifts
		.map(
			(s) =>
				`${s.name} ${ampm(s.starts)}–${ampm(s.ends)}${s.ends < s.starts ? " (ends the next morning)" : ""}`,
		)
		.join(", ");
