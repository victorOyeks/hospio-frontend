import type { PropsWithChildren } from "react";
import { OnboardingShell } from "@/components/onboarding/shell";
import { DeliveryNotice } from "@hospio/ui/shared/delivery-notice";
import { getBusiness } from "@hospio/api/dal";
import { hasAccommodation } from "@hospio/api/venue";

/** The owner's self-serve wizard and the handover review share this frame (no sidebar, no role needed). */
export default async function OnboardingLayout({ children }: PropsWithChildren) {
	// The step bar names the steps for the kind of business (a lounge's step 3 is Outlets, docs/plan-venue-type.md).
	const business = await getBusiness().catch(() => null);
	const first = business?.hotels?.[0];
	return (
		<>
			<OnboardingShell
				kind={business?.venueKind ?? null}
				accommodation={first ? hasAccommodation(first) : undefined}
			>
				{children}
			</OnboardingShell>
			<DeliveryNotice />
		</>
	);
}
