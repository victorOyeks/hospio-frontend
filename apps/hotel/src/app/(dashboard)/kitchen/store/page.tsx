import { StoreScreen } from "@/components/roles/shared-staff/store-screen";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";
import { OutletMark } from "@hospio/ui/shared/outlet-mark";

export const dynamic = "force-dynamic";

/** Kitchen · Store: the store of the outlet picked in "Serving at". */
export default async function KitchenStorePage() {
	const { outlet, peers } = await deskOutlets("KITCHEN");
	const [items, requests] = await Promise.all([
		data.inventory.items(),
		data.inventory.teamRequests("KITCHEN"),
	]);
	return (
		<StoreScreen
			items={items.filter((i) => i.storeId === outlet?.storeId)}
			requests={requests}
			team="KITCHEN"
			storeId={outlet?.storeId}
			title={`${outlet?.name ?? "Kitchen"} · store`}
			mark={
				<OutletMark
					id={outlet?.id}
					peers={peers}
					kind={outlet?.kind}
					size="lg"
					title={outlet?.name}
				/>
			}
			subtitle="Food and dry goods on the kitchen shelf"
		/>
	);
}
