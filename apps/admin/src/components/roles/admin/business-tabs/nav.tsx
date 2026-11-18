"use client";

import Link from "next/link";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { cn } from "@hospio/ui/utils";
import { Crumbs } from "../shared";

export type BusinessTabKey = "usage" | "money" | "support" | "activity" | "acceptance";
/** Tabs drawn on the business page itself (`?tab=`); the rest are their own routes. */
export type BusinessLocalTab = "overview" | "hotels" | "users";

const LOCAL: { key: BusinessLocalTab; label: string }[] = [
	{ key: "overview", label: "Overview" },
	{ key: "hotels", label: "Hotels" },
	{ key: "users", label: "People" },
];
const ROUTES: { key: BusinessTabKey; label: string }[] = [
	{ key: "usage", label: "Usage" },
	{ key: "money", label: "Money" },
	{ key: "support", label: "Support" },
	{ key: "activity", label: "Contract & activity" },
	{ key: "acceptance", label: "Acceptance" },
];

const tabClass = (active: boolean) =>
	cn(
		"flex items-center gap-[6px] rounded-lg py-[6px] pl-[10px] pr-2 text-xs transition-colors",
		active
			? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
			: "font-medium text-ink-2 hover:text-ink",
	);

/**
 * One strip for everything about a business. Overview, Hotels and People are tabs of the business page (switched in place
 * when `onLocal` is given, linked otherwise); Usage, Money, Support and Contract & activity are their own routes. Before
 * this there were two strips, with Support and Contract & activity in both.
 */
export function BusinessTabStrip({
	businessId,
	active,
	onLocal,
	counts = {},
	className,
}: {
	businessId: string;
	active: BusinessTabKey | BusinessLocalTab;
	onLocal?: (key: BusinessLocalTab) => void;
	counts?: Partial<Record<BusinessLocalTab, number>>;
	className?: string;
}) {
	const base = `/dashboard/businesses/${businessId}`;
	return (
		<div
			className={cn(
				"inline-flex w-fit flex-wrap gap-[2px] rounded-[10px] bg-subtle p-1",
				className,
			)}
		>
			{LOCAL.map((t) => {
				const count = counts[t.key];
				const inner = (
					<>
						{t.label}
						{typeof count === "number" && (
							<span
								className={cn(
									"rounded-[6px] px-[5px] py-px text-[10px] font-semibold",
									active === t.key
										? "bg-brand-soft text-brand"
										: "bg-card text-ink-2",
								)}
							>
								{count}
							</span>
						)}
					</>
				);
				return onLocal ? (
					<button
						key={t.key}
						type="button"
						onClick={() => onLocal(t.key)}
						className={tabClass(active === t.key)}
					>
						{inner}
					</button>
				) : (
					<Link
						key={t.key}
						href={t.key === "overview" ? base : `${base}?tab=${t.key}`}
						className={tabClass(active === t.key)}
					>
						{inner}
					</Link>
				);
			})}
			<span className="mx-1 my-[6px] w-px bg-line-strong/50" aria-hidden />
			{ROUTES.map((t) => (
				<Link
					key={t.key}
					href={`${base}/${t.key}`}
					className={tabClass(active === t.key)}
				>
					{t.label}
				</Link>
			))}
		</div>
	);
}

/**
 * The header every business sub-page shares: Businesses › name › page, the title and the strip, so moving between a
 * business's pages never loses the way back.
 */
export function BusinessTabHeader({
	businessId,
	businessName,
	active,
	subtitle,
	children,
}: {
	businessId: string;
	businessName: string;
	active: BusinessTabKey;
	subtitle?: string;
	children?: React.ReactNode;
}) {
	return (
		<>
			<Crumbs
				items={[
					{ label: "Businesses", href: "/dashboard/businesses" },
					{ label: businessName, href: `/dashboard/businesses/${businessId}` },
					{ label: ROUTES.find((r) => r.key === active)?.label ?? "" },
				]}
			/>
			<PageHeader title={businessName} subtitle={subtitle}>
				{children}
			</PageHeader>
			<BusinessTabStrip businessId={businessId} active={active} />
		</>
	);
}
