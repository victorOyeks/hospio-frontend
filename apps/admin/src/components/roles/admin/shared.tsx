"use client";

import { ChevronRightIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { StatusPill, type PillTone } from "@hospio/ui/shared/status-pill";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";

/** Who can do what on the platform side: Support runs businesses, Finance admin runs money, Super admin does everything. */
export const can = {
	editBusiness: (r: AdminRole) => r === "SUPER_ADMIN" || r === "SUPPORT",
	money: (r: AdminRole) => r === "SUPER_ADMIN" || r === "FINANCE_ADMIN",
	team: (r: AdminRole) => r === "SUPER_ADMIN",
	settings: (r: AdminRole) => r === "SUPER_ADMIN",
};

export const adminRoleLabel: Record<AdminRole, string> = {
	SUPER_ADMIN: "Super admin",
	SUPPORT: "Support",
	FINANCE_ADMIN: "Finance admin",
};

export const stageMeta: Record<string, { label: string; tone: PillTone }> = {
	LEAD: { label: "Lead", tone: "grey" },
	ONBOARDING: { label: "Onboarding", tone: "info" },
	HANDED_OVER: { label: "Handed over", tone: "brand" },
	LIVE: { label: "Live", tone: "success" },
	AT_RISK: { label: "At risk", tone: "warning" },
	SUSPENDED: { label: "Suspended", tone: "danger" },
	CHURNED: { label: "Churned", tone: "grey" },
};

export function StagePill({ stage }: { stage: string }) {
	const m = stageMeta[stage] ?? { label: stage, tone: "grey" as PillTone };
	return <StatusPill tone={m.tone}>{m.label}</StatusPill>;
}

export function HealthBar({
	value,
	className,
}: {
	value: number;
	className?: string;
}) {
	const tone =
		value >= 70 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-danger";
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className="h-[6px] w-16 overflow-hidden rounded-full bg-subtle">
				<div
					className={cn("h-full rounded-full", tone)}
					style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
				/>
			</div>
			<span className="text-xs font-semibold text-ink">{value}</span>
		</div>
	);
}

/** Shown to a role that can look but not touch. */
export function ReadOnlyNote({ children }: { children: string }) {
	return (
		<p className="flex items-center gap-2 rounded-[10px] bg-subtle px-3 py-[10px] text-xs font-medium text-ink-2">
			<LockIcon className="size-[14px]" /> {children}
		</p>
	);
}

export const ticketPriority: Record<string, PillTone> = {
	LOW: "grey",
	NORMAL: "info",
	HIGH: "warning",
	URGENT: "danger",
};
export const ticketStatus: Record<string, { label: string; tone: PillTone }> = {
	OPEN: { label: "Waiting on us", tone: "warning" },
	IN_PROGRESS: { label: "In progress", tone: "info" },
	RESOLVED: { label: "Resolved", tone: "success" },
};

/** "Businesses › Ivory Court Hotels Ltd" above a detail page: each step but the last links back. */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
	return (
		<nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] font-medium text-ink-3">
			{items.map((c, i) => (
				<Fragment key={`${c.label}-${i}`}>
					{i > 0 && <ChevronRightIcon className="size-[14px]" />}
					{c.href ? (
						<Link href={c.href} className="text-ink-2 hover:text-ink hover:underline">
							{c.label}
						</Link>
					) : (
						<span className="text-ink">{c.label}</span>
					)}
				</Fragment>
			))}
		</nav>
	);
}

/** How a payment came in, as payment-service's summary names it ("cash", "desk-transfer", "moniepoint", "opay", "logging"). */
export function howPaidLabel(key: string): string {
	switch (key) {
		case "cash":
			return "Cash";
		case "desk-transfer":
			return "Bank transfer (recorded at desk)";
		case "moniepoint":
			return "Moniepoint POS";
		case "opay":
			return "OPay POS";
		case "logging":
			return "Test POS (staging)";
		default:
			return key;
	}
}

/** True for money that went through a POS terminal (card or transfer), not cash or a desk transfer. */
export const throughPos = (key: string) => key !== "cash" && key !== "desk-transfer" && key !== "unknown";
