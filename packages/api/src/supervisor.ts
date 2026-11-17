import type { Session } from "./types";

/**
 * The housekeeping-service rule for supervisor-only actions (Inspect, assign, dispose of a lost & found item):
 * a manager or the owner (not read-only), or Housekeeping at Full access. Plain module so server pages and the shell can share it.
 */
export function isHousekeepingSupervisor(
	session: Pick<Session, "roleSet" | "levels" | "actedBy">,
): boolean {
	if (session.actedBy) return false;
	const manager =
		session.roleSet.includes("MANAGER") || session.roleSet.includes("OWNER");
	const managerReadOnly =
		manager &&
		(["MANAGER", "OWNER"] as const).every(
			(r) => !session.roleSet.includes(r) || session.levels[r] === "VIEW",
		);
	return (
		(manager && !managerReadOnly) || session.levels.HOUSEKEEPING === "FULL"
	);
}

/**
 * Who sees every outlet of a desk at once ("All outlets" on Tabs and Sales): a manager or the owner, or the desk at
 * Full access (bar lead, head chef). Everyone else works the one outlet picked on their device.
 */
export function seesAllOutlets(
	session: Pick<Session, "roleSet" | "levels">,
	desk: "KITCHEN" | "BAR",
): boolean {
	return (
		session.roleSet.includes("MANAGER") ||
		session.roleSet.includes("OWNER") ||
		session.levels[desk] === "FULL"
	);
}
