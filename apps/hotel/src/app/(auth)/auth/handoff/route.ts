import type { NextRequest } from "next/server";
import { handoffRoute } from "@hospio/api/handoff";

/** Arriving from the other app with a one-time code (hospio-backend docs/sign-in.md); see packages/api/src/handoff.ts. */
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
	return handoffRoute(request);
}
