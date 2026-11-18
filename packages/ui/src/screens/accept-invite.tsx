import { ClockIcon, MailXIcon } from "lucide-react";
import Link from "next/link";
import { getInvite } from "@hospio/api/actions/onboarding";
import { APP } from "@hospio/api/app";
import { getUser } from "@hospio/api/dal";
import { AcceptInviteForm } from "@hospio/ui/screens/accept-invite-form";

/**
 * /accept-invite?token= in both apps (Figma 3167:16201). Identity sends hotel people to the hotel app and platform
 * staff and marketers to the admin app (DeliveryComposer.appUrl). The invite is read first; an unknown (404),
 * expired or used (410) one gets a message and a way on instead of the form.
 */
export async function AcceptInviteScreen({ token }: { token?: string }) {
	if (!token)
		return (
			<InviteProblem
				title="This invite link is incomplete"
				body="Open the link exactly as it was sent to you, or ask for a new invite."
			/>
		);
	const result = await getInvite(token);
	if (!result.ok) {
		const expired = /expired|used/i.test(result.error);
		return (
			<InviteProblem
				title={
					expired
						? "This invite has expired or was already used"
						: "This invite link is not valid"
				}
				body={
					expired
						? "Invites work for 7 days and once. If you already chose a password, sign in with it; otherwise ask for a new invite."
						: "Check the link, or ask the person who invited you to send it again."
				}
				expired={expired}
			/>
		);
	}
	if (result.data.accepted)
		return (
			<InviteProblem
				title="This invite was already accepted"
				body={
					APP === "admin"
						? "Sign in with the password you chose. Forgot it? Ask a Hospio360 admin to reset it."
						: "Sign in with the password you chose. Forgot it? Ask your manager or owner to reset it."
				}
				expired
			/>
		);
	// Accepting signs the invited person in on this browser, replacing whoever is signed in here.
	const current = await getUser().catch(() => null);
	const other =
		current && current.email.toLowerCase() !== result.data.email.toLowerCase()
			? current
			: null;
	return (
		<>
			{other && (
				<p className="mb-4 rounded-[10px] bg-warning-soft px-4 py-3 text-[13px] text-warning">
					You're signed in on this browser as {other.fullName} ({other.email}).
					Accepting signs them out here and signs in {result.data.fullName}. To
					keep both, open this link in a private window or another browser.
				</p>
			)}
			<AcceptInviteForm token={token} invite={result.data} />
		</>
	);
}

function InviteProblem({
	title,
	body,
	expired,
}: {
	title: string;
	body: string;
	expired?: boolean;
}) {
	const Icon = expired ? ClockIcon : MailXIcon;
	return (
		<div className="flex flex-col gap-4">
			<span className="flex size-10 items-center justify-center rounded-xl bg-warning-soft text-warning">
				<Icon className="size-5" />
			</span>
			<div>
				<h1 className="text-[28px] font-bold text-ink">{title}</h1>
				<p className="mt-2 text-sm text-ink-2">{body}</p>
			</div>
			<p className="rounded-[10px] bg-subtle px-4 py-3 text-[13px] text-ink-2">
				<span className="font-semibold text-ink">Ask for a new invite.</span>{" "}
				{APP === "admin"
					? "Hospio360 team members: a super admin can resend it from Team → Resend invite. Marketers: ask your Hospio360 contact to send a fresh link."
					: "The owner (Users → Resend invite) or your manager (Staff → Reset password) can send a fresh link and temporary password."}
			</p>
			<Link
				href="/auth"
				className="text-center text-[13px] font-semibold text-brand hover:underline"
			>
				Back to sign in
			</Link>
		</div>
	);
}
