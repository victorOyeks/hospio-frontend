import { TwoStepRequired } from "@hospio/ui/screens/two-step-required";
import { getSession } from "@hospio/api/dal";

export const dynamic = "force-dynamic";

/**
 * "Require 2-step sign-in for every admin" (hospio-backend docs/sign-in.md): the middleware keeps a staff session limited to
 * setting up 2-step on this page until it is on.
 */
export default async function SetupTwoStepPage() {
	const session = await getSession();
	return <TwoStepRequired email={session.email} />;
}
