import "server-only";

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { api, errorMessage } from "./api/client";
import { APP, belongsElsewhere, isAppRole, OTHER_APP } from "./app";
import { clientAgentHeaders } from "./client-agent";
import { safeAppPath } from "./safe-path";
import { COOKIES, decodeSession, deleteSession } from "./session";
import { settleSignIn } from "./sign-in";

/**
 * Single sign-in across the hotel app and the admin console (hospio-backend docs/sign-in.md). No cookie is shared between the
 * two hosts. An account signed in on the wrong app is handed to the right one with a one-time code from identity: random
 * (256 bits), stored hashed, bound to the person and the target app, valid 30 seconds, used once. The target swaps it at
 * /auth/handoff for its own session and redirects at once, so the code never stays in the address bar or in a Referer.
 */
export const HANDOFF_PATH = "/auth/handoff";
/** Set for 20 s on the app that sent someone away: a second automatic hand-over in that time ends at sign-in instead. */
const GUARD_COOKIE = "hms.handoff";
const CODE = /^[A-Za-z0-9_-]{20,100}$/;

/** A redirect that never leaks: path-only (or the server's own handoff URL), not cached, no Referer onward. */
function go(location: string) {
	return new NextResponse(null, {
		status: 303,
		headers: { Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
	});
}

/** Only the other app's /auth/handoff, over https (http only on localhost for development). */
function isHandoffUrl(url: string): boolean {
	try {
		const u = new URL(url);
		const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
		return u.pathname === HANDOFF_PATH && (u.protocol === "https:" || (local && u.protocol === "http:")) && !u.username && !u.password;
	} catch {
		return false;
	}
}

/**
 * A code for the other app, asked with `token`. `next`: a page there (checked again by the other app). `endSession`: the sign-in
 * was made on the wrong app and is not kept (identity ends that session as it issues the code).
 */
export async function requestHandoff(
	token: string,
	next: string | null | undefined,
	endSession: boolean,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
	const { data, error } = await api("@post/identity/auth/handoff", {
		auth: { type: "Bearer", token },
		body: { target: OTHER_APP, next: safeAppPath(next) ?? undefined, endSession },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "We couldn't open your app. Sign in there instead") };
	const url = data.data.url;
	if (!isHandoffUrl(url)) return { ok: false, error: "We couldn't open your app. Sign in there instead" };
	return { ok: true, url };
}

/**
 * GET /auth/handoff?code=: swaps the code for this app's own session and opens the page it names (or the dashboard; the
 * password change first for a temporary password). Any refusal (unknown, expired, already used, for the other app) lands on
 * sign-in with a sentence; nothing here ever redirects to another site or asks again.
 */
export async function handoffRoute(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	if (!code || !CODE.test(code)) return go("/auth?reason=handoff");
	const { data, error } = await api("@post/identity/auth/handoff/exchange", {
		body: { code, target: APP },
		headers: await clientAgentHeaders(),
	});
	if (error || !data) return go("/auth?reason=handoff");
	const out = data.data;
	// Only a session that holds this app's roles is kept: one the middleware would send away again never gets a cookie.
	const session = decodeSession(out.accessToken);
	if (!session || !session.roleSet.some((r) => isAppRole(r))) return go("/auth?reason=handoff");
	await settleSignIn(out.accessToken, out.refreshToken, out.mustChangePassword);
	return go(out.mustChangePassword ? "/reset-password" : (safeAppPath(out.next) ?? "/dashboard"));
}

/**
 * GET /api/session/handoff?next=: the middleware sends a session that holds none of this app's roles here (a cookie from before
 * single sign-in, or a support link). The session is never kept here: it is ended and handed to the other app once. A second
 * try within 20 seconds, or any failure, ends at this app's sign-in page, so a wrong account type can't bounce between the apps.
 */
export async function wrongAppRoute(request: NextRequest) {
	const jar = await cookies();
	const token = jar.get(COOKIES.token)?.value;
	const session = token ? decodeSession(token) : null;
	if (!token || !session) return go("/auth");
	if (!belongsElsewhere(session.roleSet)) return go("/dashboard");
	const recent = !!jar.get(GUARD_COOKIE)?.value;
	await deleteSession();
	if (recent || session.actedBy) return go("/auth?reason=wrong-app");
	jar.set(GUARD_COOKIE, "1", { httpOnly: true, path: "/", maxAge: 20, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
	const handoff = await requestHandoff(token, request.nextUrl.searchParams.get("next"), true);
	return handoff.ok ? go(handoff.url) : go("/auth?reason=wrong-app");
}
