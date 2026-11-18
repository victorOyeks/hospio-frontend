"use client";

import { DownloadIcon, Loader2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@hospio/api/actions/auth";
import type { BillingFile, InvoiceDay, InvoiceLineView, InvoiceView } from "@hospio/api/actions/billing";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, fmtWhen } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PanelSection } from "@hospio/ui/shared/side-panel";
import { type PillTone, StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Hospio360's monthly invoice (hospio-backend docs/plan-monthly-invoices.md), drawn the same way in the hotel app (Billing &
 * invoices) and the admin portal (Fees & billing → Invoices): the status chip, the sections with their lines, the platform fee
 * day by day per location, payments with receipts, and the notes (extension, carried forward, void).
 */

/** ₦63,450 or ₦63,450.50 when there are kobo: an invoice shows exactly what is owed. */
export function money(n: number | null | undefined) {
	const v = n ?? 0;
	const sign = v < 0 ? "-" : "";
	const abs = Math.abs(v);
	const kobo = Math.round(abs * 100) % 100 !== 0;
	return `${sign}₦${abs.toLocaleString("en-NG", { minimumFractionDigits: kobo ? 2 : 0, maximumFractionDigits: 2 })}`;
}

const STATUS: Record<string, { label: string; tone: PillTone }> = {
	DUE: { label: "Due", tone: "warning" },
	DUE_SOON: { label: "Due soon", tone: "warning" },
	OVERDUE: { label: "Overdue", tone: "danger" },
	RESTRICTED: { label: "Paused", tone: "danger" },
	PAID: { label: "Paid", tone: "success" },
	CARRIED_FORWARD: { label: "Carried forward", tone: "grey" },
	VOID: { label: "Void", tone: "grey" },
};

export const invoiceStatusLabel = (s: string) => STATUS[s]?.label ?? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export function InvoiceStatusPill({ status }: { status: string }) {
	return <StatusPill tone={STATUS[status]?.tone ?? "grey"}>{invoiceStatusLabel(status)}</StatusPill>;
}

const SECTIONS: { key: string; title: string; total: keyof InvoiceView["sections"] }[] = [
	{ key: "PLATFORM", title: "Platform fee", total: "platform" },
	{ key: "MESSAGES", title: "Guest messages", total: "messages" },
	{ key: "DEVICES", title: "Devices & internet", total: "devices" },
	{ key: "CARRIED", title: "Carried in", total: "carriedIn" },
	{ key: "ADJUSTMENT", title: "Credits & adjustments", total: "adjustments" },
];

/** A short line under the section's title: what goes in it. */
const SECTION_HINT: Record<string, string> = {
	PLATFORM: "Each location's sales for the month (VAT excluded) × the rate",
	MESSAGES: "Each location's guest-message invoice for the month",
	DEVICES: "Instalments and data plan due this month, and the share of sales for devices",
	CARRIED: "An earlier month under ₦1,000, or a credit, brought into this invoice",
	ADJUSTMENT: "Credit notes (less) and adjustments (more) Hospio360 added, with the reason",
};

/** Saves a file the server action fetched: CSV text or a PDF in base64. */
export function saveFile(f: BillingFile) {
	const blob = f.base64
		? new Blob([Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0))], { type: f.type })
		: new Blob([`﻿${f.text ?? ""}`], { type: `${f.type};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = f.name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A button that fetches a file through a server action and saves it. */
export function DownloadButton({
	load,
	children,
	variant = "secondary",
	className,
}: {
	load: () => Promise<ActionResult<BillingFile>>;
	children: ReactNode;
	variant?: "secondary" | "link";
	className?: string;
}) {
	const [busy, setBusy] = useState(false);
	return (
		<button
			type="button"
			disabled={busy}
			className={cn(variant === "link" ? btn.link : btn.secondary, "inline-flex items-center gap-[6px]", className)}
			onClick={async () => {
				setBusy(true);
				try {
					const r = await load();
					if (r.ok) saveFile(r.data);
					else toast.error(r.error);
				} finally {
					setBusy(false);
				}
			}}
		>
			{busy ? <Loader2Icon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
			{children}
		</button>
	);
}

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** The platform fee for one location, one row per day, from the invoice's day rows. */
function DayByDay({
	open,
	onClose,
	hotelName,
	days,
	loading,
	csv,
}: {
	open: boolean;
	onClose: () => void;
	hotelName: string;
	days: InvoiceDay[];
	loading: boolean;
	csv?: () => Promise<ActionResult<BillingFile>>;
}) {
	const sales = days.reduce((a, d) => a + d.sales, 0);
	const fee = days.reduce((a, d) => a + d.fee, 0);
	const device = days.reduce((a, d) => a + (d.deviceFee ?? 0), 0);
	const anyDevice = device > 0;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`${hotelName} · day by day`}
			subtitle="Each day's sales (VAT excluded) and the fee on it"
			size="large"
			footer={csv ? <DownloadButton load={csv}>Download CSV</DownloadButton> : undefined}
		>
			{loading ? (
				<p className="flex items-center gap-2 py-6 text-sm text-ink-3">
					<Loader2Icon className="size-4 animate-spin" /> Loading the days…
				</p>
			) : days.length === 0 ? (
				<p className="py-4 text-[13px] text-ink-3">No days for this location on this invoice.</p>
			) : (
				<div className="max-h-[60vh] overflow-auto">
					<table className="w-full text-left">
						<thead>
							<tr className={tableHead}>
								<th className={cell}>Day</th>
								<th className={`${cell} text-right`}>Sales</th>
								<th className={`${cell} text-right`}>Fee</th>
								{anyDevice && <th className={`${cell} text-right`}>Devices</th>}
							</tr>
						</thead>
						<tbody>
							{days.map((d) => (
								<tr key={d.id} className={tableRow}>
									<td className={cell}>{day(d.date)}</td>
									<td className={`${cell} text-right`}>{money(d.sales)}</td>
									<td className={`${cell} text-right`}>{money(d.fee)}</td>
									{anyDevice && <td className={`${cell} text-right`}>{(d.deviceFee ?? 0) > 0 ? money(d.deviceFee) : "—"}</td>}
								</tr>
							))}
							<tr className="font-semibold">
								<td className={cell}>{days.length} days</td>
								<td className={`${cell} text-right`}>{money(sales)}</td>
								<td className={`${cell} text-right`}>{money(fee)}</td>
								{anyDevice && <td className={`${cell} text-right`}>{money(device)}</td>}
							</tr>
						</tbody>
					</table>
				</div>
			)}
		</Modal>
	);
}

function LineRow({ l, multi, onDays }: { l: InvoiceLineView; multi: boolean; onDays?: () => void }) {
	const platform = l.section === "PLATFORM" && l.baseAmount != null && l.rate != null;
	return (
		<li className="flex items-start justify-between gap-3 py-[10px]">
			<div className="min-w-0">
				<p className="text-[13px] font-medium text-ink">
					{multi && l.hotelName && l.section !== "PLATFORM" && !l.label.includes(l.hotelName) ? `${l.hotelName} · ` : ""}
					{l.section === "PLATFORM" && l.hotelName ? l.hotelName : l.label}
				</p>
				{platform && (
					<p className="text-[12px] text-ink-3">
						Sales {money(l.baseAmount)} × {l.rate}% = {money(l.amount)}
					</p>
				)}
				{l.detail && !platform && <p className="text-[12px] text-ink-3">{l.detail}</p>}
				{l.detail && platform && <p className="text-[12px] text-ink-3">{l.detail.split(" · ")[0]}</p>}
				{l.section === "ADJUSTMENT" && l.createdByName && (
					<p className="text-[11px] text-ink-3">
						Added by {l.createdByName}
						{l.createdAt ? ` · ${fmtWhen(l.createdAt)}` : ""}
					</p>
				)}
				{onDays && (
					<button type="button" className={cn(btn.link, "mt-1 text-[12px]")} onClick={onDays}>
						Day by day
					</button>
				)}
			</div>
			<p className={cn("shrink-0 text-[13px] font-semibold", l.amount < 0 ? "text-success" : "text-ink")}>{money(l.amount)}</p>
		</li>
	);
}

/**
 * The invoice itself: notes, sections with lines, totals and payments. `loadDays` gives the day rows for "Day by day";
 * `daysCsv` and `receipt` are the downloads (left out where the route doesn't exist).
 */
export function InvoiceBody({
	invoice: i,
	loadDays,
	daysCsv,
	receipt,
	audience = "owner",
}: {
	invoice: InvoiceView;
	loadDays: () => Promise<ActionResult<InvoiceDay[]>>;
	daysCsv?: () => Promise<ActionResult<BillingFile>>;
	receipt?: (paymentId: string) => Promise<ActionResult<BillingFile>>;
	audience?: "owner" | "manager" | "admin";
}) {
	const [daysFor, setDaysFor] = useState<{ hotelId: string; hotelName: string } | null>(null);
	const [days, setDays] = useState<InvoiceDay[] | null>(null);
	const [loadingDays, setLoadingDays] = useState(false);
	const hotels = new Set(i.lines.map((l) => l.hotelId).filter(Boolean)).size;
	const openDays = async (hotelId: string, hotelName: string) => {
		setDaysFor({ hotelId, hotelName });
		if (days) return;
		setLoadingDays(true);
		const r = await loadDays();
		setLoadingDays(false);
		if (r.ok) setDays(r.data);
		else toast.error(r.error);
	};
	const vat = (i.vatAmount ?? 0) > 0;
	const open = i.status === "DUE" || i.status === "OVERDUE";
	return (
		<div className="flex flex-col gap-5">
			{i.status === "VOID" && (
				<Note tone="info">
					This invoice was voided{i.voidReason ? `: ${i.voidReason}` : ""}.
					{i.replacedByNumber ? ` It was replaced by ${i.replacedByNumber}.` : " Nothing is owed on it."}
				</Note>
			)}
			{i.status === "CARRIED_FORWARD" && (
				<Note tone="info">
					Nothing to pay this month: the total is under ₦1,000, so it rolls into the next month's invoice
					{i.carriedIntoNumber ? ` (${i.carriedIntoNumber})` : ""} instead.
				</Note>
			)}
			{i.reissueOfNumber && <Note tone="info">This invoice replaces {i.reissueOfNumber}, which was voided.</Note>}
			{i.extendedUntil && (
				<Note tone="info">
					Extended: the last day to pay is {fmtLongDate(i.extendedUntil)}
					{i.extensionReason ? ` (${i.extensionReason})` : ""}
					{audience === "admin" && i.extendedByName ? ` · by ${i.extendedByName}` : ""}.
				</Note>
			)}
			{i.restricted && open && (
				<Note tone="danger">
					Card/transfer POS payments, new sales and new bookings are paused until this invoice is paid
					{i.restrictedAt ? ` (since ${fmtWhen(i.restrictedAt)})` : ""}. Check-out, cash on existing bills and tabs, and reports still work.
				</Note>
			)}
			{!i.restricted && open && i.lastDay && (
				<p className="text-[13px] text-ink-2">
					Due {fmtLongDate(i.dueOn)}. If it isn't paid by the end of {fmtLongDate(i.lastDay)}, card/transfer POS payments, new sales and new
					bookings pause from 06:00 the next morning until it is paid.
				</p>
			)}
			{audience === "manager" && hotels > 0 && (
				<p className="text-[12px] text-ink-3">You see the lines for your location{hotels === 1 ? "" : "s"}; the owner sees the whole invoice and pays it.</p>
			)}

			{SECTIONS.map((s) => {
				const lines = i.lines.filter((l) => l.section === s.key);
				const total = i.sections[s.total];
				if (lines.length === 0 && !total) return null;
				return (
					<PanelSection key={s.key} title={s.title}>
						<p className="-mt-2 text-[12px] text-ink-3">{SECTION_HINT[s.key]}</p>
						<ul className="divide-y divide-line">
							{lines.map((l) => (
								<LineRow
									key={l.id}
									l={l}
									multi={hotels > 1}
									onDays={l.section === "PLATFORM" && l.hotelId ? () => void openDays(l.hotelId as string, l.hotelName ?? "Location") : undefined}
								/>
							))}
						</ul>
						{audience !== "manager" && (
							<div className="flex justify-between border-t border-line pt-2 text-[13px] font-semibold">
								<span>{s.title}</span>
								<span>{money(total)}</span>
							</div>
						)}
					</PanelSection>
				);
			})}

			{audience !== "manager" && (
				<TotalsList
					rows={[
						...(vat ? [{ label: `VAT ${i.vatPct ?? 0}%`, value: money(i.vatAmount) }] : []),
						{ label: "Total", value: money(i.total), strong: true },
						...(i.paidAmount > 0 ? [{ label: "Paid", value: money(i.paidAmount), tone: "success" as const }] : []),
						...(open ? [{ label: "To pay", value: money(i.outstanding), strong: true, tone: i.outstanding > 0 ? ("danger" as const) : undefined }] : []),
					]}
				/>
			)}
			{audience !== "manager" && !vat && <p className="-mt-3 text-[11px] text-ink-3">No VAT is charged on this invoice.</p>}

			{i.payments.length > 0 && (
				<PanelSection title="Payments & receipts">
					<ul className="divide-y divide-line">
						{i.payments.map((p) => (
							<li key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-[10px]">
								<div className="min-w-0">
									<p className="text-[13px] font-medium text-ink">
										{money(p.amount)} · {viaLabel(p.via)}
										{p.paidOn ? ` · ${fmtLongDate(p.paidOn)}` : ""}
									</p>
									<p className="text-[12px] text-ink-3">
										{p.receiptNumber ? `Receipt ${p.receiptNumber}` : "Receipt"}
										{p.reference ? ` · ref ${p.reference}` : ""}
										{audience === "admin" && p.recordedByName ? ` · recorded by ${p.recordedByName}` : ""}
									</p>
									{p.note && <p className="text-[12px] text-ink-3">{p.note}</p>}
								</div>
								{receipt && (
									<DownloadButton variant="link" load={() => receipt(p.id)}>
										Receipt PDF
									</DownloadButton>
								)}
							</li>
						))}
					</ul>
				</PanelSection>
			)}

			{daysFor && (
				<DayByDay
					open
					onClose={() => setDaysFor(null)}
					hotelName={daysFor.hotelName}
					days={(days ?? []).filter((d) => d.hotelId === daysFor.hotelId)}
					loading={loadingDays}
					csv={daysCsv}
				/>
			)}
		</div>
	);
}

export const viaLabel = (via?: string | null) =>
	({ PAYSTACK: "Paystack", BANK_TRANSFER: "Bank transfer", CASH: "Cash", CHEQUE: "Cheque", OTHER: "Other", CARRIED: "Carried forward" })[via ?? ""] ??
	(via ? via.charAt(0) + via.slice(1).toLowerCase().replace(/_/g, " ") : "—");
