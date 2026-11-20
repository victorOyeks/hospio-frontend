import { redirect } from "next/navigation";
import { param, type SearchParams } from "@/components/roles/admin/params";
import { SettingsScreen } from "@/components/roles/admin/settings";
import { getTwoStep } from "@hospio/api/actions/profile";
import { getActiveRole } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	// Integrations moved to its own page (Platform → Integrations); old links to the tab land there.
	if (param(await searchParams, "tab") === "integrations")
		redirect("/dashboard/integrations");
	const [role, settings, twoStep] = await Promise.all([
		getActiveRole(),
		adminData.settings.get(),
		getTwoStep().catch(() => null),
	]);
	return (
		<SettingsScreen
			role={adminRole(role)}
			settings={settings}
			myTwoStepOn={twoStep ? twoStep.enabled : null}
		/>
	);
}
