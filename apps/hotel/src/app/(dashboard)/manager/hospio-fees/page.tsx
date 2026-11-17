import { HospioFees } from "@/components/roles/owner/hospio-fees";
import { hotelDailyFees } from "@hospio/api/actions/daily-fees";
import { monthRange } from "../../hotel-owner/hospio-fees/month";

export const dynamic = "force-dynamic";

/** Manager · Hospio fees: the hotel's daily sales and Hospio360's fee, read-only (debited automatically, nothing to pay). */
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
	const { month, from, to } = monthRange((await searchParams).month);
	const r = await hotelDailyFees(from, to);
	return <HospioFees days={r.ok ? r.data : []} error={r.ok ? null : r.error} month={month} audience="manager" />;
}
