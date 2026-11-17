import { notFound } from "next/navigation";
import { MoneyTab } from "@/components/roles/admin/business-tabs/money";
import { data } from "@hospio/api/data";
import { adminDailyFees } from "@hospio/api/actions/daily-fees";
import { businessDevicePackages } from "@hospio/api/actions/device-packages";
import { adminData } from "@hospio/api/data/admin";

export const dynamic = "force-dynamic";

export default async function BusinessMoneyPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const business = await data.platform.business(id);
	if (!business) notFound();
	// A daily-fee business (1.5 % of each day's sales, debited from its POS provider account) has no monthly statements: its
	// Money tab shows this month's days instead.
	const daily = business.feeModelKey === "PERCENT_OF_SALES";
	const now = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
	const [statements, settlements, summary, days, devices] = await Promise.all([
		daily ? Promise.resolve({ content: [] }) : adminData.fees.statements({ businessId: id, size: 24 }),
		adminData.payments.settlements({ businessId: id, size: 30 }),
		adminData.payments.summary({ businessId: id }),
		daily ? adminDailyFees({ businessId: id, from: `${now.slice(0, 7)}-01`, to: now }) : Promise.resolve(null),
		businessDevicePackages(id),
	]);
	return (
		<MoneyTab
			businessId={id}
			businessName={business.name}
			statements={statements.content}
			settlements={settlements.content}
			summary={summary}
			dailyFees={days ? (days.ok ? days.data : []) : null}
			dailyFeesError={days && !days.ok ? days.error : null}
			feeRate={business.feeValue}
			devicePackages={devices.ok ? devices.data : []}
		/>
	);
}
