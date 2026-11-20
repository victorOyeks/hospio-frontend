"use client";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	InfoIcon,
	Loader2Icon,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingStep,
} from "@hospio/api/types";
import { Button } from "@hospio/ui/primitives/button";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** The two-column step page: the form card on the left, helper cards on the right. */
export function StepPage({
	children,
	aside,
}: {
	children: ReactNode;
	aside?: ReactNode;
}) {
	return (
		<div
			className={cn(
				"grid w-full max-w-[1000px] gap-5",
				aside && "xl:grid-cols-[1fr_300px]",
			)}
		>
			<div className="flex min-w-0 flex-col gap-5">{children}</div>
			{aside && <div className="flex flex-col gap-4">{aside}</div>}
		</div>
	);
}

export function StepCard({
	step,
	title,
	intro,
	children,
	className,
}: {
	step?: OwnerOnboardingStep;
	title: string;
	intro?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	const n = step ? OWNER_ONBOARDING_STEPS.indexOf(step) + 1 : 0;
	return (
		<section
			className={cn(
				"flex min-w-0 flex-col gap-5 rounded-card border border-line bg-card px-5 py-5 sm:px-7 sm:py-6",
				className,
			)}
		>
			<header>
				{step && (
					<p className="text-xs font-semibold text-brand">
						Step {n} of {OWNER_ONBOARDING_STEPS.length}
					</p>
				)}
				<h1 className="mt-1 text-xl font-bold sm:text-2xl tracking-[-0.01em] text-ink">
					{title}
				</h1>
				{intro && <p className="mt-1 text-[13px] text-ink-2">{intro}</p>}
			</header>
			{children}
		</section>
	);
}

/**
 * Back on the left, an optional skip, and the primary action on the right. On a phone the note comes first, the primary
 * action takes the full width under it, and Back / Skip share the last row (they wrapped into a ragged column before).
 * Every action is at least 44 px tall.
 */
export function StepFooter({
	back,
	skip,
	label,
	pending,
	disabled,
	onContinue,
	info,
}: {
	back?: string;
	skip?: { href: string; label?: string };
	label?: string;
	pending?: boolean;
	disabled?: boolean;
	onContinue?: () => void;
	info?: ReactNode;
}) {
	return (
		<footer className="flex flex-wrap items-center gap-3 pt-1">
			{back && (
				<Link
					href={back}
					className={cn(
						btn.secondary,
						"order-3 flex min-h-[44px] items-center gap-2 sm:order-none",
					)}
				>
					<ArrowLeftIcon className="size-4" /> Back
				</Link>
			)}
			<span
				className={cn(
					"order-1 basis-full text-xs text-ink-3 sm:order-none sm:min-w-[140px] sm:flex-1 sm:basis-0",
					!info && "hidden sm:block",
				)}
			>
				{info}
			</span>
			{skip && (
				<Link
					href={skip.href}
					className="order-4 ml-auto inline-flex min-h-[44px] items-center whitespace-nowrap rounded-control px-2 text-[13px] font-semibold text-ink-2 hover:text-ink sm:order-none sm:ml-0"
				>
					{skip.label ?? "Skip for now"}
				</Link>
			)}
			{onContinue && (
				<Button
					type="submit"
					className={cn(
						btn.primary,
						"order-2 flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap sm:order-none sm:w-auto",
					)}
					disabled={pending || disabled}
					// The button submits its form (Enter in a field still works), but the step's own handler runs once: without
					// preventDefault the click ran onContinue and the form's onSubmit ran it again (two outlets, "already has a hotel called").
					onClick={(e) => {
						e.preventDefault();
						onContinue();
					}}
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						<ArrowRightIcon className="size-4" />
					)}{" "}
					{label ?? "Continue"}
				</Button>
			)}
		</footer>
	);
}

export function SideCard({
	title,
	icon: Icon = InfoIcon,
	children,
	dark,
	eyebrow,
}: {
	title?: string;
	icon?: LucideIcon;
	children: ReactNode;
	dark?: boolean;
	eyebrow?: string;
}) {
	return (
		<aside
			className={cn(
				"flex flex-col gap-2 rounded-card border px-5 py-4",
				dark ? "border-transparent bg-brand text-white" : "border-line bg-card",
			)}
		>
			{eyebrow && (
				<p
					className={cn(
						"text-[10px] font-semibold uppercase tracking-[0.08em]",
						dark ? "text-white/60" : "text-ink-3",
					)}
				>
					{eyebrow}
				</p>
			)}
			{title && (
				<p
					className={cn(
						"flex items-center gap-2 text-[13px] font-bold",
						dark ? "text-white" : "text-ink",
					)}
				>
					<Icon className="size-4" /> {title}
				</p>
			)}
			<div
				className={cn(
					"flex flex-col gap-2 text-xs",
					dark ? "text-white/80" : "text-ink-2",
				)}
			>
				{children}
			</div>
		</aside>
	);
}

/** The light table header + rows used by the rooms step. */
export const gridHead =
	"text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-3";
