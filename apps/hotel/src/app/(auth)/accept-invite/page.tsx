import { AcceptInviteScreen } from "@hospio/ui/screens/accept-invite";

export const dynamic = "force-dynamic";

/** /accept-invite?token= : the shared screen (packages/ui/src/screens/accept-invite.tsx), as in the admin app. */
export default async function AcceptInvitePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	return <AcceptInviteScreen token={token} />;
}
