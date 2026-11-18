import type { OwnerOnboardingStep } from "@hospio/api/types";
import { businessKind, kindHasRooms, VENUE_LABEL } from "@hospio/api/venue";

type StepCopy = { title: string; short: string; blurb: string; minutes: number };

/** Step copy shared by the step bar, the welcome checklist and the step pages (plain module: server components import it too). */
export const STEP_META: Record<OwnerOnboardingStep, StepCopy> = {
	business: {
		title: "Your business",
		short: "Business",
		blurb: "Company name, address and contacts",
		minutes: 1,
	},
	hotel: {
		title: "Your first hotel",
		short: "Hotel",
		blurb: "Name, address and check-in times",
		minutes: 2,
	},
	rooms: {
		title: "Rooms & prices",
		short: "Rooms",
		blurb: "Room types, how many, and what they cost",
		minutes: 3,
	},
	manager: {
		title: "Your first manager",
		short: "Manager",
		blurb: "Invite them and give them the hotel",
		minutes: 1,
	},
};

/** "lounge", "restaurant", "location" (MIXED): how step 2 names the place (hospio-backend docs/plan-venue-type.md). */
export function placeWord(kind: string | null | undefined): string {
	const k = businessKind(kind);
	if (k === "MIXED") return "location";
	return VENUE_LABEL[k].toLowerCase();
}

/**
 * The step copy for a business of this kind. `accommodation`: whether the first location has rooms (step 3 is "Rooms & prices"
 * there, "Outlets" otherwise); left out, the kind decides.
 */
export function stepMeta(
	kind: string | null | undefined,
	accommodation?: boolean,
): Record<OwnerOnboardingStep, StepCopy> {
	const rooms = accommodation ?? kindHasRooms(kind);
	const place = placeWord(kind);
	if (place === "hotel" && rooms) return STEP_META;
	return {
		business: STEP_META.business,
		hotel: {
			title: `Your first ${place}`,
			short: place.charAt(0).toUpperCase() + place.slice(1),
			blurb: rooms ? "Name, address and check-in times" : "Name, address and phone",
			minutes: 2,
		},
		rooms: rooms
			? STEP_META.rooms
			: {
					title: "Outlets",
					short: "Outlets",
					blurb: "Where you sell: the bar, the restaurant, the kitchen",
					minutes: 1,
				},
		manager: {
			...STEP_META.manager,
			blurb: `Invite them and give them the ${place}`,
		},
	};
}

export const stepHref = (step: OwnerOnboardingStep | "done") =>
	`/onboarding/${step}`;
