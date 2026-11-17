import { MenuScreen } from "@/components/roles/shared-staff/menu-screen";
import { deskOutlets } from "@/components/roles/shared-staff/desk-outlets";
import { getSession } from "@hospio/api/dal";
import { data } from "@hospio/api/data";

export const dynamic = "force-dynamic";

export default async function BarMenuPage() {
	const [{ outlet, peers }, session, outlets] = await Promise.all([
		deskOutlets("BAR"),
		getSession(),
		data.outlets.list(),
	]);
	// Full access on the desk (head chef, bar lead) manages the menu; Edit marks sold out and asks for prices.
	const canManage = session.levels.BAR === "FULL";
	if (!outlet)
		return (
			<MenuScreen
				menu={[]}
				outlet={{ id: "", name: "Bar", kind: "BAR" }}
				categories={[]}
				happyHours={[]}
			/>
		);
	const [menu, categories, happyHours, items] = await Promise.all([
		data.outlets.menu(outlet.id, canManage),
		data.outlets.categories(outlet.id),
		data.outlets.happyHours(outlet.id),
		data.inventory.items(),
	]);
	return (
		<MenuScreen
			peers={peers}
			title={`${outlet.name} · menu`}
			menu={menu}
			outlet={outlet}
			canManage={canManage}
			outlets={outlets}
			categories={categories}
			happyHours={happyHours}
			stock={items.filter((i) => i.storeId === outlet.storeId)}
		/>
	);
}
