/**
 * Every address the landing site links to or calls, from build-time env (Next inlines NEXT_PUBLIC_* when it builds). The
 * fallbacks are staging, so a staging build needs nothing set. Production sets (deploy workflow variables):
 *
 * - NEXT_PUBLIC_HOTEL_APP_URL  https://app.hospio360.com          sign-in, create an account (header, hero, pricing, footer)
 * - NEXT_PUBLIC_ADMIN_APP_URL  https://backoffice.hospio360.com   the admin console (Hospio360 staff)
 * - NEXT_PUBLIC_API_URL        https://api-prod.hospio360.com     partner applications, the guest booking page (/stay)
 * - NEXT_PUBLIC_SITE_URL       https://hospio360.com              canonical links, sitemap, robots
 *
 * The same names the hotel and admin apps use (packages/api: client.ts, app.ts). An empty value counts as unset.
 */
function url(value: string | undefined, fallback: string): string {
	return (value?.trim() || fallback).replace(/\/+$/, "");
}

/** The hotel app (sign-in and sign-up) for this environment. */
export const HOTEL_APP_URL = url(process.env.NEXT_PUBLIC_HOTEL_APP_URL, "https://web-staging.hospio360.com");
/** The admin console (backoffice) for this environment. */
export const ADMIN_APP_URL = url(process.env.NEXT_PUBLIC_ADMIN_APP_URL, "https://admin-staging.hospio360.com");
/** The API gateway for this environment. */
export const API_URL = url(process.env.NEXT_PUBLIC_API_URL, "https://api-staging.hospio360.com");
/** The public site's own address. */
export const SITE_URL = url(process.env.NEXT_PUBLIC_SITE_URL, "https://hospio360.com");
