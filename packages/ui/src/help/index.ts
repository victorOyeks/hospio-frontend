/**
 * Help content for both apps: one plain module per role (no "use client"), picked here by the roles a person
 * holds. To update a guide, edit its role file; to add a screen link, the path must be in ROUTES for that role.
 */
import type { HotelRole } from "@hospio/api/roles";
import { adaptText, HOTEL_WORDING, type Wording } from "@hospio/api/venue";
import { isStayOnlyPath } from "@hospio/ui/links";
import { barHelp } from "./bar";
import { cashierHelp } from "./cashier";
import { accountHelp, staffHelp } from "./everyone";
import { financeHelp } from "./finance";
import { frontOfficeHelp } from "./front-office";
import { housekeepingHelp } from "./housekeeping";
import { inventoryHelp } from "./inventory";
import { kitchenHelp } from "./kitchen";
import { laundryHelp } from "./laundry";
import { maintenanceHelp } from "./maintenance";
import { managerHelp } from "./manager";
import { marketerHelp } from "./marketer";
import { ownerHelp } from "./owner";
import { platformHelp } from "./platform";
import { waiterHelp } from "./waiter";
import type {
	HelpAudience,
	HelpGuide,
	HelpModule,
	WhatsNewItem,
} from "./types";
import { whatsNew, whatsNewWeek } from "./whats-new";

export type { HelpAudience, HelpGuide, HelpModule, WhatsNewItem };

/** The screens each role can open at /dashboard/*, from the app's route folders. Shared screens are in SHARED. */
const ROUTES: Record<Exclude<HelpAudience, "EVERYONE">, string[]> = {
	OWNER: [
		"hotels",
		"hospio-fees",
		"billing",
		"bookings",
		"staff",
		"financials",
		"financials/sales",
		"payments",
		"reports",
		"users",
		"roles",
		"operations",
		"inventory",
		"messaging",
		"hotel-setup",
		"settings",
	],
	MANAGER: [
		"departments",
		"hospio-fees",
		"billing",
		"rooms",
		"bookings",
		"folios",
		"staff",
		"financials",
		"financials/sales",
		"payments",
		"organizations",
		"night-audit",
		"messaging",
		"inventory",
		"menus",
		"reports",
		"tasks",
		"roles",
		"activity",
		"approvals",
		"hotel-setup",
	],
	FRONT_OFFICE: [
		"bookings",
		"rooms",
		"folios",
		"room-service",
		"laundry",
		"repairs",
		"guests",
		"lost-found",
		"messages",
		"payments",
		"till",
	],
	HOUSEKEEPING: ["inspect", "lost-found", "linen", "store", "repairs"],
	LAUNDRY: ["linen", "store", "payments"],
	MAINTENANCE: ["preventive", "store", "rooms"],
	KITCHEN: ["sales", "menu", "store", "payments", "till"],
	BAR: ["tabs", "sales", "menu", "stock", "payments", "till"],
	WAITER: ["sales"],
	CASHIER: ["sales", "payments", "till"],
	INVENTORY: ["requests", "orders", "deliveries", "counts", "suppliers"],
	FINANCE: [
		"month",
		"expenses",
		"sales",
		"tills",
		"night-audit",
		"organizations",
	],
	PLATFORM: [
		"businesses",
		"hotels",
		"onboarding",
		"support",
		"fees",
		"payments",
		"marketers",
		"changes",
		"team",
		"settings",
		"integrations",
	],
	MARKETER: ["businesses", "commissions", "refer"],
};
const SHARED_HOTEL = ["notifications", "profile", "help", "shifts", "inbox"];
const SHARED_ADMIN = ["notifications", "profile", "help"];

const MODULES: Partial<Record<HelpAudience, HelpModule>> = {
	OWNER: ownerHelp,
	MANAGER: managerHelp,
	FRONT_OFFICE: frontOfficeHelp,
	HOUSEKEEPING: housekeepingHelp,
	LAUNDRY: laundryHelp,
	MAINTENANCE: maintenanceHelp,
	KITCHEN: kitchenHelp,
	BAR: barHelp,
	INVENTORY: inventoryHelp,
	FINANCE: financeHelp,
	WAITER: waiterHelp,
	CASHIER: cashierHelp,
	PLATFORM: platformHelp,
	MARKETER: marketerHelp,
};

/** The help audience a backend role belongs to. */
export function audienceOf(role: HotelRole): Exclude<HelpAudience, "EVERYONE"> {
	if (role === "SUPER_ADMIN" || role === "SUPPORT" || role === "FINANCE_ADMIN")
		return "PLATFORM";
	return role;
}

/** Whether `/dashboard/...` opens for the active role (the app maps it to that role's screens). */
function canOpen(
	route: string,
	app: "hotel" | "admin",
	active: HelpAudience | null,
): boolean {
	const rest = route.replace(/^\/dashboard\/?/, "");
	if (!rest) return active !== null;
	if ((app === "hotel" ? SHARED_HOTEL : SHARED_ADMIN).includes(rest))
		return true;
	if (!active || active === "EVERYONE") return false;
	return ROUTES[active].includes(rest);
}

/** A section of the Help page: a module with each guide's "Open …" link worked out for this person. */
export type HelpSection = {
	key: string;
	label: string;
	intro: string;
	/** True for the module of the role the person is working as now. */
	current: boolean;
	guides: (HelpGuide & { open: boolean })[];
};

export type HelpContent = {
	sections: HelpSection[];
	whatsNew: WhatsNewItem[];
	whatsNewWeek: string;
};

/**
 * The guides for the roles a person holds, the role they are working as first, then their account guides.
 * An "Open" link shows only when the guide belongs to the active role (or a shared screen) and the route exists.
 */
export function helpFor(
	app: "hotel" | "admin",
	roles: readonly string[],
	activeRole: HotelRole | null,
	/**
	 * The words of the place (hospio-backend docs/plan-venue-type.md, phase 5): at a lounge the guides say "lounge" and "Lounge
	 * setup", and the ones about rooms, bookings and stays are left out. Left out: everything reads as at a hotel.
	 */
	words: { place: Wording; biz: Wording; stays: boolean } = { place: HOTEL_WORDING, biz: HOTEL_WORDING, stays: true },
): HelpContent {
	// The owner's guides are about the whole business ("your hotels" → "your locations"); everyone else's about the location.
	const say = (a: string) => (text: string) =>
		a === "OWNER" ? adaptText(text, words.biz, words.place.setup) : adaptText(text, words.place);
	const fits = (g: HelpGuide, a: string) =>
		words.stays ||
		(!g.stay && !(g.route && a !== "EVERYONE" && a !== "STAFF" && a !== "ACCOUNT" && isStayOnlyPath(a as HotelRole, g.route)));
	const worded = (g: HelpGuide, a: string): HelpGuide => {
		if (words.stays && words.place.hotel && words.biz.hotel) return g;
		const t = say(a);
		const v = words.stays ? undefined : g.venue;
		const lines = (own: string[], other?: string[]) =>
			(other ?? own)
				.map((line) => {
					const swap = v?.swap?.find(([part]) => line.includes(part));
					return swap ? swap[1] : line;
				})
				.filter((line): line is string => line !== null)
				.map(t);
		return {
			...g,
			title: t(v?.title ?? g.title),
			when: t(v?.when ?? g.when),
			topic: t(g.topic),
			steps: lines(g.steps, v?.steps),
			goodToKnow: lines(g.goodToKnow, v?.goodToKnow),
			screen: g.screen ? t(g.screen) : g.screen,
		};
	};
	const held = new Set<Exclude<HelpAudience, "EVERYONE">>();
	for (const r of roles) {
		const a = audienceOf(r as HotelRole);
		if (
			MODULES[a] &&
			(app === "admin"
				? a === "PLATFORM" || a === "MARKETER"
				: a !== "PLATFORM" && a !== "MARKETER")
		)
			held.add(a);
	}
	const active = activeRole ? audienceOf(activeRole) : null;
	const order = [...held].sort((a, b) =>
		a === active ? -1 : b === active ? 1 : 0,
	);

	const sections: HelpSection[] = order.map((a) => {
		const m = MODULES[a] as HelpModule;
		return {
			key: a,
			label: say(a)(m.label),
			intro: say(a)(words.stays ? m.intro : (m.venueIntro ?? m.intro)),
			current: a === active,
			guides: m.guides.filter((g) => fits(g, a)).map((g) => ({
				...worded(g, a),
				open: a === active && !!g.route && canOpen(g.route, app, active),
			})),
		};
	});
	const withOpen = (m: HelpModule, key: string): HelpSection => ({
		key,
		label: say(key)(m.label),
		intro: say(key)(words.stays ? m.intro : (m.venueIntro ?? m.intro)),
		current: false,
		guides: m.guides.filter((g) => fits(g, key)).map((g) => ({
			...worded(g, key),
			open: !!g.route && canOpen(g.route, app, active),
		})),
	});
	// Shifts, PIN and Inbox are for hotel staff; the owner has no shifts or PIN.
	if (app === "hotel" && [...held].some((a) => a !== "OWNER"))
		sections.push(withOpen(staffHelp, "STAFF"));
	// Platform staff are the support desk, so the admin app has no "Contact support" guide, nor the hotel's sign-in look.
	const account =
		app === "admin"
			? {
					...accountHelp,
					guides: accountHelp.guides.filter(
						(g) => g.id !== "all-contact-support" && g.id !== "all-hotel-look",
					),
				}
			: accountHelp;
	sections.push(withOpen(account, "ACCOUNT"));

	const audiences = new Set<HelpAudience>(held);
	if (app === "hotel") audiences.add("EVERYONE");
	const news = whatsNew
		.filter((n) => n.audience.some((x) => audiences.has(x)) && (words.stays || !n.stay))
		.map((n) =>
			words.place.hotel && words.stays
				? n
				: { ...n, title: say("")(n.title), body: say("")(words.stays ? n.body : (n.venueBody ?? n.body)) },
		);
	return { sections, whatsNew: news, whatsNewWeek };
}
