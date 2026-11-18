import { Suspense } from "react";
import { BillingScreen } from "@/components/roles/owner/billing";
import { myInvoices } from "@hospio/api/actions/billing";

export const dynamic = "force-dynamic";

/** Hotel Owner · Billing & invoices: Hospio360's monthly invoices, Pay now (hospio-backend docs/plan-monthly-invoices.md). */
export default async function Page() {
	const r = await myInvoices();
	return (
		<Suspense fallback={null}>
			<BillingScreen invoices={r.ok ? r.data : []} error={r.ok ? null : r.error} />
		</Suspense>
	);
}
