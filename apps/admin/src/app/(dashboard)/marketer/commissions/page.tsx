import { MarketerCommissions } from "@/components/roles/marketer/commissions";
import { adminData } from "@hospio/api/data/admin";
import { NotAMarketer } from "../not-a-marketer";

export const dynamic = "force-dynamic";

/** Marketer · Commissions: my monthly statements and the lines waiting for the next one (`?open=` a statement). */
export default async function MarketerCommissionsPage() {
	const [me, result] = await Promise.all([
		adminData.marketer.me(),
		adminData.marketer.statements(),
	]);
	if (!me) return <NotAMarketer />;
	return <MarketerCommissions me={me} result={result} />;
}
