import { AcceptInviteScreen } from "@hospio/ui/screens/accept-invite";

export const dynamic = "force-dynamic";

/** /accept-invite?token= : the shared screen (packages/ui/src/screens/accept-invite.tsx), as in the hotel app. Identity sends platform staff and marketers here. */
export default async function AcceptInvitePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	return <AcceptInviteScreen token={token} />;
}
