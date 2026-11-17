import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { OutletSwitch } from "@/components/roles/shared-staff/outlet-switch";
import { getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function KitchenMenuPage() {
	const [outlet, session, outlets] = await Promise.all([
		data.outlets.forRole("KITCHEN"),
		getSession(),
		data.outlets.list(),
	]);
	// Full access on the desk (head chef, bar lead) manages the menu; Edit marks sold out and asks for prices.
	const canManage = session.levels.KITCHEN === "FULL";
	if (!outlet)
		return (
			<MenuScreen
				menu={[]}
				outlet={{ id: "", name: "Restaurant", kind: "KITCHEN" }}
				categories={[]}
			/>
		);
	const [menu, categories, items] = await Promise.all([
		data.outlets.menu(outlet.id, canManage),
		data.outlets.categories(outlet.id),
		data.inventory.items(),
	]);
	return (
		<>
			<OutletSwitch
				desk="KITCHEN"
				outlets={await data.outlets.forRoleAll("KITCHEN")}
				current={outlet?.id}
			/>
			<MenuScreen
				menu={menu}
				outlet={outlet}
				canManage={canManage}
				outlets={outlets}
				categories={categories}
				stock={items.filter((i) => i.storeId === outlet.storeId)}
			/>
		</>
	);
}
