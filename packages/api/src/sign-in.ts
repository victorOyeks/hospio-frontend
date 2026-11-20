import "server-only";

import { cookies } from "next/headers";
import { isAppRole } from "./app";
import { askForPin, getSharedDevice } from "./device";
import { COOKIES, clearActiveRole, createSession, setActiveHotel, setActiveRole } from "./session";

/**
 * Where a fresh session lands, the same for a sign-in on this app and for a hand-over from the other one (docs/sign-in.md in
 * hospio-backend): the session cookies, the role when there is only one (a role left in the browser by someone else is
 * dropped), the first hotel, and the PIN prompt on a shared device or after a first sign-in.
 */
export async function settleSignIn(accessToken: string, refreshToken: string | null, mustChangePassword: boolean) {
	const session = await createSession(accessToken, refreshToken);
	const mine = session.roleSet.filter((r) => isAppRole(r));
	const kept = (await cookies()).get(COOKIES.role)?.value;
	if (mine.length === 1) await setActiveRole(mine[0]);
	else if (kept && !mine.includes(kept as (typeof mine)[number])) await clearActiveRole();
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	// The PIN prompt after a sign-in on a shared device (that hotel first) or a first sign-in (docs/shared-devices.md).
	const { device } = await getSharedDevice();
	if (device && session.hotels.includes(device.hotelId)) await setActiveHotel(device.hotelId);
	if (device || mustChangePassword) await askForPin();
	return session;
}
