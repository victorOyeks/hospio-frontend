"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type DeviceInvoiceView, ownerDeviceInvoices } from "@hospio/api/actions/device-packages";
import { Note } from "@hospio/ui/shared/detail-list";
import { naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * Hospio fees → device invoices (hospio-backend docs/plan-device-packages.md, docs/plan-monthly-invoices.md): the monthly
 * instalments and data plan. Each one due in a month is billed on that month's Hospio360 invoice and paid under Billing &
 * invoices; nothing is paid here. Older ones stay listed as they were.
 */

const label = (i: DeviceInvoiceView) =>
	i.kind === "DATA_PLAN"
		? `Data plan · ${new Date(`${i.dueOn}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
		: `Devices · instalment ${i.sequence}${i.ofCount ? ` of ${i.ofCount}` : ""}`;

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function status(i: DeviceInvoiceView) {
	if (i.status === "PAID") return <StatusPill tone="success">Paid</StatusPill>;
	if (i.status === "OVERDUE") return <StatusPill tone="danger">{`Overdue · ${i.daysOverdue} day${i.daysOverdue === 1 ? "" : "s"}`}</StatusPill>;
	if (i.status === "VOID") return <StatusPill tone="grey">Not needed</StatusPill>;
	return <StatusPill tone="warning">Due</StatusPill>;
}

/** Where an instalment is paid: its Hospio360 monthly invoice, linked when it has been issued. */
function onInvoice(i: DeviceInvoiceView) {
	if (i.status === "PAID" || i.status === "VOID") return null;
	if (i.monthlyInvoiceNumber)
		return (
			<Link
				href={`/dashboard/billing${i.monthlyInvoiceId ? `?invoice=${encodeURIComponent(i.monthlyInvoiceId)}` : ""}`}
				className="text-[12px] font-semibold text-primary underline underline-offset-2"
			>
				On invoice {i.monthlyInvoiceNumber}
			</Link>
		);
	const month = new Date(`${i.dueOn.slice(0, 7)}-01T12:00:00`).toLocaleDateString("en-GB", { month: "long" });
	return <span className="text-[12px] text-ink-3">Billed on your {month} invoice</span>;
}

export function OwnerDeviceInvoices() {
	const [rows, setRows] = useState<DeviceInvoiceView[] | null>(null);
	useEffect(() => {
		void ownerDeviceInvoices().then((r) => {
			if (r.ok) setRows(r.data);
		});
	}, []);

	if (!rows || rows.length === 0) return null;
	const owed = rows.filter((i) => i.status === "DUE" || i.status === "OVERDUE");
	const paused = owed.some((i) => i.posPaused);
	return (
		<SectionCard
			title="Device invoices"
			subtitle={
				owed.length
					? `${naira(owed.reduce((a, i) => a + i.amount - i.paidAmount, 0))} still to pay · billed on your Hospio360 monthly invoice`
					: "Monthly instalments and data plan · billed on your Hospio360 monthly invoice"
			}
			flush
		>
			{paused && (
				<Note tone="danger" className="mx-5 mb-3">
					POS payments are paused until the Hospio360 invoice is paid. Pay it under{" "}
					<Link href="/dashboard/billing" className="font-medium underline underline-offset-2">
						Billing &amp; invoices
					</Link>{" "}
					and they start again within a minute.
				</Note>
			)}
			<div className="overflow-x-auto">
				<table className="w-full min-w-[620px] text-[13px]">
					<thead className={tableHead}>
						<tr>
							<th className={cell}>Invoice</th>
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
									{i.hotelName && <span className="block text-[11px] font-normal text-ink-3">{i.hotelName}</span>}
								</td>
								<td className={cell}>{label(i)}</td>
								<td className={cell}>{day(i.dueOn)}</td>
								<td className={`${cell} text-right font-semibold`}>{naira(i.amount)}</td>
								<td className={cell}>{status(i)}</td>
								<td className={`${cell} text-right`}>{onInvoice(i)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);
}
