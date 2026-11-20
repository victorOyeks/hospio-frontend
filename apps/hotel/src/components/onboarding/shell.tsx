"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingStep,
} from "@hospio/api/types";
import { HospioWordmark } from "@hospio/ui/brand/logo";
import { cn } from "@hospio/ui/utils";
import { logout } from "@hospio/api/actions";
import { saveForLater } from "./persist";
import { stepHref, stepMeta } from "./steps";

/**
 * The wizard's frame (Figma 3164:16113): logo, the step bar with the four steps and "All set", and
 * "Save and finish later". The welcome checklist and the handover page share the frame without the bar.
 */
export function OnboardingShell({
	children,
	kind,
	accommodation,
}: PropsWithChildren<{
	/** The business's kind and whether its first location has rooms: the step titles follow them. */
	kind?: string | null;
	accommodation?: boolean;
}>) {
	const meta = stepMeta(kind, accommodation);
	const pathname = usePathname();
	const current = pathname.split("/")[2] ?? "";
	const bar = pathname.startsWith("/onboarding/");
	const handover = pathname.startsWith("/handover");
	const activeIndex =
		current === "done"
			? OWNER_ONBOARDING_STEPS.length
			: OWNER_ONBOARDING_STEPS.indexOf(current as OwnerOnboardingStep);

	return (
		<main className="flex min-h-screen flex-col bg-page">
			{/* Below xl the step bar has its own row under the logo: inline on a tablet it squeezed "Save and finish later"
			    into a 34 px column that ran off the right edge (owner's tablet test, 20 Nov 2026). */}
			<header className="border-b border-line bg-card">
				<div className="flex h-[52px] items-center gap-4 px-4 sm:px-6">
					<Link
						href="/dashboard"
						className="flex shrink-0 items-center gap-[10px]"
					>
						<HospioWordmark className="h-[22px] text-brand" />
					</Link>
					{bar ? (
						<StepBar
							meta={meta}
							activeIndex={activeIndex}
							className="mx-auto hidden xl:flex"
						/>
					) : null}
					<span className={cn("flex-1", bar && "xl:hidden")} />
					{!handover && <SaveLater />}
				</div>
				{bar && (
					<div className="flex justify-center border-t border-line px-4 xl:hidden">
						<StepBar meta={meta} activeIndex={activeIndex} compact />
					</div>
				)}
			</header>
			<div className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
				{children}
			</div>
		</main>
	);
}

/**
 * The four steps and "All set". Full titles inline in the header on wide screens; `compact` (its own row, below xl)
 * uses the short titles, and on a phone only the open step keeps its title.
 */
function StepBar({
	meta,
	activeIndex,
	compact,
	className,
}: {
	meta: ReturnType<typeof stepMeta>;
	activeIndex: number;
	compact?: boolean;
	className?: string;
}) {
	return (
		<ol className={cn("flex min-w-0 items-center", className)}>
			{[...OWNER_ONBOARDING_STEPS, "done" as const].map((key, i) => {
				const done = i < activeIndex;
				const active = i === activeIndex;
				const label =
					key === "done"
						? "All set"
						: compact
							? meta[key].short
							: meta[key].title;
				const reachable = done || active;
				const inner = (
					<span
						className={cn(
							"flex items-center gap-2 whitespace-nowrap",
							compact && "min-h-[44px]",
						)}
					>
						<span
							className={cn(
								"flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
								done || active ? "bg-brand text-white" : "bg-subtle text-ink-3",
							)}
						>
							{done ? <CheckIcon className="size-3" /> : i + 1}
						</span>
						<span
							className={cn(
								"text-[13px]",
								active
									? "font-semibold text-ink"
									: done
										? "font-medium text-ink-2"
										: "text-ink-3",
								compact && !active && "sr-only md:not-sr-only",
							)}
						>
							{label}
						</span>
					</span>
				);
				return (
					<li key={key} className="flex items-center">
						{reachable && key !== "done" ? (
							<Link
								href={stepHref(key)}
								aria-current={active ? "step" : undefined}
							>
								{inner}
							</Link>
						) : (
							inner
						)}
						{i < OWNER_ONBOARDING_STEPS.length && (
							<span
								className={cn(
									"h-px shrink-0",
									compact ? "mx-2 w-4 md:mx-3 md:w-6" : "mx-3 w-6",
									done ? "bg-brand" : "bg-line",
								)}
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}

/**
 * Saves the open step when its entries are complete (or keeps them in this browser when they are not),
 * then signs out to the sign-in page. Signing in again opens the checklist at the first unfinished step.
 */
function SaveLater() {
	const [busy, setBusy] = useState(false);
	return (
		<button
			type="button"
			disabled={busy}
			onClick={async () => {
				setBusy(true);
				const r = await saveForLater();
				setBusy(false);
				if (r === "failed") {
					toast.error(
						"This step couldn't be saved. Check the form and try again",
					);
					return;
				}
				if (r === "kept")
					toast.success(
						"This step isn't complete yet, so its entries are kept on this device",
					);
				// Leave the wizard: sign out and land on sign-in, which says the setup was saved.
				await logout("saved");
			}}
			className="-mr-2 inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-control px-2 text-[13px] font-semibold text-brand hover:underline disabled:opacity-60"
		>
			{busy ? "Saving…" : "Save and finish later"}
		</button>
	);
}
