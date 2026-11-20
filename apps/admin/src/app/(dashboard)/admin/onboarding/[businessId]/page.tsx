import { notFound } from "next/navigation";
import { FromApplicationBanner } from "@/components/roles/admin/hotel-applications";
import { OnboardingWizard } from "@/components/roles/admin/onboarding/wizard";
import { hotelApplicationsData } from "@hospio/api/data/hotel-applications";
import { getActiveRole } from "@hospio/api/dal";
import { data } from "@hospio/api/data";
import type { TerminalRow } from "@hospio/api/data/types";
import { adminRole } from "../../role";

export const dynamic = "force-dynamic";

/** The 10-step back-office wizard for one business (J2–J14). */
export default async function OnboardingWizardPage({
	params,
	searchParams,
}: {
	params: Promise<{ businessId: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { businessId } = await params;
	// Started from a hotel application (Start onboarding): its details stay in view above the wizard.
	const applicationId = (await searchParams).application;
	const [role, business, draft, hotels, users, templates, admins, application] =
		await Promise.all([
			getActiveRole(),
			data.platform.business(businessId),
			data.platform.onboardingFor(businessId),
			data.platform.businessHotels(businessId),
			data.platform.businessUsers(businessId),
			data.setupTemplates.list(),
			data.platform.adminUsers(),
			typeof applicationId === "string"
				? hotelApplicationsData.get(applicationId)
				: Promise.resolve(null),
		]);
	if (!business) notFound();
	const terminalLists = await Promise.all(
		hotels.map((h) => data.terminals.list(h.id)),
	);
	const terminals: Record<string, TerminalRow[]> = {};
	hotels.forEach((h, i) => {
		terminals[h.id] = terminalLists[i] ?? [];
	});
	const wizard = (
		<OnboardingWizard
			role={adminRole(role)}
			business={business}
			draft={draft}
			hotels={hotels}
			users={users}
			terminals={terminals}
			templates={templates}
			admins={admins}
		/>
	);
	if (!application || application.businessId !== businessId) return wizard;
	return (
		<div className="flex flex-col gap-4">
			<FromApplicationBanner application={application} />
			{wizard}
		</div>
	);
}
