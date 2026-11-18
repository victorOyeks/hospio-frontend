import { LegalDocumentsScreen } from "@/components/roles/admin/legal-documents";
import { loadLegalVersions } from "@hospio/api/actions/legal";
import { getActiveRole } from "@hospio/api/dal";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/** Platform → Legal documents: every version of each document; a Super admin publishes a new one (hospio-backend docs/legal-acceptance.md). */
export default async function LegalDocumentsPage() {
	const [role, versions] = await Promise.all([getActiveRole(), loadLegalVersions()]);
	return (
		<LegalDocumentsScreen
			versions={versions.ok ? versions.data : []}
			error={versions.ok ? null : versions.error}
			canPublish={adminRole(role) === "SUPER_ADMIN"}
		/>
	);
}
