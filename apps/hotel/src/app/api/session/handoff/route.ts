import type { NextRequest } from "next/server";
import { wrongAppRoute } from "@hospio/api/handoff";

/** A session of the other app's account found here: handed over once, never kept (packages/api/src/handoff.ts). */
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
	return wrongAppRoute(request);
}
