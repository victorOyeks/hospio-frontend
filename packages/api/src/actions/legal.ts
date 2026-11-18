"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import {
	AcceptLegalInput,
	type LegalDoc,
	type LegalRecord,
	type LegalVersion,
	LinksSharedInput,
	type MyLegal,
	PublishLegalInput,
} from "@hospio/api/api/routes-legal";
import { withSession } from "@hospio/api/api/server";
import { clientMetaHeaders } from "@hospio/api/client-agent";
import { live } from "@hospio/api/data/live";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { env } from "@hospio/api/env";

/**
 * Legal documents and their online acceptance (hospio-backend docs/legal-acceptance.md). Every acceptance call forwards the
 * browser's address and user agent, so the record says where it was given.
 */

const EMPTY: MyLegal = { required: [], pending: [], upcoming: [], records: [], canAccept: false };

/** What the signed-in person must accept now. Null when it could not be read (the screens then don't block). */
export async function loadMyLegal(): Promise<MyLegal | null> {
	if (DEMO_AUTH || !live("platform")) return EMPTY;
	const session = await withSession();
	if (!session.auth) return null;
	const { data, error } = await api("@get/platform/legal/me", { auth: session.auth });
	if (error || !data) return null;
	return data.data;
}

/** The version in force of each document (public), for the sign-up boxes' links and versions. */
export async function loadLegalDocuments(): Promise<LegalDoc[]> {
	if (!live("platform")) return [];
	const { data, error } = await api("@get/platform/public/legal/documents", {});
	if (error || !data) return [];
	return data.data.current;
}

/** Accept the given versions: `method` SELF_SIGN_UP (sign-up), HANDOVER (handover review) or PORTAL (marketer); else the server decides. */
export async function acceptLegal(input: {
	documents: { key: string; version: string }[];
	method?: "SELF_SIGN_UP" | "HANDOVER" | "PORTAL";
}): Promise<ActionResult<MyLegal>> {
	const parsed = AcceptLegalInput.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Tick the boxes to accept" };
	if (DEMO_AUTH || !live("platform")) return { ok: true, data: EMPTY };
	const session = await withSession();
	if (!session.auth) return { ok: false, error: "Sign in again" };
	const { data, error } = await api("@post/platform/legal/accept", {
		auth: session.auth,
		headers: await clientMetaHeaders(),
		body: parsed.data,
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "Your acceptance could not be saved. Try again") };
	revalidatePath("/", "layout");
	return { ok: true, data: data.data };
}

/** The owner's own business records (My profile → Legal). */
export async function loadOwnerAcceptances(): Promise<LegalRecord[]> {
	if (DEMO_AUTH || !live("platform")) return [];
	const session = await withSession();
	if (!session.auth) return [];
	const { data, error } = await api("@get/platform/owner/legal/acceptances", { auth: session.auth });
	return error || !data ? [] : data.data;
}

/** Admin: a business's records (Acceptance tab). */
export async function loadBusinessAcceptances(businessId: string): Promise<ActionResult<LegalRecord[]>> {
	if (!live("platform")) return { ok: true, data: [] };
	const session = await withSession();
	const { data, error } = await api("@get/platform/admin/legal/acceptances", {
		auth: session.auth,
		query: { businessId },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The acceptance records didn't load") };
	return { ok: true, data: data.data };
}

/** Admin: the same records as the server's CSV, handed back as text for the screen to save. */
export async function exportBusinessAcceptances(businessId: string): Promise<ActionResult<{ name: string; text: string }>> {
	if (!live("platform")) return { ok: false, error: "Needs the live services" };
	const session = await withSession();
	const res = await fetch(
		`${env.NEXT_PUBLIC_API_URL}/platform/admin/legal/acceptances/export?businessId=${encodeURIComponent(businessId)}`,
		{
			headers: {
				Accept: "text/csv",
				...(session.auth ? { Authorization: `Bearer ${session.auth.token}` } : {}),
			},
			cache: "no-store",
		},
	).catch(() => null);
	if (!res) return { ok: false, error: "Can't reach the server" };
	const text = await res.text();
	if (!res.ok) {
		let message = "The export could not be made";
		try {
			const body = JSON.parse(text) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			// not JSON: keep the general sentence
		}
		return { ok: false, error: message };
	}
	const disposition = res.headers.get("Content-Disposition") ?? "";
	const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `acceptances-${businessId}.csv`;
	return { ok: true, data: { name, text } };
}

/** Admin (handover step): how the legal links were shared with the owner. Not an acceptance: the owner ticks at first sign-in. */
export async function recordLinksShared(
	businessId: string,
	input: { channel: string; sharedOn: string; note?: string },
): Promise<ActionResult<LegalRecord[]>> {
	const parsed = LinksSharedInput.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Choose how the links were shared and the date" };
	if (!live("platform")) return { ok: true, data: [] };
	const session = await withSession();
	const { data, error } = await api("@post/platform/admin/legal/businesses/:businessId/links-shared", {
		auth: session.auth,
		headers: await clientMetaHeaders(),
		params: { businessId },
		body: parsed.data,
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "That could not be recorded") };
	return { ok: true, data: data.data };
}

/** Admin: every version of every document. */
export async function loadLegalVersions(): Promise<ActionResult<LegalVersion[]>> {
	if (!live("platform")) return { ok: true, data: [] };
	const session = await withSession();
	const { data, error } = await api("@get/platform/admin/legal/documents", { auth: session.auth });
	if (error || !data) return { ok: false, error: errorMessage(error, "The documents didn't load") };
	return { ok: true, data: data.data };
}

/** Super admin: publish a new version; people accept it at their next sign-in from its effective date. */
export async function publishLegalVersion(input: {
	key: string;
	version: string;
	effectiveFrom?: string;
	material?: boolean;
	summary?: string;
}): Promise<ActionResult<LegalVersion>> {
	const parsed = PublishLegalInput.safeParse(input);
	if (!parsed.success) return { ok: false, error: "Enter the document and a version (2 to 40 characters)" };
	const session = await withSession();
	const { data, error } = await api("@post/platform/admin/legal/documents", { auth: session.auth, body: parsed.data });
	if (error || !data) return { ok: false, error: errorMessage(error, "The version could not be published") };
	return { ok: true, data: data.data };
}

/** Owner: accept the device terms for a package before it is installed (Hospio fees → Devices). */
export async function acceptDeviceTerms(packageId: string, version?: string): Promise<ActionResult<null>> {
	if (DEMO_AUTH || !live("platform")) return { ok: true, data: null };
	const session = await withSession();
	const { error } = await api("@post/platform/owner/devices/:id/accept-terms", {
		auth: session.auth,
		headers: await clientMetaHeaders(),
		params: { id: packageId },
		body: version ? { version } : {},
	});
	if (error) return { ok: false, error: errorMessage(error, "The device terms could not be accepted") };
	revalidatePath("/", "layout");
	return { ok: true, data: null };
}
