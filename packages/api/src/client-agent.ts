import "server-only";

import { headers } from "next/headers";

/**
 * The browser's user agent as `X-Client-Agent`, for the calls that open a session (sign-in, 2-step, accept-invite, sign-up,
 * PIN unlock): identity calls the session "Chrome on macOS" in My profile → Where you're signed in (docs/profile.md).
 * The calls go from this server, so without it every session would read as the server's own agent.
 */
export async function clientAgentHeaders(): Promise<Record<string, string>> {
	try {
		const h = await headers();
		const ua = h.get("user-agent");
		const out: Record<string, string> = ua ? { "X-Client-Agent": ua.slice(0, 400) } : {};
		// The browser's address as the first X-Forwarded-For hop (the API's nginx appends this server's). Identity limits
		// sign-in attempts per address; without it every sign-in from both apps counted against this one server, so a busy
		// minute answered "Too many attempts" for everyone (hospio-backend docs/sign-in.md).
		const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
		if (ip && /^[0-9a-fA-F:.]{2,64}$/.test(ip)) out["X-Forwarded-For"] = ip;
		return out;
	} catch {
		return {};
	}
}

/**
 * The browser's user agent and address, for the calls that record a legal acceptance (hospio-backend docs/legal-acceptance.md):
 * `X-Client-Agent` as above and `X-Client-IP` from the proxy's `X-Forwarded-For` (first hop) or `X-Real-IP`.
 */
export async function clientMetaHeaders(): Promise<Record<string, string>> {
	const out = await clientAgentHeaders();
	delete out["X-Forwarded-For"];
	try {
		const h = await headers();
		const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
		if (ip && /^[0-9a-fA-F:.]{2,64}$/.test(ip)) out["X-Client-IP"] = ip;
	} catch {
		// outside a request: nothing to forward
	}
	return out;
}
