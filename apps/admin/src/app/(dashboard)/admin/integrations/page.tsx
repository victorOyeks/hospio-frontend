import { IntegrationsScreen } from "@/components/roles/admin/integrations";
import { getActiveRole } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { IntegrationStatusList } from "@/components/roles/admin/integrations";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/**
 * Platform → Integrations: provider keys, for a Super admin only (the menu hides it from the other roles). Anyone else who
 * opens the link still sees the connection checks, which every platform role could read on Settings before.
 */
export default async function IntegrationsPage() {
	const role = adminRole(await getActiveRole());
	if (role !== "SUPER_ADMIN") {
		const status = await adminData.integrationStatus();
		return (
			<>
				<PageHeader title="Integrations" />
				<EmptyState
					title="Only a Super admin manages integrations"
					hint="Ask a Super admin if a provider's keys need changing."
				/>
				{status.length > 0 && <IntegrationStatusList items={status} />}
			</>
		);
	}
	return <IntegrationsScreen data={await adminData.integrations()} />;
}
