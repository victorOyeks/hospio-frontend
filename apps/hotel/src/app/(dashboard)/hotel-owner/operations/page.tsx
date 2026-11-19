import { OwnerOperations } from "@/components/roles/owner/operations";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 12 Operations + 16 Changes by Hospio360, across every hotel (docs/owner-portal.md). */
export default async function Page() {
	const [hotels, departments, activity, changes, retentionDays] = await Promise.all([
		data.owner.hotels(),
		data.owner.departments(),
		data.owner.activity(),
		data.owner.changes(),
		data.activity.retention(),
	]);
	return (
		<OwnerOperations
			hotels={hotels}
			departments={departments}
			activity={activity}
			changes={changes}
			retentionDays={retentionDays}
		/>
	);
}
