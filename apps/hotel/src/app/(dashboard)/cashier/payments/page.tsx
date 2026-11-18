import { MyPaymentsPage } from "@/components/roles/shared-staff/my-payments-page";
import type { SearchParamsRecord } from "@hospio/api/data/paging";

export const dynamic = "force-dynamic";

/** Cashier · My payments: the cashier desk's payments, paged by payment-service. */
export default function CashierPaymentsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	return (
		<MyPaymentsPage searchParams={searchParams} desk="CASHIER" roleTitle="Cashier" />
	);
}
