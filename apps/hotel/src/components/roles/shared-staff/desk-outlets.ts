import "server-only";
import { getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { seesAllOutlets } from "@hospio/api/supervisor";

/**
 * Where a bar or kitchen screen works: the outlet picked in the sidebar's "Serving at" on this device, the desk's
 * outlets (`peers`, their ids, give each its colour and icon; one outlet means no marks), and whether the
 * all-outlets view is on (Tabs and Sales, for a manager, the owner or Full access).
 */
export async function deskOutlets(desk: "KITCHEN" | "BAR") {
	const session = await getSession();
	const canSeeAll = seesAllOutlets(session, desk);
	const d = await data.outlets.desk(desk, canSeeAll);
	return { ...d, canSeeAll, peers: d.outlets.map((o) => o.id) };
}
