"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	allDeviceInvoices,
	type DeviceInvoiceView,
	markDeviceInvoicePaid,
	packageInvoices,
	runDeviceInvoices,
} from "@hospio/api/actions/device-packages";
import { TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * Monthly device invoices (instalments and data plan): status, how paid and the Hospio360 monthly invoice (HIN-…) that bills
 * each one (docs/plan-monthly-invoices.md). Nothing is debited; one not yet on a monthly invoice can still be marked paid by hand.
 */

export function invoiceStatus(i: DeviceInvoiceView) {
	switch (i.status) {
		case "PAID":
			return <StatusPill tone="success">Paid</StatusPill>;
		case "OVERDUE":
			return <StatusPill tone="danger">{`Overdue · ${i.daysOverdue} day${i.daysOverdue === 1 ? "" : "s"}`}</StatusPill>;
		case "VOID":
			return <StatusPill tone="grey">Not needed</StatusPill>;
		default:
			return <StatusPill tone="warning">Due</StatusPill>;
	}
}

export const invoiceLabel = (i: DeviceInvoiceView) =>
	i.kind === "DATA_PLAN"
		? `Data plan · ${new Date(`${i.dueOn}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
		: `Instalment ${i.sequence}${i.ofCount ? ` of ${i.ofCount}` : ""}`;

const via: Record<string, string> = { DEBIT: "Debited (before Nov 2026)", PAYSTACK: "Paystack", MANUAL: "By hand", MONTHLY_INVOICE: "Monthly invoice" };

export function DeviceInvoicesTable({
	rows,
	money,
	showHotel,
	onChanged,
}: {
	rows: DeviceInvoiceView[];
	money: boolean;
	showHotel?: boolean;
	onChanged: () => void;
}) {
	const [paying, setPaying] = useState<DeviceInvoiceView | null>(null);
	const [reference, setReference] = useState("");
	const [busy, setBusy] = useState(false);
	const markPaid = async () => {
		if (!paying) return;
		setBusy(true);
		const r = await markDeviceInvoicePaid(paying.id, reference.trim(), null);
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(`${paying.number} marked paid`);
		setPaying(null);
		setReference("");
		onChanged();
	};
	return (
		<>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[720px] text-[13px]">
					<thead className={tableHead}>
						<tr>
							<th className={cell}>Invoice</th>
							{showHotel && <th className={cell}>Hotel</th>}
							<th className={cell}>For</th>
							<th className={cell}>Due</th>
							<th className={`${cell} text-right`}>Amount</th>
							<th className={cell}>Status</th>
							<th className={cell} />
						</tr>
					</thead>
					<tbody>
						{rows.map((i) => (
							<tr key={i.id} className={tableRow}>
								<td className={`${cell} font-semibold`}>
									{i.number}
									{i.monthlyInvoiceNumber && (
										<span className="block text-[11px] font-normal text-ink-3">On {i.monthlyInvoiceNumber}</span>
									)}
								</td>
								{showHotel && <td className={cell}>{i.hotelName ?? "—"}</td>}
								<td className={cell}>{invoiceLabel(i)}</td>
								<td className={cell}>{fmtLongDate(i.dueOn)}</td>
								<td className={`${cell} text-right font-semibold`}>{naira(i.amount)}</td>
								<td className={cell}>
									<span className="flex flex-col items-start gap-[2px]">
										{invoiceStatus(i)}
										{i.paidVia && <span className="text-[11px] text-ink-3">{via[i.paidVia] ?? i.paidVia}</span>}
										{i.posPaused && <span className="text-[11px] font-semibold text-danger">POS paused · unpaid invoice</span>}
									</span>
								</td>
								<td className={`${cell} text-right`}>
									{money && (i.status === "DUE" || i.status === "OVERDUE") && !i.monthlyInvoiceNumber && (
										<button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => setPaying(i)}>
											Mark paid
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<Modal
				open={!!paying}
				onOpenChange={(o) => !o && setPaying(null)}
				title={paying ? `Mark ${paying.number} paid` : ""}
				subtitle={paying ? `${paying.hotelName ?? ""} · ${naira(paying.amount - paying.paidAmount)} · cash or transfer received` : undefined}
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setPaying(null)}>
							Cancel
						</button>
						<button type="button" className={btn.primary} disabled={busy || !reference.trim()} onClick={() => void markPaid()}>
							Mark paid
						</button>
					</>
				}
			>
				<TextField label="Payment reference" value={reference} onChange={setReference} placeholder="Bank reference or receipt number" />
			</Modal>
		</>
	);
}

/** One package's invoices (inside the package panel). */
export function PackageInvoices({ packageId, money, onPaid }: { packageId: string; money: boolean; onPaid?: () => void }) {
	const [rows, setRows] = useState<DeviceInvoiceView[] | null>(null);
	const load = useCallback(async () => {
		const r = await packageInvoices(packageId);
		if (r.ok) setRows(r.data);
		else toast.error(r.error);
	}, [packageId]);
	useEffect(() => {
		void load();
	}, [load]);
	if (!rows) return <div className="h-16 animate-pulse rounded-xl bg-subtle" />;
	if (rows.length === 0)
		return <p className="text-[13px] text-ink-3">No invoices yet. The first is issued on the installation day, at 07:00 or 15:00.</p>;
	// A paid instalment changes the package (paid, left, the ledger), so the package reloads too.
	return (
		<DeviceInvoicesTable
			rows={rows}
			money={money}
			onChanged={() => {
				void load();
				onPaid?.();
			}}
		/>
	);
}

/** Fees & billing → Devices: every open invoice, plus "Run now" for a Super admin. */
export function AllDeviceInvoices({ money, superAdmin }: { money: boolean; superAdmin: boolean }) {
	const [rows, setRows] = useState<DeviceInvoiceView[] | null>(null);
	const [busy, setBusy] = useState(false);
	const load = useCallback(async () => {
		const r = await allDeviceInvoices();
		if (r.ok) setRows(r.data);
		else toast.error(r.error);
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
	const run = async () => {
		setBusy(true);
		const r = await runDeviceInvoices();
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(`${r.data.issued} issued, ${r.data.paid} paid, ${r.data.overdue} now overdue`);
		void load();
	};
	const open = (rows ?? []).filter((i) => i.status === "DUE" || i.status === "OVERDUE");
	return (
		<SectionCard
			title="Monthly device invoices"
			subtitle={`Instalments and data plans · each billed on that month's Hospio360 invoice · ${open.length} open`}
			headerRight={
				superAdmin ? (
					<button type="button" className={btn.secondary} onClick={() => void run()} disabled={busy}>
						{busy ? "Running…" : "Run now"}
					</button>
				) : undefined
			}
			flush
		>
			{!rows ? (
				<div className="mx-5 mb-5 h-16 animate-pulse rounded-xl bg-subtle" />
			) : rows.length === 0 ? (
				<p className="px-5 pb-5 text-[13px] text-ink-3">No device invoices yet.</p>
			) : (
				<DeviceInvoicesTable rows={rows.slice().reverse()} money={money} showHotel onChanged={() => void load()} />
			)}
		</SectionCard>
	);
}
