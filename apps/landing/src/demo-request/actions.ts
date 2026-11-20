"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { CONTACT_EMAIL } from "@/components/site";
import { API_URL } from "@/config/env";
import {
	DemoRequest,
	type DemoField,
	type FieldErrors,
	fieldErrors,
	RECEIVED_MESSAGE,
	type SubmitResult,
} from "./schema";

/** platform-service's answer: the envelope, with a message per field under `data` on a 400. */
const Answer = z.object({
	status: z.boolean().optional(),
	message: z.string().nullable().optional(),
	data: z.unknown().optional(),
});

const FIELDS: DemoField[] = [
	"ownerName",
	"phone",
	"email",
	"businessName",
	"businessType",
	"city",
	"state",
	"rooms",
	"monthlySales",
	"heardFrom",
	"preferredTime",
	"message",
];

/**
 * Sends the request to platform-service (`POST /platform/public/hotel-applications`): the browser only ever talks to this site.
 * The visitor's address and browser are passed on, because the service limits how many requests one address may send in an hour
 * and keeps both with the request.
 */
export async function submitDemoRequest(input: unknown): Promise<SubmitResult> {
	const parsed = DemoRequest.safeParse(input);
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
	const trouble = `We couldn't send your request just now. Please try again in a minute, or email us at ${CONTACT_EMAIL}.`;
	try {
		const res = await fetch(`${API_URL}/platform/public/hotel-applications`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				// Believed by platform-service only from our own servers (SiteCallers); from anyone else the caller's own address counts.
				...(address ? { "X-Client-Address": address } : {}),
				"User-Agent": (h.get("user-agent") ?? "unknown").slice(0, 300),
			},
			body: JSON.stringify(parsed.data),
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
		if (res.status === 429)
			return {
				ok: false,
				error: `You've sent a few requests in a short time. Please try again in an hour, or email us at ${CONTACT_EMAIL}.`,
			};
		console.error("demo request:", res.status, message);
		return { ok: false, error: trouble };
	} catch (e) {
		console.error("demo request:", e);
		return { ok: false, error: trouble };
	}
}
