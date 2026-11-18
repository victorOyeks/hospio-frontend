import { Suspense } from "react";
import { BillingScreen } from "@/components/roles/owner/billing";
import { myInvoices } from "@hospio/api/actions/billing";

export const dynamic = "force-dynamic";

/** Manager · Billing & invoices: Hospio360's monthly invoices, read-only, their locations' lines; the owner pays. */
export default async function Page() {
	const r = await myInvoices();
	return (
		<Suspense fallback={null}>
			<BillingScreen invoices={r.ok ? r.data : []} error={r.ok ? null : r.error} audience="manager" />
		</Suspense>
	);
}
