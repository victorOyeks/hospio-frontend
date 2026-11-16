import { HotelsScreen } from "@/components/roles/admin/hotels/list";
import { getActiveRole } from "@hospio/api/dal";
import { adminData } from "@hospio/api/data/admin";
import { adminRole } from "../role";

export const dynamic = "force-dynamic";

/** Admin · every hotel across businesses; money roles then see each hotel's POS keys, fee debit and latest daily fee. */
export default async function HotelsPage() {
	const role = adminRole(await getActiveRole());
	// The fee columns (one call per hotel) are filled in from the browser so the list shows at once.
	const hotels = await adminData.hotels.directory();
	return <HotelsScreen role={role} hotels={hotels} />;
}
