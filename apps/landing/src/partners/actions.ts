"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/components/site";
import { getLegalDocument } from "@/legal/documents";
import {
	type FieldErrors,
	fieldErrors,
	PartnerApplication,
	type PartnerField,
	RECEIVED_MESSAGE,
	type SubmitResult,
} from "./schema";

const API_URL = (
	process.env.NEXT_PUBLIC_API_URL ?? "https://api-staging.hospio360.com"
).replace(/\/+$/, "");

/** platform-service's answer: the envelope, with a message per field under `data` on a 400. */
const Answer = z.object({
	status: z.boolean().optional(),
	message: z.string().nullable().optional(),
	data: z.unknown().optional(),
});

const FIELDS: PartnerField[] = [
	"fullName",
	"email",
	"phone",
	"city",
	"state",
	"businessKinds",
	"businessCount",
	"networkNote",
	"companyName",
	"acceptedTerms",
];

/**
 * Sends the application to platform-service (`POST /platform/public/partner-applications`): the browser only ever talks to
 * this site. The visitor's address and browser are passed on, because the service limits how many applications one address
 * may send in an hour and keeps both with the application.
 */
export async function submitPartnerApplication(
	input: unknown,
): Promise<SubmitResult> {
	const parsed = PartnerApplication.safeParse(input);
	if (!parsed.success)
		return {
			ok: false,
			error: "Please check the highlighted fields.",
			fields: fieldErrors(parsed.error),
		};
	const h = await headers();
	// Behind Cloudflare the visitor's address is in CF-Connecting-IP; otherwise the first hop nginx recorded.
	const address =
		h.get("cf-connecting-ip")?.trim() ||
		h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		h.get("x-real-ip");
	const trouble = `We couldn't send your application just now. Please try again in a minute, or email us at ${CONTACT_EMAIL}.`;
	try {
		const res = await fetch(`${API_URL}/platform/public/partner-applications`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				// Believed by platform-service only from our own servers (SiteCallers); from anyone else the caller's own address counts.
				...(address ? { "X-Client-Address": address } : {}),
				"User-Agent": (h.get("user-agent") ?? "unknown").slice(0, 300),
			},
			body: JSON.stringify({
				...parsed.data,
				// The versions of the two documents this site shows beside the tick box.
				rpaVersion: getLegalDocument("referral-partners")?.version,
				privacyVersion: getLegalDocument("privacy")?.version,
			}),
			cache: "no-store",
			signal: AbortSignal.timeout(15_000),
		});
		const body = Answer.safeParse(await res.json().catch(() => null));
		const message = body.success ? (body.data.message ?? "") : "";
		if (res.ok) return { ok: true, message: message || RECEIVED_MESSAGE };
		if (res.status === 400) {
			const fields: FieldErrors = {};
			const sent = body.success ? body.data.data : null;
			if (sent && typeof sent === "object")
				for (const f of FIELDS) {
					const m = (sent as Record<string, unknown>)[f];
					if (typeof m === "string") fields[f] = m;
				}
			return {
				ok: false,
				error: Object.keys(fields).length
					? "Please check the highlighted fields."
					: message || trouble,
				fields,
			};
		}
		// The site's own sentence, so the address to write to is the one this site gives everywhere else.
		if (res.status === 429)
			return {
				ok: false,
				error: `You've sent a few applications in a short time. Please try again in an hour, or email us at ${CONTACT_EMAIL}.`,
			};
		console.error("partner application:", res.status, message);
		return { ok: false, error: trouble };
	} catch (e) {
		console.error("partner application:", e);
		return { ok: false, error: trouble };
	}
}
