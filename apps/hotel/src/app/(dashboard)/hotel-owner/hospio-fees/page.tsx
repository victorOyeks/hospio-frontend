import { HospioFees } from "@/components/roles/owner/hospio-fees";
import { ownerDailyFees } from "@hospio/api/actions/daily-fees";
import { ownerDevicePackages } from "@hospio/api/actions/device-packages";
import { monthRange } from "./month";

export const dynamic = "force-dynamic";

/** Hotel Owner · Hospio fees: this month so far, each day's sales and Hospio360's fee, billed on the monthly invoice (hospio-backend docs/plan-monthly-invoices.md). */
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
	const { month, from, to } = monthRange((await searchParams).month);
	const [r, d] = await Promise.all([ownerDailyFees(from, to), ownerDevicePackages()]);
	return <HospioFees days={r.ok ? r.data : []} error={r.ok ? null : r.error} month={month} devices={d.ok ? d.data : []} />;
}
