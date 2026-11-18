import { HospioFees } from "@/components/roles/owner/hospio-fees";
import { hotelDailyFees } from "@hospio/api/actions/daily-fees";
import { hotelDevices } from "@hospio/api/actions/device-packages";
import { monthRange } from "../../hotel-owner/hospio-fees/month";

export const dynamic = "force-dynamic";

/** Manager · Hospio fees: the hotel's daily sales and Hospio360's fee, read-only (billed on the owner's monthly invoice, nothing to pay here). */
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
	const { month, from, to } = monthRange((await searchParams).month);
	const [r, d] = await Promise.all([hotelDailyFees(from, to), hotelDevices()]);
	return (
		<HospioFees
			days={r.ok ? r.data : []}
			error={r.ok ? null : r.error}
			month={month}
			audience="manager"
			devices={d.ok && d.data ? [d.data] : []}
		/>
	);
}
