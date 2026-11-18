import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { MarketersScreen } from "@/components/roles/admin/marketers";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { partnerApplicationsData } from "@hospio/api/data/partner-applications";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function MarketersPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const sp = await searchParams;
	const tab = param(sp, "tab") ?? "marketers";
	const page = pageParam(sp);
	const activeRole = adminRole(await getActiveRole());
	// Statements are money (Super admin and Finance admin): others never ask for them.
	const money = activeRole === "SUPER_ADMIN" || activeRole === "FINANCE_ADMIN";
	const appId = param(sp, "app");
	const [
		user,
		marketers,
		statements,
		commissions,
		referrals,
		applications,
		openedApplication,
		partnerDefaults,
	] = await Promise.all([
		getUser(),
		adminData.marketers.list(),
		money
			? adminData.marketers.statements({
					month: param(sp, "smonth"),
					status: param(sp, "sstatus"),
					profileId: param(sp, "sprofile"),
				})
			: Promise.resolve({
					ok: true as const,
					data: { statements: [], counts: {}, totals: {} },
				}),
		adminData.marketers.commissions({
			status: param(sp, "cstatus"),
			month: param(sp, "month"),
			page: tab === "commissions" ? page : 0,
			size: 25,
		}),
		adminData.marketers.referrals({
			page: tab === "referrals" ? page : 0,
			size: 100,
		}),
		// Always read: the tab's badge counts the applications waiting.
		partnerApplicationsData.list({
			status: param(sp, "astatus"),
			q: param(sp, "aq"),
			page: tab === "applications" ? page : 0,
			size: 25,
		}),
		appId ? partnerApplicationsData.get(appId) : Promise.resolve(null),
		partnerApplicationsData.defaults(activeRole),
	]);
	return (
		<MarketersScreen
			role={activeRole}
			marketers={marketers}
			commissions={commissions}
			statements={statements}
			referrals={referrals}
			applications={applications}
			openedApplication={openedApplication}
			partnerDefaults={partnerDefaults}
			inviterName={user?.fullName ?? "Hospio360"}
		/>
	);
}
