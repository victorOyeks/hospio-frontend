"use client";

import { BanknoteIcon, ReceiptIcon, WalletIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DailyFeeRow } from "@hospio/api/actions/daily-fees";
import type { DevicePackageView } from "@hospio/api/actions/device-packages";
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
 * excluded), Hospio360's fee on it and how it was collected. The statement for each day is emailed after midnight; the fee is
 * debited at 6am from the hotel's POS provider account (Moniepoint or OPay) once automatic debit is on, so there is nothing to
 * pay here. Until then the days show as "Statement only". `?month=YYYY-MM` shows one month; without it, the last 30 days.
 */

/** How a devices package is paid for, in the owner's words. */
function devicePayLabel(p: DevicePackageView) {
	switch (p.paymentOption) {
		case "TRANSACTION":
			return `Paid from sales: ${p.deviceRate ?? 2.5}% of each day's sales, with the Hospio fee`;
		case "MONTHLY":
			return `Paid monthly: ${p.months} × ${naira(p.monthlyInstalment ?? 0)}`;
		case "ONE_TIME":
			return "Paid in full at installation";
		default:
			return "Own devices";
	}
}

function deviceStatus(s: string) {
	if (s === "PAID_OFF") return <StatusPill tone="success">Paid off</StatusPill>;
	if (s === "INSTALLED") return <StatusPill tone="warning">Paying off</StatusPill>;
	if (s === "DRAFT") return <StatusPill tone="info">Agreed · not installed yet</StatusPill>;
	return <StatusPill tone="grey">{s}</StatusPill>;
}

const providerName = (p?: string | null) => (p === "OPAY" ? "OPay" : p === "MONIEPOINT" ? "Moniepoint" : p ? p : null);

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

function status(s: string) {
	switch (s) {
		case "PAID":
			return <StatusPill tone="success">Debited</StatusPill>;
		case "SHADOW":
			return <StatusPill tone="info">Statement only</StatusPill>;
		case "NO_FEE":
			return <StatusPill tone="grey">No fee</StatusPill>;
		case "SCHEDULED":
			return <StatusPill tone="brand">Debit at 6am</StatusPill>;
		case "PENDING":
			return <StatusPill tone="warning">Being debited</StatusPill>;
		case "PART_PAID":
			return <StatusPill tone="warning">Part debited</StatusPill>;
		case "UNPAID":
			return <StatusPill tone="danger">Not debited</StatusPill>;
		case "CARRIED":
			return <StatusPill tone="grey">Moved to the next day</StatusPill>;
		default:
			return <StatusPill tone="grey">{s}</StatusPill>;
	}
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
	const period = month ? (months.find((m) => m.value === month)?.label ?? month) : "Last 30 days";
	const sales = days.reduce((s, d) => s + d.sales, 0);
	const fees = days.reduce((s, d) => s + d.fee, 0);
	const collected = days.reduce((s, d) => s + (d.collected ?? 0), 0);
	const shadow = days.some((d) => d.status === "SHADOW");
	const hotels = new Set(days.map((d) => d.hotelId)).size;
	const anyDevice = days.some((d) => (d.deviceFee ?? 0) > 0 || (d.deviceCarriedIn ?? 0) > 0);
	const supplied = devices.filter((p) => p.paymentOption !== "OWN_DEVICES" || p.dataPlanMonthly > 0);
	return (
		<>
			<PageHeader
				title="Hospio fees"
				subtitle={`${period} · what ${audience === "manager" ? "the hotel" : "each hotel"} sold (VAT excluded), Hospio360's fee on it and how it was taken`}
			>
					<select
						value={month ?? ""}
						onChange={(e) => router.push(e.target.value ? `?month=${e.target.value}` : "?")}
						className="h-10 rounded-control border border-line bg-card px-3 text-[13px]"
						aria-label="Period"
					>
						<option value="">Last 30 days</option>
						{months.map((m) => (
							<option key={m.value} value={m.value}>
								{m.label}
							</option>
						))}
					</select>
			</PageHeader>
			{error && <Note tone="danger">{error}</Note>}
			{!shadow && (
				<p className="text-[13px] text-ink-3">
					Nothing to pay here: each day's fee is taken automatically at 6am from {audience === "manager" ? "the hotel's" : "your"} POS provider account
					(Moniepoint or OPay), and each day's statement is emailed{audience === "manager" ? " to the owner" : ""}.
				</p>
			)}
			{shadow && (
				<Note tone="info">
					Automatic debit isn't on yet: each day's statement is emailed{audience === "manager" ? " to the owner" : ""}, and nothing is taken from{" "}
					{audience === "manager" ? "the hotel's" : "your"} account. Once Hospio360 switches it on, the day's fee is debited at 6am from the POS provider
					account. There is nothing to pay here.
				</Note>
			)}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<KpiCard label="Sales" value={naira(sales)} icon={BanknoteIcon} hint="VAT excluded" />
				<KpiCard label="Hospio fees" value={naira(fees)} icon={ReceiptIcon} hint={days[0] ? `${days[0].rate} % of sales` : undefined} />
				<KpiCard label="Debited" value={naira(collected)} icon={WalletIcon} />
			</div>
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
									{p.dataPlanMonthly > 0 && <p className="text-[12px] text-ink-3">Data plan: {naira(p.dataPlanMonthly)} a month</p>}
									{p.payments.length > 0 && (
										<p className="text-[12px] text-ink-3">
											Last payment {naira(p.payments[0].amount)} on {day(p.payments[0].paidOn)}
										</p>
									)}
								</li>
							);
						})}
					</ul>
				</SectionCard>
			)}
			<SectionCard title="Days" subtitle="Open a day for what was sold and how the fee was taken" flush>
				{days.length === 0 ? (
					<EmptyState title="No days yet" hint="The first day appears after midnight, with its statement in your email." className="m-5" />
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
									<th className={cell}>Debited</th>
									<th className={cell}>From</th>
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
										<td className={cell}>{naira(d.collected ?? 0)}</td>
										<td className={cell}>
											{providerName(d.provider) ? (
												<span className="flex flex-col">
													<span>{providerName(d.provider)}</span>
													{d.debitedAt && <span className="text-[11px] text-ink-3">{fmtWhen(d.debitedAt)}</span>}
												</span>
											) : (
												<span className="text-ink-3">—</span>
											)}
										</td>
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
								{ label: "From earlier days", value: naira(open.carriedIn ?? 0) },
								...((open.deviceFee ?? 0) > 0 || (open.deviceCarriedIn ?? 0) > 0
									? [
											{ label: `Devices at ${open.deviceRate ?? 0} %`, value: naira(open.deviceFee ?? 0) },
											{ label: "Devices from earlier days", value: naira(open.deviceCarriedIn ?? 0) },
											{ label: "Paid to devices", value: naira(open.devicePaid ?? 0) },
										]
									: []),
								{ label: "Debited", value: naira(open.collected ?? 0) },
								{ label: "Status", value: status(open.status) },
								{ label: "Due that day", value: naira(open.due) },
								{ label: "Statement emailed", value: open.statementSentAt ? fmtWhen(open.statementSentAt) : "—" },
								{ label: "Debited at", value: open.debitedAt ? fmtWhen(open.debitedAt) : "—" },
								{ label: "Debited from", value: providerName(open.provider) ? `${providerName(open.provider)} account` : "—" },
								{ label: "Debit reference", value: open.debitRef ?? "—" },
								{ label: "Attempts", value: open.attempts ? String(open.attempts) : "—" },
							]}
						/>
						{(open.status === "UNPAID" || open.status === "PART_PAID") && (
							<Note tone="warning">
								{open.status === "PART_PAID" ? "Only part of the fee could be debited." : "The debit didn't go through."}
								{open.lastError ? ` ${providerName(open.provider) ?? "The provider"} said: ${open.lastError}.` : ""} It is tried again at 9am,
								1pm and 6pm, and what is still owed moves to the next day's fee. POS payments pause after 3 unpaid days.
							</Note>
						)}
						{open.status === "CARRIED" && <Note tone="info">This fee wasn't debited on the day and was added to the next day's fee.</Note>}
					</div>
				</Modal>
			)}
		</>
	);
}
