import Link from "next/link";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { btn } from "./ui";

/**
 * A page that needs rooms opened at a lounge, bar or restaurant (hospio-backend docs/plan-venue-type.md): a short "Not used at a
 * lounge" instead of a 404, with the way back. Rooms added in Hotel setup bring the page back.
 */
export function NotUsedHere({ place, locationName }: { place: string; locationName?: string }) {
	return (
		<>
			<PageHeader title={`Not used at ${place}`} subtitle={locationName} />
			<EmptyState
				title={`This page is for rooms and stays, and ${locationName ?? "this location"} has no rooms`}
				hint="Sales, tabs, tills, menus and stock are all on the menu. If you add rooms later in Hotel setup, room pages come back on their own."
				className="min-h-[280px] gap-3"
			>
				<Link href="/dashboard" className={btn.primary}>
					Back to the dashboard
				</Link>
			</EmptyState>
		</>
	);
}
