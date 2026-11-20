"use client";

import { APP } from "@hospio/api/app";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@hospio/ui/primitives/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@hospio/ui/primitives/form";
import { Input } from "@hospio/ui/primitives/input";
import { login, loginWithCode } from "@hospio/api/actions";
import type { AccountKind } from "@hospio/api/app";
import { resumeTarget } from "@hospio/ui/shared/draft";

/** The line shown while an account is taken to the app it belongs on (hospio-backend docs/sign-in.md). */
const HANDOVER_WORDS: Record<AccountKind, string> = {
	business: "This is a hotel account. Taking you to your hotel app",
	platform: "This is a Hospio360 staff account. Taking you to the admin console",
	marketer: "This is a marketer account. Taking you to the marketer console",
};

/** Why the sign-in page opened, from `?reason=`: a hand-over that could not finish, or a session that ended elsewhere. */
const REASONS: Record<string, string> = {
	handoff: "That sign-in link has expired or was already used. Sign in again.",
	"wrong-app": "Sign in again to continue.",
	"access-changed": "You were signed out. Sign in again to continue.",
};

const schema = z.object({
	email: z.email("Enter your email"),
	password: z.string().min(1, "Enter your password"),
});

/**
 * The one sign-in flow both apps run (web-staging and admin-staging alike). An account that belongs on the other app is not
 * signed in here: it is handed over, already signed in, with the line above. `email` fills the field (a "No PIN yet" tile on
 * a shared device's lock screen opens sign-in with it). `from`: a page of this app to open after sign-in (`?from=` or `?next=`).
 */
export function AuthForm({ from, email = "", reason }: { from?: string; email?: string; reason?: string }) {
	const router = useRouter();
	// Set once the account is on its way to the other app: the form is replaced by the line and never submits again.
	const [handover, setHandover] = useState<{ url: string; kind: AccountKind } | null>(null);
	const [show, setShow] = useState(false);
	const [pending, startTransition] = useTransition();
	// 2-step sign-in (docs/profile.md in hospio-backend): after the right password, the code step.
	const [twoStepToken, setTwoStepToken] = useState<string | null>(null);
	const [code, setCode] = useState("");
	const [recovery, setRecovery] = useState(false);
	const [codeError, setCodeError] = useState<string | undefined>();
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: { email, password: "" },
	});

	function signedIn(
		data: { mustChangePassword?: boolean; roles?: string[]; userId?: string; handoff?: { url: string; kind: AccountKind } },
	) {
		// The account belongs on the other app: no session was kept here. Show where it is going, then a full navigation to the
		// other app's /auth/handoff (the one-time code works for 30 seconds, once). Replace, so Back doesn't come here again.
		if (data.handoff) {
			const { url } = data.handoff;
			setHandover(data.handoff);
			window.setTimeout(() => window.location.replace(url), 1200);
			return;
		}
		if (!data.userId) return;
		toast.success("Signed in");
		// Only back to a page of this app (no open redirect), and only for the person who was on it: someone else signing
		// in on this tab goes to their own dashboard and the last person's drafts are cleared.
		const back = resumeTarget(data.userId, from);
		router.replace(data.mustChangePassword ? "/reset-password" : back);
	}

	if (handover) {
		return (
			<output className="flex flex-col gap-4" aria-live="polite">
				<div>
					<h1 className="text-[28px] font-bold text-ink">Signed in</h1>
					<p className="mt-2 text-sm text-ink-2">{HANDOVER_WORDS[handover.kind]}</p>
				</div>
				<p className="flex items-center gap-2 text-[13px] text-ink-3">
					<Loader2Icon className="size-4 animate-spin" aria-hidden="true" /> Opening it now…
				</p>
				<a href={handover.url} rel="noreferrer" className="w-fit text-[13px] font-semibold text-brand hover:underline">
					Not moving? Continue
				</a>
			</output>
		);
	}

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			const result = await login({ ...values, next: from });
			if (!result.ok) {
				form.setError("password", { message: result.error });
				return;
			}
			const data = result.data;
			if (data.twoStepToken !== undefined) {
				setTwoStepToken(data.twoStepToken);
				setCode("");
				setCodeError(undefined);
				return;
			}
			signedIn(data);
		});
	}

	function submitCode(e: FormEvent) {
		e.preventDefault();
		if (!twoStepToken) return;
		setCodeError(undefined);
		startTransition(async () => {
			const result = await loginWithCode({ twoStepToken, code, next: from });
			if (!result.ok) {
				setCodeError(result.error);
				// The step has run out or sign-in is locked: start again with the password.
				if (/expired|locked/i.test(result.error)) {
					setTwoStepToken(null);
					form.setValue("password", "");
					form.setError("password", { message: result.error });
				}
				return;
			}
			signedIn(result.data);
		});
	}

	if (twoStepToken) {
		return (
			<form method="post" onSubmit={submitCode} className="flex flex-col gap-4">
				<div>
					<h1 className="text-[28px] font-bold text-ink">2-step sign-in</h1>
					<p className="mt-2 text-sm text-ink-3">
						{recovery ? "Enter one of your recovery codes. Each works once." : "Enter the 6-digit code from your authenticator app."}
					</p>
				</div>
				<div className="flex flex-col gap-[6px]">
					<label htmlFor="two-step-code" className="text-[13px] font-medium text-ink-2">
						{recovery ? "Recovery code" : "Code"}
					</label>
					<Input
						id="two-step-code"
						value={code}
						onChange={(e) => setCode(e.target.value)}
						autoFocus
						autoComplete="one-time-code"
						inputMode={recovery ? "text" : "numeric"}
						placeholder={recovery ? "abcde-12345" : "123456"}
						className="h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0"
					/>
					{codeError && <p className="text-[13px] text-danger">{codeError}</p>}
				</div>
				<button
					type="button"
					className="w-fit text-[13px] font-semibold text-brand hover:underline"
					onClick={() => {
						setRecovery((r) => !r);
						setCode("");
						setCodeError(undefined);
					}}
				>
					{recovery ? "Use the code from my app" : "Lost your phone? Use a recovery code"}
				</button>
				<Button
					type="submit"
					disabled={pending || !code.trim()}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? <Loader2Icon className="size-4 animate-spin" /> : "Continue"}
				</Button>
				<button
					type="button"
					className="text-[13px] font-semibold text-ink-3 hover:text-ink"
					onClick={() => {
						setTwoStepToken(null);
						form.setValue("password", "");
					}}
				>
					Back to email and password
				</button>
			</form>
		);
	}

	return (
		<Form {...form}>
			{/* method="post": a submit before hydration must never put the credentials in the URL. */}
			<form
				method="post"
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				{reason && REASONS[reason] && (
					<p className="rounded-[10px] bg-warning-soft px-4 py-3 text-[13px] text-warning">{REASONS[reason]}</p>
				)}
				<div>
					<h1 className="text-[28px] font-bold text-ink">{APP === "admin" ? "Admin sign in" : "Sign in"}</h1>
					<p className="mt-2 text-sm text-ink-3">
						{APP === "admin" ? "The Hospio360 platform console, for staff accounts" : "Welcome back to Hospio360"}
					</p>
				</div>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className="text-[13px] font-medium text-ink-2">
								Email or phone
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="email"
									autoComplete="username"
									placeholder={APP === "admin" ? "you@hospio360.com" : "you@hotel.com"}
									className="h-auto rounded-control border-line px-[14px] py-3 text-sm focus-visible:border-brand focus-visible:ring-0"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="gap-[6px]">
							<FormLabel className="text-[13px] font-medium text-ink-2">
								Password
							</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
										type={show ? "text" : "password"}
										autoComplete="current-password"
										placeholder="••••••••••"
										className="h-auto rounded-control border-line px-[14px] py-3 pr-11 text-sm focus-visible:border-brand focus-visible:ring-0"
									/>
									<button
										type="button"
										onClick={() => setShow((s) => !s)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
										aria-label={show ? "Hide password" : "Show password"}
									>
										{show ? (
											<EyeOffIcon className="size-4" />
										) : (
											<EyeIcon className="size-4" />
										)}
									</button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Link
					href="/forgot-password"
					className="text-[13px] font-semibold text-brand hover:underline"
				>
					Forgot your password?
				</Link>

				<Button
					type="submit"
					disabled={pending}
					className="h-auto w-full rounded-control bg-brand py-[10px] text-[13px] font-semibold text-white hover:bg-brand/90"
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Sign in"
					)}
				</Button>
			</form>
		</Form>
	);
}
