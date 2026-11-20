import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { AuthForm } from "@hospio/ui/screens/auth-form";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ from?: string; next?: string; reason?: string }>;
}) {
	const { from, next, reason } = await searchParams;
	return (
		<>
			<AuthForm from={from ?? next} reason={reason} />
			{DEMO_AUTH && (
				<p className="mt-6 rounded-[10px] bg-info-soft px-4 py-3 text-xs text-info">
					<span className="font-semibold">Demo mode.</span> Any email and password sign you in with every role, on sample data for Ivory Court Hotels. Pick a role on the next screen.
				</p>
			)}
		</>
	);
}
