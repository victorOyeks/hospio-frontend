import { HospioFees } from "@/components/roles/owner/hospio-fees";
import { ownerDailyFees } from "@hospio/api/actions/daily-fees";

export const dynamic = "force-dynamic";

/** Hotel Owner · Hospio fees: each day's sales and Hospio360's fee, debited at 6am (hospio-backend docs/plan-daily-fees.md). */
export default async function Page() {
	const r = await ownerDailyFees();
	return <HospioFees days={r.ok ? r.data : []} error={r.ok ? null : r.error} />;
}
