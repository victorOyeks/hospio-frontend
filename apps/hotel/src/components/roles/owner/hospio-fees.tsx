"use client";

import { BanknoteIcon, ReceiptIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import type { DailyFeeRow } from "@hospio/api/actions/daily-fees";
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
 * The owner's Hospio fees: what each hotel sold each day (VAT excluded), Hospio360's fee on it and how it was collected. The
 * statement for each day is emailed after midnight; the fee is debited at 6am from the hotel's POS provider account once
 * automatic debit is on. Until then the days show as "Statement only".
 */

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

export function HospioFees({ days, error }: { days: DailyFeeRow[]; error: string | null }) {
	const [open, setOpen] = useState<DailyFeeRow | null>(null);
	const sales = days.reduce((s, d) => s + d.sales, 0);
	const fees = days.reduce((s, d) => s + d.fee, 0);
	const collected = days.reduce((s, d) => s + (d.collected ?? 0), 0);
	const shadow = days.some((d) => d.status === "SHADOW");
	const hotels = new Set(days.map((d) => d.hotelId)).size;
	return (
		<>
			<PageHeader title="Hospio fees" subtitle="Last 30 days · what each hotel sold (VAT excluded) and Hospio360's fee on it" />
			{error && <Note tone="danger">{error}</Note>}
			{shadow && (
				<Note tone="info">
					Automatic debit isn't on yet: you get each day's statement, and nothing is taken from your account. Once Hospio360 switches it
					on, the day's fee is debited at 6am from your POS provider account.
				</Note>
			)}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<KpiCard label="Sales" value={naira(sales)} icon={BanknoteIcon} hint="VAT excluded" />
				<KpiCard label="Hospio fees" value={naira(fees)} icon={ReceiptIcon} hint={days[0] ? `${days[0].rate} % of sales` : undefined} />
				<KpiCard label="Debited" value={naira(collected)} icon={WalletIcon} />
			</div>
			<SectionCard title="Days" subtitle="Open a day for its lines" flush>
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
									<th className={cell}>Debited</th>
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
										<td className={cell}>{naira(d.collected ?? 0)}</td>
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
								{ label: "Debited", value: naira(open.collected ?? 0) },
								{ label: "Status", value: status(open.status) },
								{ label: "Statement emailed", value: open.statementSentAt ? fmtWhen(open.statementSentAt) : "—" },
								{ label: "Debited at", value: open.debitedAt ? fmtWhen(open.debitedAt) : "—" },
							]}
						/>
						{open.status === "UNPAID" && <Note tone="warning">The debit didn't go through. It is tried again today and moves to tomorrow's fee if it still fails.</Note>}
					</div>
				</Modal>
			)}
		</>
	);
}
