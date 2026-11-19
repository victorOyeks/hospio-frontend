"use server";

import type { ActionResult } from "@hospio/api/actions/auth";
import { adminData } from "@hospio/api/data/admin";
import type { SystemHealthReport } from "@hospio/api/data/admin-types";

/**
 * Platform → System health, read again: every 30 s while the page is open (the server's kept look, at most 15 s old) and on
 * "Refresh now" (`fresh`: a new look, at most one every 5 s). Super admin and Support only; the server refuses anyone else.
 */
export async function loadSystemHealth(fresh = false): Promise<ActionResult<SystemHealthReport>> {
	const r = await adminData.systemHealth(fresh);
	return r.ok ? { ok: true, data: r.report } : { ok: false, error: r.error };
}
