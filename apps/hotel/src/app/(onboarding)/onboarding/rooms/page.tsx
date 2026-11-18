import { OutletsStep } from "@/components/onboarding/step-outlets";
import { RoomsStep } from "@/components/onboarding/step-rooms";
import { onboardingOutlets } from "@hospio/api/actions/onboarding";
import { loadOnboarding } from "../load";

export const dynamic = "force-dynamic";

/** Step 3: Rooms & prices where the first location has rooms; Outlets at a lounge, bar or restaurant (docs/plan-venue-type.md). */
export default async function Page() {
	const load = await loadOnboarding();
	if (!load.accommodation) {
		const hotelId = load.draft.hotel?.hotelId;
		const existing = hotelId ? await onboardingOutlets(hotelId) : null;
		return (
			<OutletsStep
				key={load.version}
				draft={load.draft}
				kind={load.kind}
				existing={existing?.ok ? existing.data : []}
			/>
		);
	}
	return (
		<RoomsStep
			key={load.version}
			business={load.business}
			draft={load.draft}
			user={load.user}
		/>
	);
}
