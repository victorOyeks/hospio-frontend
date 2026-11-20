import { HotelApplicationsScreen } from "@/components/roles/admin/hotel-applications";
import { param, type SearchParams } from "@/components/roles/admin/params";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import { hotelApplicationsData } from "@hospio/api/data/hotel-applications";
import { listQueryFrom } from "@hospio/api/data/paging";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/**
 * Admin · Hotel applications: the "Book a demo" requests (hospio-backend docs/onboarding.md, "Applications"), paged by
 * platform-service (`?status=&q=&page=`, Open by default), and the one in `?app=` with its timeline.
 */
export default async function HotelApplicationsPage({ searchParams }: { searchParams: SearchParams }) {
	const sp = await searchParams;
	const query = listQueryFrom(sp);
	const status = query.status === "ALL" ? undefined : (query.status ?? "OPEN");
	const appId = param(sp, "app");
	const [role, result, opened, marketers, admins] = await Promise.all([
		getActiveRole(),
		hotelApplicationsData.list({ status, q: query.q, page: query.page, size: 25 }),
		appId ? hotelApplicationsData.get(appId) : Promise.resolve(null),
		data.platform.marketers(),
		data.platform.adminUsers(),
	]);
	const permissions = await hotelApplicationsData.permissions(adminRole(role));
	return (
		<HotelApplicationsScreen
			result={result}
			opened={opened}
			permissions={permissions}
			marketers={marketers}
			admins={admins}
		/>
	);
}
