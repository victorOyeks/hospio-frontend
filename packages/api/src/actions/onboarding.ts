"use server";

import { clientAgentHeaders, clientMetaHeaders } from "@hospio/api/client-agent";
import { loadLegalDocuments } from "@hospio/api/actions/legal";
import { acceptItem } from "@hospio/api/api/routes-legal";
import { askForPin } from "@hospio/api/device";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { Delivery } from "@hospio/api/api/routes-admin";
import type { Business, Invite } from "@hospio/api/api/schema";
import { withSession } from "@hospio/api/api/server";
import { APP_ROLES, isAppRole } from "@hospio/api/app";
import { live } from "@hospio/api/data/live";
import { toOnboardingRow } from "@hospio/api/data/mappers/tenant";
import type { OnboardingRow } from "@hospio/api/data/types";
import {
	BUSINESS_ID,
	demoBusiness,
	demoHotels,
} from "@hospio/api/demo/fixtures/hotel";
import { DEMO_AUTH, demoDelay } from "@hospio/api/demo/mode";
import { mintDemoToken } from "@hospio/api/demo/token";
import {
	COOKIES,
	createSession,
	decodeSession,
	setActiveHotel,
	setActiveRole,
} from "@hospio/api/session";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingData,
	type OwnerOnboardingStep,
	ownerStepNumber,
} from "@hospio/api/types";

/**
 * Self-serve onboarding (apps/hotel): sign-up, phone check, invites, the owner's four-step wizard and
 * the handover an owner onboarded by Hospio360 accepts. Sign-up and accept-invite create the session the
 * same way `login` does.
 */

const OWNER_PATHS = [
	"/onboarding",
	"/handover",
	"/hotel-owner",
	"/hotel-owner/hotels",
	"/hotel-owner/users",
	"/hotel-owner/settings",
	"/select-role",
];
function revalidateOwner() {
	for (const p of OWNER_PATHS) revalidatePath(p);
}

/** After a token lands: one role skips the picker, the first hotel is the active one. */
async function settleSession(accessToken: string, refreshToken: string) {
	const session = await createSession(accessToken, refreshToken);
	const mine = session.roleSet.filter((r) => isAppRole(r));
	if (mine.length === 1) await setActiveRole(mine[0]);
	if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	return session;
}

export type SignUpInput = {
	fullName: string;
	email: string;
	phone: string;
	password: string;
	businessName: string;
	city?: string;
	/** The marketer's code from the sign-up link (?ref=); identity refuses an unknown or inactive one. */
	referralCode?: string;
	/** The two required boxes: Terms, Privacy Policy and Data Processing Terms; the daily debit authority (platform default rate). */
	acceptTerms: boolean;
	acceptDebit: boolean;
};

/** POST /identity/auth/sign-up: the owner account and business are created and the owner is signed in. */
async function recordSignUpAcceptance(token: string) {
	const docs = await loadLegalDocuments();
	const owner = docs.filter((d) => ["TERMS", "PRIVACY", "DPA", "DEBIT"].includes(d.key));
	if (!owner.length) return;
	await api("@post/platform/legal/accept", {
		auth: { type: "Bearer", token },
		headers: await clientMetaHeaders(),
		body: { documents: owner.map(acceptItem), method: "SELF_SIGN_UP" },
	});
}

export async function signUp(
	input: SignUpInput,
): Promise<ActionResult<{ roles: string[]; deliveries?: Delivery[] | null }>> {
	if (DEMO_AUTH) {
		await demoDelay(500);
		const token = mintDemoToken(
			input.email,
			input.fullName,
			BUSINESS_ID,
			demoHotels.map((h) => h.id),
			APP_ROLES.includes("OWNER") ? ["OWNER"] : APP_ROLES,
		);
		await createSession(token, "demo-refresh");
		await setActiveRole("OWNER");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { roles: ["OWNER"] } };
	}
	const { data, error } = await api("@post/identity/auth/sign-up", {
		body: {
			...input,
			city: input.city ?? null,
			referralCode: input.referralCode?.trim().toUpperCase() || null,
		},
		headers: await clientAgentHeaders(),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(
				error,
				error?.status === 409
					? "An account with this email already exists"
					: "We couldn't create your account",
			),
		};
	await settleSession(data.data.accessToken, data.data.refreshToken);
	// The two boxes become the owner's acceptance records (method SELF_SIGN_UP, with IP and browser). If this fails the owner is
	// simply asked again at their first sign-in to the dashboard (the legal gate), so sign-up never fails on it.
	await recordSignUpAcceptance(data.data.accessToken).catch(() => undefined);
	return {
		ok: true,
		data: { roles: data.data.roles, deliveries: data.data.deliveries },
	};
}

/**
 * GET /platform/public/referral-codes/{code} (no session): whether a sign-up link's code can refer, and the referrer's
 * first name. Valid only for an active marketer who accepted the agreement.
 */
export async function checkReferralCode(code: string): Promise<
	ActionResult<{
		code: string;
		valid: boolean;
		referrerFirstName?: string;
		message?: string;
	}>
> {
	const c = code.trim().toUpperCase();
	if (!c) return { ok: false, error: "Enter a referral code" };
	if (DEMO_AUTH) {
		await demoDelay(200);
		return { ok: true, data: { code: c, valid: true, referrerFirstName: "Kunle" } };
	}
	const { data, error } = await api("@get/platform/public/referral-codes/:code", {
		params: { code: c },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The referral code couldn't be checked"),
		};
	const d = data.data;
	return {
		ok: true,
		data: {
			code: d.code ?? c,
			valid: d.valid,
			referrerFirstName: d.referrerFirstName ?? undefined,
			message: d.message ?? undefined,
		},
	};
}

/**
 * POST /identity/auth/phone/send-code: a 6-digit code by SMS, or on WhatsApp with "WHATSAPP" (an SMS while the WhatsApp
 * code template isn't approved). Staging also accepts 123456. No new code within 60 s of the last one (`sent: false`,
 * the waiting code's `expiresAt`, `retryInSeconds`); `ifNone` sends only when no code is still valid.
 */
export async function sendPhoneCode(
	channel: "SMS" | "WHATSAPP" = "SMS",
	options: { ifNone?: boolean } = {},
): Promise<
	ActionResult<{
		expiresAt: string | null;
		deliveries?: Delivery[] | null;
		sent: boolean;
		retryInSeconds: number;
	}>
> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH || !live("identity")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
				sent: true,
				retryInSeconds: 60,
			},
		};
	}
	const { data, error } = await api("@post/identity/auth/phone/send-code", {
		auth,
		body: options.ifNone ? { channel, ifNone: true } : { channel },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The code could not be sent"),
		};
	const d = data.data;
	return {
		ok: true,
		data: {
			expiresAt: d.expiresAt,
			deliveries: d.deliveries,
			// An older API always sent and had no cooldown fields.
			sent: d.sent ?? true,
			retryInSeconds: d.retryInSeconds ?? 0,
		},
	};
}

/** GET /messaging/channels: whether a code can go on WhatsApp right now ("Send on WhatsApp instead"). */
export async function codeChannels(): Promise<{
	sms: boolean;
	whatsappCodes: boolean;
}> {
	const { auth } = await withSession();
	if (!auth || DEMO_AUTH || !live("messaging"))
		return { sms: false, whatsappCodes: false };
	const { data } = await api("@get/messaging/channels", { auth }).catch(() => ({
		data: null,
	}));
	return {
		sms: !!data?.data.sms,
		whatsappCodes: !!data?.data.whatsappCodes,
	};
}

/** POST /identity/auth/phone/verify. */
export async function verifyPhone(code: string): Promise<ActionResult<null>> {
	const { auth } = await withSession();
	if (!auth) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH || !live("identity")) {
		await demoDelay(400);
		return code.trim().length === 6
			? { ok: true, data: null }
			: { ok: false, error: "That code is not right" };
	}
	const { error } = await api("@post/identity/auth/phone/verify", {
		auth,
		body: { code: code.trim() },
	});
	if (error)
		return {
			ok: false,
			error: errorMessage(error, "That code is not right or has expired"),
		};
	revalidatePath("/verify-phone");
	revalidatePath("/onboarding");
	return { ok: true, data: null };
}

/** GET /identity/auth/invites/{token}: who the invite is for, so the accept screen can show it. */
export async function getInvite(token: string): Promise<ActionResult<Invite>> {
	if (DEMO_AUTH) {
		await demoDelay(300);
		return {
			ok: true,
			data: {
				fullName: "Tunde Bakare",
				email: "tunde@simpashotels.com",
				role: "MANAGER",
				businessName: "Royal Suites Ltd",
				hotelName: "Simpas Ikeja",
				expiresAt: new Date(Date.now() + 6 * 86_400_000).toISOString(),
				accepted: false,
			},
		};
	}
	const { data, error } = await api("@get/identity/auth/invites/:token", {
		params: { token },
	});
	if (error || !data) {
		const why =
			error?.status === 404
				? "This invite link is not valid"
				: error?.status === 410
					? "This invite has expired or was already used"
					: "The invite could not be loaded";
		return { ok: false, error: errorMessage(error, why) };
	}
	return { ok: true, data: data.data };
}

/** POST /identity/auth/accept-invite: sets the password and signs the invited person in. */
export async function acceptInvite(input: {
	token: string;
	password: string;
}): Promise<ActionResult<{ roles: string[] }>> {
	if (DEMO_AUTH) {
		await demoDelay(500);
		const token = mintDemoToken(
			"tunde@simpashotels.com",
			"Tunde Bakare",
			BUSINESS_ID,
			[demoHotels[0].id],
			APP_ROLES.includes("MANAGER") ? ["MANAGER"] : APP_ROLES,
		);
		await createSession(token, "demo-refresh");
		if (APP_ROLES.includes("MANAGER")) await setActiveRole("MANAGER");
		await setActiveHotel(demoHotels[0].id);
		return { ok: true, data: { roles: ["MANAGER"] } };
	}
	const { data, error } = await api("@post/identity/auth/accept-invite", {
		body: input,
		headers: await clientAgentHeaders(),
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The invite could not be accepted"),
		};
	await settleSession(data.data.accessToken, data.data.refreshToken);
	// First sign-in: staff on a shared desk are asked for a PIN (skippable; docs/shared-devices.md).
	await askForPin();
	return { ok: true, data: { roles: data.data.roles } };
}

/**
 * POST /identity/auth/refresh with the refresh cookie: a new access token that carries the current
 * hotel list (after a hotel is added). The role and hotel cookies are kept.
 */
export async function refreshSession(): Promise<ActionResult<null>> {
	const jar = await cookies();
	const refreshToken = jar.get(COOKIES.refresh)?.value;
	const current = jar.get(COOKIES.token)?.value;
	if (!refreshToken || !current) return { ok: false, error: "Sign in again" };
	if (DEMO_AUTH) {
		const session = decodeSession(current);
		if (!session) return { ok: false, error: "Sign in again" };
		await createSession(
			mintDemoToken(
				session.email,
				session.name,
				session.bid ?? BUSINESS_ID,
				demoHotels.map((h) => h.id),
				session.roleSet,
			),
			"demo-refresh",
		);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/identity/auth/refresh", {
		body: { refreshToken },
	});
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Your session could not be refreshed"),
		};
	const session = await createSession(
		data.data.accessToken,
		data.data.refreshToken,
	);
	const chosen = jar.get(COOKIES.hotel)?.value;
	if (!chosen || !session.hotels.includes(chosen)) {
		if (session.hotels.length >= 1) await setActiveHotel(session.hotels[0]);
	}
	return { ok: true, data: null };
}

/**
 * PUT /tenant/onboarding/mine/step: save one step of the owner's wizard so they can leave and return.
 * `step` is the step key or its number (1..4); `data` is that step's form, merged under the key.
 */
export async function saveMyOnboardingStep<K extends OwnerOnboardingStep>(
	step: K | number,
	data: NonNullable<OwnerOnboardingData[K]>,
): Promise<ActionResult<OnboardingRow>> {
	const key =
		typeof step === "number" ? OWNER_ONBOARDING_STEPS[step - 1] : step;
	const number = typeof step === "number" ? step : ownerStepNumber(step);
	if (!key || number < 1 || number > OWNER_ONBOARDING_STEPS.length)
		return { ok: false, error: "Unknown step" };
	if (!live("tenant")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				id: BUSINESS_ID,
				businessId: BUSINESS_ID,
				businessName: demoBusiness.name,
				source: "SELF_SERVE",
				step: Math.min(number + 1, 4),
				totalSteps: 4,
				completedSteps: OWNER_ONBOARDING_STEPS.slice(0, number),
				assignedTo: "—",
				startedAt: new Date().toISOString(),
				status: number >= 4 ? "READY_FOR_HANDOVER" : "IN_PROGRESS",
				nextAction: "—",
				data: { [key]: data },
			},
		};
	}
	const { data: res, error } = await api("@put/tenant/onboarding/mine/step", {
		...(await withSession()),
		body: { step: number, data: data as Record<string, unknown> },
	});
	if (error || !res)
		return {
			ok: false,
			error: errorMessage(error, "Your progress could not be saved"),
		};
	revalidatePath("/onboarding");
	return { ok: true, data: toOnboardingRow(res.data) };
}

/** POST /tenant/onboarding/mine/complete: the business goes LIVE and the wizard is done. */
export async function completeMyOnboarding(): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoBusiness };
	}
	const { data, error } = await api(
		"@post/tenant/onboarding/mine/complete",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Onboarding could not be completed"),
		};
	revalidateOwner();
	return { ok: true, data: data.data };
}

/** POST /tenant/handover/accept: an owner onboarded by Hospio360 accepts the handover; the business goes LIVE. */
export async function acceptHandover(): Promise<ActionResult<Business>> {
	if (!live("tenant")) {
		await demoDelay(500);
		return { ok: true, data: demoBusiness };
	}
	const { data, error } = await api(
		"@post/tenant/handover/accept",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The handover could not be accepted"),
		};
	revalidateOwner();
	return { ok: true, data: data.data };
}

// ---- step 3 at a lounge, bar or restaurant: outlets (hospio-backend docs/plan-venue-type.md) ------------------

export type OnboardingOutlet = { outletId: string; name: string; kind: string };

/** The location's outlets so far (the step pre-fills when the owner comes back). */
export async function onboardingOutlets(
	hotelId: string,
): Promise<ActionResult<OnboardingOutlet[]>> {
	if (!live("fnb")) return { ok: true, data: [] };
	const { data, error } = await api("@get/fnb/outlets", await withSession({ hotelId }));
	if (error || !data)
		return { ok: false, error: errorMessage(error, "The outlets could not be read") };
	return {
		ok: true,
		data: data.data.map((o) => ({ outletId: o.id, name: o.name, kind: o.kind })),
	};
}

/**
 * One outlet for the new location (POST /fnb/outlets), linked to the store of its kind like Hotel setup → Restaurants & tables
 * does (a bar the Bar store, a kitchen or restaurant the Kitchen store, else the Main store). The default stores arrive from the
 * HOTEL_CREATED event a moment after the location is made, so an empty list is asked again once before going without a store.
 */
export async function createOnboardingOutlet(
	hotelId: string,
	input: { name: string; kind: "BAR" | "RESTAURANT" | "KITCHEN" },
): Promise<ActionResult<OnboardingOutlet>> {
	const name = input.name.trim();
	if (!name) return { ok: false, error: "Enter the outlet's name" };
	if (!live("fnb")) {
		await demoDelay(300);
		return { ok: true, data: { outletId: `out-${Date.now()}`, name, kind: input.kind } };
	}
	const s = await withSession({ hotelId });
	let stores: { id: string; kind?: string | null; active?: boolean | null }[] = [];
	for (let attempt = 0; attempt < 2 && stores.length === 0; attempt++) {
		if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
		const res = await api("@get/inventory/stores", s);
		stores = (res.data?.data ?? []).filter((x) => x.active !== false);
	}
	const want = input.kind === "BAR" ? "BAR" : "KITCHEN";
	const storeId =
		stores.find((x) => x.kind === want)?.id ?? stores.find((x) => x.kind === "MAIN")?.id ?? null;
	const { data, error } = await api("@post/fnb/outlets", {
		...s,
		body: { name, kind: input.kind, storeId, status: "OPEN", terminalId: null },
	});
	if (error || !data)
		return { ok: false, error: errorMessage(error, "The outlet could not be created") };
	revalidatePath("/onboarding");
	return { ok: true, data: { outletId: data.data.id, name: data.data.name, kind: data.data.kind } };
}
