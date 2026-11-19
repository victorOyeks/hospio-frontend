import { SystemHealthScreen } from "@/components/roles/admin/system-health";
import { getActiveRole } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { PageHeader } from "@hospio/ui/shared/page-header";

export const dynamic = "force-dynamic";

/**
 * Platform → System health: the server, every Hospio service, the database, Kafka, Redis and certificates, read-only. Super admins
 * and Support (who take the calls when something is down) see it; a Finance admin who opens the link is told it isn't theirs, and
 * the server refuses the call for anyone else as well.
 */
export default async function SystemHealthPage() {
	const role = await getActiveRole();
	if (role !== "SUPER_ADMIN" && role !== "SUPPORT") {
		return (
			<>
				<PageHeader title="System health" />
				<EmptyState
					title="Only a Super admin or Support sees system health"
					hint="Ask a Super admin if you think the platform is having trouble."
				/>
			</>
		);
	}
	return <SystemHealthScreen initial={await adminData.systemHealth()} superAdmin={role === "SUPER_ADMIN"} />;
}
