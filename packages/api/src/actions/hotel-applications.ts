"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import type { HotelApplicationRow, HotelApplicationStatus } from "@hospio/api/data/hotel-application-types";
import { toHotelApplicationRow } from "@hospio/api/data/hotel-applications";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * Hotel applications (hospio-backend docs/onboarding.md, "Applications"): change the status, add a note, assign, set the meeting
 * and link the business onboarded from it. Super admin and Support; the server refuses anyone else.
 */

type Result = Promise<ActionResult<HotelApplicationRow>>;

const demoNote = (a: HotelApplicationRow, body: string, kind: "NOTE" | "STATUS" | "SYSTEM" = "NOTE"): HotelApplicationRow => ({
	...a,
	notes: [...a.notes, { id: `n-${Date.now()}`, kind, body, authorName: "Demo Admin", createdAt: new Date().toISOString() }],
});

function done(res: { data: Parameters<typeof toHotelApplicationRow>[0] }): ActionResult<HotelApplicationRow> {
	revalidatePath("/admin/hotel-applications");
	return { ok: true, data: toHotelApplicationRow(res.data) };
}

/** PUT …/{id}/status: MEETING_BOOKED needs meetingAt (here or saved); DECLINED needs a reason. */
export async function changeHotelApplicationStatus(
	a: HotelApplicationRow,
	input: { status: Exclude<HotelApplicationStatus, "ONBOARDED">; meetingAt?: string | null; reason?: string; note?: string },
): Result {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: demoNote({ ...a, status: input.status, meetingAt: input.meetingAt ?? a.meetingAt }, `→ ${input.status}`, "STATUS") };
	}
	const { data, error } = await api("@put/platform/admin/hotel-applications/:id/status", {
		...(await withSession()),
		params: { id: a.id },
		body: { status: input.status, meetingAt: input.meetingAt ?? null, reason: input.reason ?? null, note: input.note ?? null },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The status could not be changed") };
	return done(data);
}

/** POST …/{id}/notes: append-only. */
export async function addHotelApplicationNote(a: HotelApplicationRow, text: string): Result {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: demoNote(a, text) };
	}
	const { data, error } = await api("@post/platform/admin/hotel-applications/:id/notes", {
		...(await withSession()),
		params: { id: a.id },
		body: { text },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The note could not be added") };
	return done(data);
}

/** PUT …/{id}/assignee: a super admin or support admin; empty unassigns. */
export async function assignHotelApplication(a: HotelApplicationRow, assigneeId: string | null): Result {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: { ...a, assigneeId: assigneeId ?? undefined } };
	}
	const { data, error } = await api("@put/platform/admin/hotel-applications/:id/assignee", {
		...(await withSession()),
		params: { id: a.id },
		body: { assigneeId: assigneeId || null },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The assignee could not be saved") };
	return done(data);
}

/** PUT …/{id}/meeting: an ISO instant, or null to clear it. */
export async function setHotelApplicationMeeting(a: HotelApplicationRow, meetingAt: string | null): Result {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: { ...a, meetingAt: meetingAt ?? undefined } };
	}
	const { data, error } = await api("@put/platform/admin/hotel-applications/:id/meeting", {
		...(await withSession()),
		params: { id: a.id },
		body: { meetingAt },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The meeting could not be saved") };
	return done(data);
}

/** POST …/{id}/link: the business created from this application; the application becomes ONBOARDED. */
export async function linkHotelApplication(applicationId: string, businessId: string): Promise<ActionResult<HotelApplicationRow | null>> {
	if (!live("platform")) {
		await demoDelay(300);
		return { ok: true, data: null };
	}
	const { data, error } = await api("@post/platform/admin/hotel-applications/:id/link", {
		...(await withSession()),
		params: { id: applicationId },
		body: { businessId },
	});
	if (error || !data) return { ok: false, error: errorMessage(error, "The business could not be linked to the application") };
	return done(data);
}
