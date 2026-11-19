"use client";

import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from "react";
import { adaptText, HOTEL_WORDING, type Wording } from "@hospio/api/venue";

/**
 * The words of the signed-in person's screens (hospio-backend docs/plan-venue-type.md, phase 5): `place` for the active
 * location ("hotel", "lounge", "bar"…), `biz` for the whole business ("hotels", or "locations" when it is not hotels only).
 * Set once by the dashboard shell; outside it everything reads as a hotel.
 */
type Words = {
	place: Wording;
	biz: Wording;
	/** False at a location without rooms (a lounge, bar or restaurant): copy about bookings and stays is left out. */
	stays: boolean;
};

const WordingContext = createContext<Words>({ place: HOTEL_WORDING, biz: HOTEL_WORDING, stays: true });

export function WordingProvider({ place, biz, stays, children }: PropsWithChildren<Words>) {
	const value = useMemo(() => ({ place, biz, stays }), [place, biz, stays]);
	return <WordingContext.Provider value={value}>{children}</WordingContext.Provider>;
}

export function useWording(): Words {
	return useContext(WordingContext);
}

/**
 * `t("Remove from hotel")` → "Remove from lounge" at a lounge; the same text at a hotel. For copy about the active location.
 * Only fixed copy goes through it, never a name someone typed.
 */
export function usePlaceText(): (text: string) => string {
	const { place } = useContext(WordingContext);
	return useCallback((text: string) => adaptText(text, place), [place]);
}

/**
 * `t("All hotels")` → "All locations" for a business that is not hotels only. For copy about the whole business (the owner's
 * pages); "Hotel setup" still names the active location's setup.
 */
export function useBizText(): (text: string) => string {
	const { place, biz } = useContext(WordingContext);
	return useCallback((text: string) => adaptText(text, biz, place.setup), [place, biz]);
}
