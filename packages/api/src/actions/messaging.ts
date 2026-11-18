"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/** POST /messaging/notifications/read-all: everything in the bell is marked read. */
export async function markAllNotificationsRead(): Promise<
	ActionResult<number>
> {
	if (!live("messaging")) {
		await demoDelay(300);
		return { ok: true, data: 0 };
	}
	const { data, error } = await api(
		"@post/messaging/notifications/read-all",
		await withSession(),
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "Notifications could not be marked read"),
		};
	revalidatePath("/", "layout");
	return { ok: true, data: data.data };
}

/**
 * GET /messaging/channels → whatsappKinds: the kinds of message that go on WhatsApp right now (hospio-backend docs/sms-whatsapp.md,
 * common WhatsAppTemplates: booking confirmation, change, cancellation, arrival reminder, receipt, phone code; each with its template
 * approved). The one list the screens offer WhatsApp from: a stay summary, folio, typed guest message or staff message has no
 * template, so it is never offered. Empty when the API can't be reached; demo mode shows the approved set.
 */
export async function whatsAppKinds(): Promise<string[]> {
	if (!live("messaging")) {
		return [
			"BOOKING_CONFIRMATION",
			"BOOKING_CHANGED",
			"BOOKING_CANCELLED",
			"ARRIVAL_REMINDER",
			"RECEIPT",
		];
	}
	const { data } = await api(
		"@get/messaging/channels",
		await withSession(),
	).catch(() => ({ data: null }));
	return data?.data.whatsappKinds ?? [];
}
