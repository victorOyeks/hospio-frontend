"use client";

import { AlertTriangleIcon, BanIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type BillingStatusView, billingStatus } from "@hospio/api/actions/billing";
import { cn } from "@hospio/ui/utils";

/**
 * The Hospio360 invoice banner on every hotel-app page (hospio-backend docs/plan-monthly-invoices.md), from GET
 * /platform/billing/status: read on load and every few minutes. The owner and managers see the amber reminders (due soon, due
 * today, overdue, final notice), the owner a quiet note when an invoice is issued; RESTRICTED is red for everyone, staff included.
 * The owner gets Pay now (Billing & invoices opens the invoice and starts Paystack); managers are asked to tell the owner.
 */

const POLL_MS = 5 * 60_000;
const AMBER = ["DUE_SOON", "DUE_TODAY", "OVERDUE", "FINAL_WARNING"];

export function BillingBanner({ initial, role }: { initial: BillingStatusView | null; role: string }) {
	const [status, setStatus] = useState<BillingStatusView | null>(initial);
	useEffect(() => setStatus(initial), [initial]);
	useEffect(() => {
		let alive = true;
		const read = () =>
			void billingStatus()
				.then((s) => alive && setStatus(s))
				.catch(() => {});
		const timer = setInterval(read, POLL_MS);
		const onFocus = () => document.visibilityState === "visible" && read();
		document.addEventListener("visibilitychange", onFocus);
		return () => {
			alive = false;
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onFocus);
		};
	}, []);

	if (!status || status.state === "NONE") return null;
	const owner = role === "OWNER";
	const manager = owner || role === "MANAGER";
	const restricted = status.state === "RESTRICTED";
	const amber = AMBER.includes(status.state);
	const issued = status.state === "DUE";
	if (!restricted && !(amber && manager) && !(issued && owner)) return null;

	const invoiceHref = status.invoiceId ? `/dashboard/billing?invoice=${encodeURIComponent(status.invoiceId)}` : "/dashboard/billing";
	const payHref = status.invoiceId ? `${invoiceHref}&pay=1` : invoiceHref;
	const final = status.state === "FINAL_WARNING";
	const Icon = restricted ? BanIcon : issued ? FileTextIcon : AlertTriangleIcon;

	return (
		<div
			role={restricted || final ? "alert" : "status"}
			data-testid="billing-banner"
			data-state={status.state}
			className={cn(
				"flex flex-wrap items-start gap-3 rounded-card border px-4 py-3",
				restricted && "border-danger/40 bg-danger-soft text-danger",
				amber && !final && "border-warning/30 bg-warning-soft text-warning",
				final && "border-warning bg-warning-soft text-warning ring-1 ring-warning/40",
				issued && "border-line bg-card text-ink",
			)}
		>
			<Icon className={cn("mt-[2px] size-5 shrink-0", issued && "text-brand")} />
			<div className="min-w-0 flex-1">
				<p className={cn("text-[14px] font-semibold", final && "uppercase tracking-[0.02em]", issued && "text-ink")}>
					{status.title ?? (restricted ? "Some things are paused" : "Hospio360 invoice")}
				</p>
				{status.message && <p className={cn("text-[13px]", issued ? "text-ink-2" : "opacity-90")}>{status.message}</p>}
			</div>
			<div className="flex shrink-0 flex-wrap items-center gap-2 self-center">
				{owner && status.canPay && !issued && (
					<Link
						href={payHref}
						className={cn(
							"rounded-control px-4 py-[8px] text-[13px] font-semibold text-white",
							restricted ? "bg-danger hover:bg-danger/90" : "bg-brand hover:bg-brand/90",
						)}
					>
						Pay now
					</Link>
				)}
				{manager && (
					<Link href={invoiceHref} className="rounded-control border border-current/30 bg-card px-4 py-[8px] text-[13px] font-semibold text-ink hover:bg-subtle">
						View invoice
					</Link>
				)}
				{manager && !owner && !issued && <span className="text-[12px] font-medium">Ask the owner to pay</span>}
			</div>
		</div>
	);
}
