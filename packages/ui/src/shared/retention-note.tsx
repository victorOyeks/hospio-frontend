import { Clock3Icon } from "lucide-react";
import { cn } from "@hospio/ui/utils";

/**
 * The audit pages' note (owner decision, 19 Nov 2026): audit logs are kept for the platform's retention setting (7 days), then
 * deleted automatically. `days` comes from GET /platform/activity/retention.
 */
export function retentionText(days: number) {
	return `Records are kept for ${days} ${days === 1 ? "day" : "days"}, then deleted automatically to save database space.`;
}

export function RetentionNote({ days, className }: { days: number; className?: string }) {
	return (
		<p className={cn("flex items-center gap-1.5 text-xs text-ink-3", className)}>
			<Clock3Icon className="size-3.5 shrink-0" aria-hidden />
			{retentionText(days)}
		</p>
	);
}
