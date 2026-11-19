import { getActiveHotel, getHotels } from "./dal";
import { businessWording, hasAccommodation, type Wording, wording } from "./venue";

/**
 * The words of the signed-in person's screens, for a server page (the dashboard shell gives client screens the same through
 * `useWording`): the active location's noun, the business's ("hotels" or "locations") and whether the location has rooms.
 * hospio-backend docs/plan-venue-type.md, phase 5.
 */
export async function getWords(): Promise<{ place: Wording; biz: Wording; stays: boolean }> {
	const [active, hotels] = await Promise.all([getActiveHotel().catch(() => null), getHotels().catch(() => [])]);
	return { place: wording(active), biz: businessWording(hotels), stays: hasAccommodation(active) };
}
