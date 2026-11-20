import { HOTEL_ROLES, PLATFORM_ROLES, type HotelRole } from "./roles";

/**
 * The two web apps share this package and differ only here. NEXT_PUBLIC_APP is "hotel" (owners,
 * managers, hotel staff) or "admin" (Hospio360 platform admin and the marketer portal). A sign-in that
 * carries only the other app's roles is sent to that app.
 */
export type AppKind = "hotel" | "admin";

export const APP: AppKind = process.env.NEXT_PUBLIC_APP === "admin" ? "admin" : "hotel";

export const ADMIN_APP_ROLES: readonly HotelRole[] = [...PLATFORM_ROLES, "MARKETER"];
export const HOTEL_APP_ROLES: readonly HotelRole[] = HOTEL_ROLES.filter((r) => !ADMIN_APP_ROLES.includes(r));

/** The roles this app signs in and shows in the role picker. */
export const APP_ROLES: readonly HotelRole[] = APP === "admin" ? ADMIN_APP_ROLES : HOTEL_APP_ROLES;

export function isAppRole(role: string): role is HotelRole {
	return (APP_ROLES as readonly string[]).includes(role);
}

/** Where the other app lives (links only: the sign-in hand-over takes its address from the server, hospio-backend docs/sign-in.md). */
export const OTHER_APP_URL = APP === "admin"
	? (process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com")
	: (process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://admin-staging.hospio360.com");

/** The other app, as the backend's hand-over names it. */
export const OTHER_APP: AppKind = APP === "admin" ? "hotel" : "admin";

/**
 * What kind of account the roles make, for the hand-over words: platform staff (super admin, support, finance admin), a
 * marketer, or a business (owner, manager, staff). Null with no roles.
 */
export type AccountKind = "platform" | "marketer" | "business";

export function accountKind(roles: readonly string[]): AccountKind | null {
	if (roles.some((r) => (PLATFORM_ROLES as readonly string[]).includes(r))) return "platform";
	if (roles.includes("MARKETER")) return "marketer";
	if (roles.some((r) => (HOTEL_APP_ROLES as readonly string[]).includes(r))) return "business";
	return null;
}

/** True when the account holds roles but none of this app's: it belongs on the other app (sign-in hands it over). */
export function belongsElsewhere(roles: readonly string[]): boolean {
	return roles.length > 0 && !roles.some((r) => isAppRole(r)) && accountKind(roles) !== null;
}

export const APP_NAME = APP === "admin" ? "Hospio360 Admin" : "Hospio360";
