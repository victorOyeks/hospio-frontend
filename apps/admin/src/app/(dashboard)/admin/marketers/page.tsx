import {
	pageParam,
	param,
	type SearchParams,
} from "@/components/roles/admin/params";
import { MarketersScreen } from "@/components/roles/admin/marketers";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
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
	const [user, marketers, statements, commissions, referrals] = await Promise.all([
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
	]);
	return (
		<MarketersScreen
			role={activeRole}
			marketers={marketers}
			commissions={commissions}
			statements={statements}
			referrals={referrals}
			inviterName={user?.fullName ?? "Hospio360"}
		/>
	);
}
