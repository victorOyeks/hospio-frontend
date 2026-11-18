"use server";

import { api } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { live } from "@hospio/api/data/live";
import { staffOutletsMap } from "./bill";

/**
 * What the "Outlets" picker on Add staff and Edit staff needs for one location (hospio-backend docs/plan-venue-type.md, phase 4):
 * its outlets and who is kept to which (user id → outlet ids; a person not listed works every outlet). `hotelId` is for the owner
 * and for Hospio360 during onboarding, who act on a location other than the one they are in.
 */
export type StaffOutletChoices = {
	outlets: { id: string; name: string; kind: string }[];
	assigned: Record<string, string[]>;
};

export async function staffOutletChoices(hotelId?: string): Promise<StaffOutletChoices> {
	if (!live("fnb")) return { outlets: [], assigned: {} };
	const [outlets, assigned] = await Promise.all([
		api("@get/fnb/outlets", await withSession(hotelId ? { hotelId } : undefined))
			.then((r) => (r.data?.data ?? []).map((o) => ({ id: o.id, name: o.name, kind: o.kind })))
			.catch(() => []),
		staffOutletsMap(hotelId),
	]);
	return { outlets, assigned };
}
