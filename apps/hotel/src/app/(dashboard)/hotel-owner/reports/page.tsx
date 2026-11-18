import { OwnerReports } from "@/components/roles/owner/reports";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

/** Hotel Owner · 07 Reports: built from live data, downloaded as CSV, scheduled on platform-service (docs/owner-portal.md). */
export default async function Page() {
	const [hotels, reports] = await Promise.all([
		data.owner.hotelList(),
		data.owner.reports(),
	]);
	// The Tips report is listed only where a location records tips (Hotel setup → Restaurant & bar).
	const tips = await Promise.all(hotels.map((h) => data.outlets.recordsTips(h.id).catch(() => false)));
	return (
		<OwnerReports
			hotels={hotels.map((h, i) => ({ hotelId: h.id, name: h.name, hasAccommodation: h.hasAccommodation, recordTips: tips[i] }))}
			schedules={reports.schedules}
			runs={reports.runs}
		/>
	);
}
