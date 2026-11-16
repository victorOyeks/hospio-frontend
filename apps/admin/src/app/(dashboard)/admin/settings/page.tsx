import { redirect } from "next/navigation";
import { param, type SearchParams } from "@/components/roles/admin/params";
import { SettingsScreen } from "@/components/roles/admin/settings";
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
	const [role, settings] = await Promise.all([
		getActiveRole(),
		adminData.settings.get(),
	]);
	return <SettingsScreen role={adminRole(role)} settings={settings} />;
}
