"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { CodesList, type TwoStepSetup, TwoStepQr } from "@hospio/ui/shared/two-step";
import { enableTwoStep, logout, renewAfterTwoStepSetup, startTwoStep } from "@hospio/api/actions";

const primary =
	"h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90";

/**
 * "Set up 2-step sign-in" (hospio-backend docs/sign-in.md, "Admin security settings"): Hospio360 requires 2-step for every admin,
 * and this person signed in without it. Their session works for nothing else (the services refuse it) until they scan the QR
 * code, confirm a code and keep their recovery codes; then the session is renewed and the console opens. Same calls as My
 * profile → Security.
 */
export function TwoStepRequired({ email }: { email: string }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [setup, setSetup] = useState<TwoStepSetup | null>(null);
	const [code, setCode] = useState("");
	const [codes, setCodes] = useState<string[] | null>(null);
	const [error, setError] = useState<string | undefined>();

	const begin = () =>
		startTransition(async () => {
			setError(undefined);
			const r = await startTwoStep();
			if (!r.ok) return setError(r.error);
			setSetup(r.data);
			setCode("");
		});

	const turnOn = () =>
		startTransition(async () => {
			setError(undefined);
			const r = await enableTwoStep(code);
			if (!r.ok) return setError(r.error);
			setCodes(r.data.recoveryCodes);
			setSetup(null);
			toast.success("2-step sign-in is on");
		});

	const carryOn = () =>
		startTransition(async () => {
			const r = await renewAfterTwoStepSetup();
			if (!r.ok) {
				toast.error(r.error);
				router.replace("/auth");
				return;
			}
			if (r.data.stillLimited) return setError("2-step sign-in isn't on yet. Try again");
			router.replace("/dashboard");
			router.refresh();
		});

	return (
		<div className="flex flex-col gap-4" data-testid="two-step-required">
			<div>
				<h1 className="text-[28px] font-bold text-ink">Set up 2-step sign-in</h1>
				<p className="mt-2 text-sm text-ink-3">
					{codes
						? "Keep these recovery codes somewhere safe. Each works once if you lose your phone."
						: "Hospio360 requires 2-step sign-in for every admin. Set it up with an authenticator app to continue."}
				</p>
			</div>

			{codes ? (
				<>
					<CodesList codes={codes} email={email} />
					<Button type="button" disabled={pending} className={primary} onClick={carryOn}>
						{pending ? <Loader2Icon className="size-4 animate-spin" /> : "I've saved them, continue"}
					</Button>
				</>
			) : setup ? (
				<>
					<TwoStepQr setup={setup} code={code} onCode={setCode} />
					<Button
						type="button"
						disabled={pending || code.replace(/\s/g, "").length !== 6}
						className={primary}
						onClick={turnOn}
					>
						{pending ? <Loader2Icon className="size-4 animate-spin" /> : "Turn on"}
					</Button>
				</>
			) : (
				<>
					<Note tone="info">
						You&apos;ll need an authenticator app on your phone, such as Google Authenticator, Microsoft Authenticator or
						1Password.
					</Note>
					<Button type="button" disabled={pending} className={primary} onClick={begin}>
						{pending ? <Loader2Icon className="size-4 animate-spin" /> : "Show the QR code"}
					</Button>
				</>
			)}

			{error && <p className="text-[13px] text-danger">{error}</p>}

			<button
				type="button"
				className="w-fit text-[13px] font-semibold text-brand hover:underline"
				onClick={() => startTransition(() => logout())}
			>
				Sign out
			</button>
		</div>
	);
}
