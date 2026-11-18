"use client";

import { BanknoteIcon, FileTextIcon, ReceiptIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import type { DailyFeeRow } from "@hospio/api/actions/daily-fees";
import type { DevicePackageView } from "@hospio/api/actions/device-packages";
import { OwnerDeviceInvoices } from "./device-invoices";
import { acceptDeviceTerms } from "@hospio/api/actions/legal";
import { useAction } from "@hospio/api/actions/use-action";
import { Button } from "@hospio/ui/primitives/button";
import { TickBox, legalUrl } from "@hospio/ui/shared/legal";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * Hospio fees for the owner (every hotel) and the manager (their hotel, read-only): what each hotel sold each day (VAT
 * excluded) and Hospio360's fee on it. Nothing is taken from any account: the month's fees go on the Hospio360 monthly
 * invoice issued on the 1st (hospio-backend docs/plan-monthly-invoices.md), paid under Billing & invoices. `?month=YYYY-MM`
 * shows one month; without it, this month so far.
 */

/** How a devices package is paid for, in the owner's words. */
function devicePayLabel(p: DevicePackageView) {
	switch (p.paymentOption) {
		case "TRANSACTION":
			return `Paid from sales: ${p.deviceRate ?? 2.5}% of each day's sales, on the monthly invoice`;
		case "MONTHLY":
			return `Paid monthly on the invoice: ${p.months} × ${naira(p.monthlyInstalment ?? 0)}`;
		case "ONE_TIME":
			return "Paid in full at installation";
		default:
			return "Own devices";
	}
}

function deviceStatus(s: string) {
	if (s === "PAID_OFF") return <StatusPill tone="success">Paid off</StatusPill>;
	if (s === "INSTALLED") return <StatusPill tone="warning">Paying off</StatusPill>;
	if (s === "DRAFT") return <StatusPill tone="info">Not installed yet</StatusPill>;
	return <StatusPill tone="grey">{s}</StatusPill>;
}

/** The month a day's fee is billed in: "November 2026". */
const monthOf = (d: string) => new Date(`${d.slice(0, 7)}-01T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

/** The last 12 months, newest first, for the picker. */
function recentMonths() {
	const out: { value: string; label: string }[] = [];
	const d = new Date();
	for (let i = 0; i < 12; i++) {
		const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
		out.push({
			value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
			label: m.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
		});
	}
	return out;
}

const day = (d: string, long = false) =>
	new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", long ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { weekday: "short", day: "numeric", month: "short" });

/** ACCRUED: waiting for the month's invoice; INVOICED: on an invoice not paid yet; PAID: the invoice is paid. */
function status(s: string) {
	switch (s) {
		case "ACCRUED":
			return <StatusPill tone="brand">For this month's invoice</StatusPill>;
		case "INVOICED":
			return <StatusPill tone="warning">On invoice, unpaid</StatusPill>;
		case "PAID":
			return <StatusPill tone="success">Paid</StatusPill>;
		case "SHADOW":
			return <StatusPill tone="info">Statement only</StatusPill>;
		case "NO_FEE":
			return <StatusPill tone="grey">No fee</StatusPill>;
		default:
			return <StatusPill tone="grey">{s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")}</StatusPill>;
	}
}

/**
 * The owner accepts the device terms for a package before it is installed (hospio-backend docs/legal-acceptance.md); the admin can't
 * mark it installed until then (or enters a signed schedule's reference). Once accepted it says who and when.
 */
function DeviceTerms({ p, owner }: { p: DevicePackageView; owner: boolean }) {
	const router = useRouter();
	const [ticked, setTicked] = useState(false);
	const { run, pending } = useAction();
	if (p.termsAcceptedAt)
		return (
			<p className="text-[12px] text-ink-3">
				Device terms accepted by {p.termsAcceptedName ?? "the owner"} on {fmtWhen(p.termsAcceptedAt)} ({p.termsVersion})
			</p>
		);
	if (p.status !== "DRAFT") return null;
	if (!owner)
		return <p className="text-[12px] text-ink-3">Waiting for the owner to accept the device terms before installation.</p>;
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-line bg-subtle/40 p-3" data-testid="device-terms">
			<p className="text-[13px] font-medium text-ink">Before Hospio360 installs these devices</p>
			<TickBox id={`devices-${p.id}`} checked={ticked} onChange={setTicked}>
				I agree to the{" "}
				<a href={legalUrl("devices")} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
					Devices &amp; equipment terms
				</a>{" "}
				for this package, including how it is paid for and that Hospio360 owns the devices until they are paid off.
			</TickBox>
			<div>
				<Button
					type="button"
					size="sm"
					disabled={!ticked || pending}
					onClick={() => run(() => acceptDeviceTerms(p.id), "Device terms accepted", () => router.refresh())}
				>
					Accept device terms
				</Button>
			</div>
		</div>
	);
}

export function HospioFees({
	days,
	error,
	month,
	audience = "owner",
	devices = [],
}: {
	days: DailyFeeRow[];
	error: string | null;
	/** The devices & internet Hospio360 supplied, one package per hotel (none when the hotel uses its own). */
	devices?: DevicePackageView[];
	/** YYYY-MM, or null for the last 30 days. */
	month?: string | null;
	audience?: "owner" | "manager";
}) {
	const router = useRouter();
	const [open, setOpen] = useState<DailyFeeRow | null>(null);
	const months = recentMonths();
	const period = month ? (months.find((m) => m.value === month)?.label ?? month) : "This month so far";
	const billedIn = month ? (months.find((m) => m.value === month)?.label ?? month) : months[0].label;
	const sales = days.reduce((s, d) => s + d.sales, 0);
	const fees = days.reduce((s, d) => s + d.fee, 0);
	const deviceShare = days.reduce((s, d) => s + (d.deviceFee ?? 0), 0);
	const hotels = new Set(days.map((d) => d.hotelId)).size;
	const anyDevice = days.some((d) => (d.deviceFee ?? 0) > 0 || (d.deviceCarriedIn ?? 0) > 0);
	const supplied = devices.filter((p) => p.paymentOption !== "OWN_DEVICES" || p.dataPlanMonthly > 0);
	return (
		<>
			<PageHeader
				title="Hospio fees"
				subtitle={`${period} · what ${audience === "manager" ? "the hotel" : "each hotel"} sold (VAT excluded) and Hospio360's fee on it, billed monthly`}
			>
					<select
						value={month ?? ""}
						onChange={(e) => router.push(e.target.value ? `?month=${e.target.value}` : "?")}
						className="h-10 rounded-control border border-line bg-card px-3 text-[13px]"
						aria-label="Period"
					>
						<option value="">This month so far</option>
						{months.map((m) => (
							<option key={m.value} value={m.value}>
								{m.label}
							</option>
						))}
					</select>
			</PageHeader>
			{error && <Note tone="danger">{error}</Note>}
			<Note tone="info">
				Billed monthly: nothing is taken from {audience === "manager" ? "the hotel's" : "your"} account. These fees are added to{" "}
				{audience === "manager" ? "the business's" : "your"} {billedIn} invoice, issued on the 1st and due 7 days later
				{audience === "manager" ? "; the owner pays it" : ""}.{" "}
				<Link href="/dashboard/billing" className="font-medium text-primary underline underline-offset-2">
					Billing &amp; invoices
				</Link>
			</Note>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<KpiCard label="Sales" value={naira(sales)} icon={BanknoteIcon} hint="VAT excluded" />
				<KpiCard label="Hospio fees" value={naira(fees)} icon={ReceiptIcon} hint={days[0] ? `${days[0].rate} % of sales` : undefined} />
				<KpiCard
					label={deviceShare > 0 ? "Devices from sales" : "Invoice"}
					value={deviceShare > 0 ? naira(deviceShare) : billedIn}
					icon={FileTextIcon}
					hint={deviceShare > 0 ? "On the same monthly invoice" : "Issued on the 1st"}
				/>
			</div>
			{supplied.length > 0 && (
				<Suspense fallback={null}>
					<OwnerDeviceInvoices />
				</Suspense>
			)}
			{supplied.length > 0 && (
				<SectionCard
					title="Devices & internet"
					subtitle="What Hospio360 supplied and how it is being paid for. Hospio360 owns the devices until they are paid off."
					flush
				>
					<ul className="divide-y divide-line">
						{supplied.map((p) => {
							const pct = p.total > 0 ? Math.min(100, Math.round((p.paid / p.total) * 100)) : 0;
							return (
								<li key={p.id} className="flex flex-col gap-2 px-5 py-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-[14px] font-semibold text-ink">
											{audience === "owner" && p.hotelName ? `${p.hotelName} · ` : ""}
											{devicePayLabel(p)}
										</p>
										{deviceStatus(p.status)}
									</div>
									<p className="text-[13px] text-ink-2">{p.items.map((i) => `${i.quantity} × ${i.name}`).join(" · ") || "—"}</p>
									{p.total > 0 && (
										<>
											<div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
												<div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
											</div>
											<p className="text-[12px] text-ink-3">
												{naira(p.paid)} of {naira(p.total)} paid · {naira(p.remaining)} left
												{p.expectedFinish ? ` · expected to finish around ${day(p.expectedFinish, true)}` : ""}
											</p>
										</>
									)}
									{p.dataPlanMonthly > 0 && (
										<p className="text-[12px] text-ink-3">
											{p.dataPlanStoppedOn
												? `Data plan stopped from ${day(p.dataPlanStoppedOn, true)}`
												: `Data plan: ${naira(p.dataPlanMonthly)} a month${p.nextDataPlanDue ? ` · next invoice ${day(p.nextDataPlanDue)}` : ""}`}
										</p>
									)}
									{p.payments.length > 0 && (
										<p className="text-[12px] text-ink-3">
											Last payment {naira(p.payments[0].amount)} on {day(p.payments[0].paidOn)}
										</p>
									)}
									<DeviceTerms p={p} owner={audience === "owner"} />
								</li>
							);
						})}
					</ul>
				</SectionCard>
			)}
			<SectionCard title="Days" subtitle="Open a day for what was sold and the fee on it" flush>
				{days.length === 0 ? (
					<EmptyState title="No days yet" hint="Each day appears after midnight, with its statement in the owner's email." className="m-5" />
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead>
								<tr className={tableHead}>
									<th className={cell}>Day</th>
									{hotels > 1 && <th className={cell}>Hotel</th>}
									<th className={cell}>Sales</th>
									<th className={cell}>Fee</th>
									{anyDevice && <th className={cell}>Devices</th>}
									<th className={cell}>Status</th>
								</tr>
							</thead>
							<tbody>
								{days.map((d) => (
									<tr key={d.id} className={`${tableRow} cursor-pointer`} onClick={() => setOpen(d)}>
										<td className={cell}>{day(d.date)}</td>
										{hotels > 1 && <td className={cell}>{d.hotelName ?? "—"}</td>}
										<td className={cell}>{naira(d.sales)}</td>
										<td className={cell}>{naira(d.fee)}</td>
										{anyDevice && <td className={cell}>{(d.deviceFee ?? 0) > 0 ? naira(d.deviceFee ?? 0) : "—"}</td>}
										<td className={cell}>{status(d.status)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</SectionCard>
			{open && (
				<Modal open onOpenChange={(o) => !o && setOpen(null)} title={`${open.hotelName ?? "Hotel"} · ${day(open.date, true)}`} subtitle="What was sold (VAT excluded) and the fee">
					<div className="flex flex-col gap-4">
						<table className="w-full text-left text-[13px]">
							<tbody>
								{(open.lines ?? [])
									.filter((l) => l.amount !== 0)
									.map((l) => (
										<tr key={l.source} className="border-b border-line">
											<td className="py-2 pr-2 text-ink-2">{l.label}</td>
											<td className="py-2 text-right font-medium">{naira(l.amount)}</td>
										</tr>
									))}
								<tr>
									<td className="py-2 font-semibold">Sales</td>
									<td className="py-2 text-right font-semibold">{naira(open.sales)}</td>
								</tr>
							</tbody>
						</table>
						<DetailList
							columns={2}
							items={[
								{ label: `Fee at ${open.rate} %`, value: naira(open.fee) },
								...((open.carriedIn ?? 0) > 0 ? [{ label: "From earlier days", value: naira(open.carriedIn ?? 0) }] : []),
								...((open.deviceFee ?? 0) > 0 || (open.deviceCarriedIn ?? 0) > 0
									? [
											{ label: `Devices at ${open.deviceRate ?? 0} %`, value: naira(open.deviceFee ?? 0) },
											{ label: "Devices from earlier days", value: naira(open.deviceCarriedIn ?? 0) },
										]
									: []),
								{ label: "Status", value: status(open.status) },
								{ label: "Billed on", value: `${monthOf(open.date)} invoice` },
								{ label: "Statement emailed", value: open.statementSentAt ? fmtWhen(open.statementSentAt) : "—" },
							]}
						/>
						<Note tone="info">
							{open.status === "PAID"
								? `Paid with the ${monthOf(open.date)} invoice.`
								: open.status === "INVOICED"
									? `On the ${monthOf(open.date)} invoice, not paid yet.`
									: `Added to the ${monthOf(open.date)} invoice, issued on the 1st.`}{" "}
							<Link href="/dashboard/billing" className="font-medium text-primary underline underline-offset-2">
								Billing &amp; invoices
							</Link>
						</Note>
					</div>
				</Modal>
			)}
		</>
	);
}
