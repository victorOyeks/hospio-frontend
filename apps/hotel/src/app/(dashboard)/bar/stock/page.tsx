import { BarStockScreen } from "@/components/roles/bar/stock";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { data } from "@hospio/api/data";
import { OutletMark } from "@hospio/ui/shared/outlet-mark";

export const dynamic = "force-dynamic";

/** Bar · Stock: the store of the outlet picked in "Serving at". */
export default async function BarStockPage() {
	const { outlet, peers } = await deskOutlets("BAR");
	const [items, requests] = await Promise.all([
		data.inventory.items(),
		data.inventory.teamRequests("BAR"),
	]);
	return (
		<BarStockScreen
			items={items.filter((i) => i.storeId === outlet?.storeId)}
			requests={requests}
			storeId={outlet?.storeId}
			title={`${outlet?.name ?? "Bar"} · stock`}
			mark={
				<OutletMark
					id={outlet?.id}
					peers={peers}
					kind="BAR"
					size="lg"
					title={outlet?.name}
				/>
			}
		/>
	);
}
