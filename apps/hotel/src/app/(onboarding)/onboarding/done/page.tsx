import { DoneStep } from "@/components/onboarding/done";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

/** All set (Figma 3165:16555). */
export default async function DonePage() {
	const { user, business, draft, version, kind, accommodation } =
		await loadOnboarding();
	return (
		<DoneStep
			key={version}
			draft={draft}
			business={business}
			kind={kind}
			accommodation={accommodation}
			ownerId={user?.id}
			firstName={(user?.fullName ?? "").split(" ")[0] || "there"}
		/>
	);
}
