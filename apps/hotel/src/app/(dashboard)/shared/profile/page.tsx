import { redirect } from "next/navigation";
import { ProfileScreen } from "@hospio/ui/screens/profile";
import {
	getEmailPrefs,
	getTwoStep,
	listSessions,
} from "@hospio/api/actions/profile";
import { getActiveRole, getUser } from "@hospio/api/dal";
import { loadMyLegal, loadOwnerAcceptances } from "@hospio/api/actions/legal";

export const dynamic = "force-dynamic";

/** Everywhere · My profile & security, served for every role at /dashboard/profile (docs/profile.md in hospio-backend). */
export default async function ProfilePage() {
	const [user, role, sessions, twoStep, emailPrefs, legal] = await Promise.all([
		getUser(),
		getActiveRole(),
		listSessions(),
		getTwoStep(),
		getEmailPrefs(),
		loadMyLegal().catch(() => null),
	]);
	// The owner sees every acceptance of the business (hospio-backend docs/legal-acceptance.md).
	const businessRecords = user?.roles.includes("OWNER") ? await loadOwnerAcceptances().catch(() => null) : null;
	if (!user) redirect("/auth");
	return (
		<ProfileScreen
			user={user}
			role={role}
			sessions={sessions}
			twoStep={twoStep}
			emailPrefs={emailPrefs}
			legal={legal}
			businessRecords={businessRecords}
		/>
	);
}
