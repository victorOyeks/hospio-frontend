/**
 * Help content types. Every guide module under packages/ui/src/help is a plain module (no "use client"),
 * so server pages can import it safely. To change a guide, edit the role's file; the Help screen picks it up.
 */

/** Who a guide module is for. PLATFORM covers Super admin, Support and Finance admin in the admin app. */
export type HelpAudience =
	| "EVERYONE"
	| "OWNER"
	| "MANAGER"
	| "FRONT_OFFICE"
	| "HOUSEKEEPING"
	| "LAUNDRY"
	| "MAINTENANCE"
	| "KITCHEN"
	| "BAR"
	| "INVENTORY"
	| "FINANCE"
	| "WAITER"
	| "CASHIER"
	| "PLATFORM"
	| "MARKETER";

export type HelpGuide = {
	/** Unique across all modules, e.g. "fo-take-payment". */
	id: string;
	/** A task, in the user's words: "Take a payment". */
	title: string;
	/** One line on when to use it. */
	when: string;
	/** A group inside the role, e.g. "Bookings", "Money". */
	topic: string;
	/** Numbered steps. Use the real button and menu names, in quotes where it helps: Tap “Check in”. */
	steps: string[];
	/** Rules and limits worth knowing. */
	goodToKnow: string[];
	/**
	 * The screen this guide is about, as the user types it: "/dashboard/bookings". Only a path that exists for
	 * this module's role (see ROUTES in index.ts). Leave out when there is no single screen.
	 */
	route?: string;
	/** The screen's name for the "Open …" button, as the sidebar shows it: "Bookings". */
	screen?: string;
	/**
	 * True for a guide about rooms, bookings, stays or folios: left out at a lounge, bar or restaurant (a location without
	 * rooms, hospio-backend docs/plan-venue-type.md). A guide whose `route` is a rooms-and-stays page is left out by itself.
	 */
	stay?: boolean;
	/**
	 * What the guide says at a lounge, bar or restaurant where it differs: a whole `when`, `steps` or `goodToKnow`, or `swap`
	 * for single lines ([part of the line, the line to show instead, or null to leave it out]). Written in the hotel's words
	 * like the rest ("hotel", "Hotel setup"); the place's own words are put in when it is shown.
	 */
	venue?: {
		title?: string;
		when?: string;
		steps?: string[];
		goodToKnow?: string[];
		swap?: [string, string | null][];
	};
};

export type HelpModule = {
	audience: HelpAudience;
	/** Shown as the section heading: "Front office". */
	label: string;
	/** One line under the heading. */
	intro: string;
	guides: HelpGuide[];
};

export type WhatsNewItem = {
	title: string;
	body: string;
	/** Who sees it. EVERYONE shows to all hotel staff; PLATFORM only in the admin app. */
	audience: HelpAudience[];
	/** True for news about rooms, bookings or stays: not shown at a lounge, bar or restaurant. */
	stay?: boolean;
	/** The body at a lounge, bar or restaurant where it differs. */
	venueBody?: string;
};
