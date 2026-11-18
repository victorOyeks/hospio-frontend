import { HandoverReview } from "@/components/onboarding/handover";
import { getUser } from "@hospio/api/dal";
import { ownerDevicePackages } from "@hospio/api/actions/device-packages";
import { data } from "@hospio/api/data";
import { loadMyLegal } from "@hospio/api/actions/legal";
import { onboardingOutlets } from "@hospio/api/actions/onboarding";

export const dynamic = "force-dynamic";

/** K3 · an owner onboarded by Hospio360 reviews the hotels, logins and setup, then accepts (stage → LIVE). The
 * owner's own tick of the Terms and the debit authority is recorded here (method HANDOVER, docs/legal-acceptance.md). */
export default async function HandoverPage() {
	const [user, business, hotels, users, setup, devices, legal] = await Promise.all([
		getUser(),
		data.business.mine(),
		data.hotels.list(),
		data.users.list(),
		data.hotels.setup().catch(() => []),
		ownerDevicePackages().catch(() => null),
		loadMyLegal().catch(() => null),
	]);
	// A lounge, bar or restaurant is shown with its outlets, never as "0 rooms" (hospio-backend docs/plan-venue-type.md).
	const outlets = Object.fromEntries(
		await Promise.all(
			hotels
				.filter((h) => h.hasAccommodation === false)
				.map(async (h) => {
					const r = await onboardingOutlets(h.hotelId).catch(() => null);
					return [h.hotelId, r?.ok ? r.data.map((o) => o.name) : []] as const;
				}),
		),
	);
	return (
		<HandoverReview
			outlets={outlets}
			business={business}
			hotels={hotels}
			users={users}
			firstName={(user?.fullName ?? "").split(" ")[0] || "there"}
			setupCount={setup.length}
			devices={devices?.ok ? devices.data : []}
			legal={legal?.canAccept ? legal.pending : []}
		/>
	);
}
