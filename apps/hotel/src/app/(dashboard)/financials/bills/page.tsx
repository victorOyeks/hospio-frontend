import { FinanceBillsScreen } from "@/components/roles/finance/bills";
import { getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import {
	listQueryFrom,
	type SearchParamsRecord,
} from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/**
 * Finance · Bills (`?status=&q=&page=` for the list, `?owed=` for Owed to suppliers, `?bill=` opens one). Finance with Can edit
 * (or a manager or the owner) adds and pays; View only reads, as finance-service allows.
 */
export default async function FinanceBillsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	const sp = await searchParams;
	const query = listQueryFrom(sp, ["owed"]);
	const owedStatus = typeof sp.owed === "string" ? sp.owed : undefined;
	const [session, bills, owed, categories] = await Promise.all([
		getSession(),
		data.finance.bills({ q: query.q, status: query.status, page: query.page }),
		data.finance.owed(owedStatus),
		data.finance.categories(true),
	]);
	const level = session.levels.FINANCE;
	const canWrite =
		session.roleSet.includes("MANAGER") ||
		session.roleSet.includes("OWNER") ||
		level === "EDIT" ||
		level === "FULL";
	return (
		<FinanceBillsScreen
			bills={bills}
			owed={owed}
			categories={categories}
			canWrite={canWrite}
		/>
	);
}
