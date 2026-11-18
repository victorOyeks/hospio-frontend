import { notFound } from "next/navigation";
import { AcceptanceTab } from "@/components/roles/admin/business-tabs/acceptance";
import { loadBusinessAcceptances } from "@hospio/api/actions/legal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Business · Acceptance: every legal acceptance of the business and how the links were shared (hospio-backend docs/legal-acceptance.md). */
export default async function BusinessAcceptancePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	const records = await loadBusinessAcceptances(id);
	return (
		<AcceptanceTab
			businessId={id}
			businessName={business.name}
			records={records.ok ? records.data : []}
			error={records.ok ? null : records.error}
		/>
	);
}
