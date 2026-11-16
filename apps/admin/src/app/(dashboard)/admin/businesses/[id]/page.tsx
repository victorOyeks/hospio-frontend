import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/roles/admin/business-page";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../../role";

export const dynamic = "force-dynamic";

export default async function BusinessDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [role, business] = await Promise.all([
		getActiveRole(),
		data.platform.business(id),
	]);
	// Null means tenant-service answered 404; any other failure threw and error.tsx offers a retry.
	if (!business) notFound();
	// Statements, tickets and changes have their own tabs (Money, Support, Contract & activity) and load there.
	const [hotels, users, admins] = await Promise.all([
		data.platform.businessHotels(business.id),
		data.platform.businessUsers(business.id),
		adminData.team.list(),
	]);
	return (
		<BusinessPage
			role={adminRole(role)}
			business={business}
			hotels={hotels}
			users={users}
			admins={admins}
		/>
	);
}
