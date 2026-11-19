import { redirect } from "next/navigation";
import { logout } from "@hospio/api/actions/auth";
import { myInvoices } from "@hospio/api/actions/billing";
import { mySuspension } from "@hospio/api/actions/suspension";
import { getBusiness, getSession, getUser } from "@hospio/api/dal";
import { getDeviceToken } from "@hospio/api/device";
import { SuspendedScreen } from "@hospio/ui/screens/suspended";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account suspended · Hospio360" };

/**
 * "This account is suspended" (hospio-backend docs/suspension.md): where everyone at a suspended business lands, whatever page
 * they asked for. Not suspended (or lifted since): back to the dashboard. Hospio360 support viewing as the owner never sees it.
 */
export default async function SuspendedPage({
	searchParams,
}: {
	searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
	const [session, user, params] = await Promise.all([getSession(), getUser(), searchParams]);
	if (!user) redirect("/auth");
	if (session.actedBy || !user.businessId) redirect("/dashboard");
	const status = await mySuspension();
	if (!status.suspended) redirect("/dashboard");
	const owner = user.roles.includes("OWNER");
	const [business, invoices, deviceToken] = await Promise.all([
		getBusiness().catch(() => null),
		owner ? myInvoices() : Promise.resolve(null),
		getDeviceToken().catch(() => null),
	]);
	return (
		<SuspendedScreen
			status={status}
			owner={owner}
			businessName={business?.name ?? null}
			invoices={invoices?.ok ? invoices.data : []}
			invoicesError={invoices && !invoices.ok ? invoices.error : null}
			reference={params.reference ?? params.trxref ?? null}
			onDevice={!!deviceToken}
			signOut={logout}
		/>
	);
}
