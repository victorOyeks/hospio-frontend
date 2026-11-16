"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { adminData, toIntegrationCard } from "@hospio/api/data/admin";
import type { IntegrationCard, IntegrationsData } from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * Platform → Integrations (super admin): each provider's keys, saved encrypted by platform-service; the services read them
 * within a minute. A save sends only the fields that changed and lists in `clear` the ones going back to the server's value.
 */

export async function loadIntegrations(): Promise<IntegrationsData> {
	return adminData.integrations();
}

export async function saveIntegration(
	provider: string,
	fields: Record<string, string>,
	clear: string[],
	/** Demo mode only: the card as shown, so the echo keeps its labels. */
	current?: IntegrationCard,
): Promise<ActionResult<IntegrationCard>> {
	if (!live("platform")) {
		await demoDelay(300);
		if (!current) return { ok: false, error: "Nothing to save" };
		return {
			ok: true,
			data: {
				...current,
				updatedByName: "You",
				updatedAt: new Date().toISOString(),
				fields: current.fields.map((f) =>
					clear.includes(f.key)
						? { ...f, value: null, saved: false }
						: f.key in fields
							? {
									...f,
									saved: true,
									value: f.type === "SECRET" ? `••••••••${fields[f.key].slice(-4)}` : fields[f.key],
								}
							: f,
				),
			},
		};
	}
	try {
		const { data, error } = await api("@put/platform/admin/integrations/:provider", {
			...(await withSession()),
			params: { provider },
			body: { fields, clear },
		});
		return error || !data
			? { ok: false, error: errorMessage(error, "The keys could not be saved") }
			: { ok: true, data: toIntegrationCard(data.data) };
	} catch {
		return { ok: false, error: "The server's answer could not be read. Reload the page to see what was saved." };
	}
}

export async function testIntegration(provider: string): Promise<ActionResult<{ ok: boolean; message: string }>> {
	if (!live("platform")) {
		await demoDelay(500);
		return { ok: true, data: { ok: true, message: "Demo: the provider answered" } };
	}
	try {
		const { data, error } = await api("@post/platform/admin/integrations/:provider/test", {
			...(await withSession()),
			params: { provider },
		});
		return error || !data
			? { ok: false, error: errorMessage(error, "The test could not be run") }
			: { ok: true, data: { ok: data.data.ok, message: data.data.message ?? (data.data.ok ? "Connected" : "It didn't connect") } };
	} catch {
		return { ok: false, error: "The test answer could not be read" };
	}
}
