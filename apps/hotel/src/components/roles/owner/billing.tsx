"use client";

import { CalendarClockIcon, CreditCardIcon, FileTextIcon, ReceiptIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	confirmInvoicePayment,
	type InvoiceRowView,
	type InvoiceView,
	invoiceFile,
	myInvoice,
	myInvoiceDays,
	payInvoice,
} from "@hospio/api/actions/billing";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { DownloadButton, InvoiceBody, InvoiceStatusPill, money } from "@hospio/ui/shared/invoice";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel } from "@hospio/ui/shared/side-panel";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Billing & invoices (hospio-backend docs/plan-monthly-invoices.md): Hospio360's one invoice a month for the business, issued on
 * the 1st for the month before and due 7 days later. The owner sees every location and pays the full amount through Paystack;
 * a manager sees their locations' lines, read-only. `?invoice=<id>` opens one (emails and the bell link here), `&pay=1` starts
 * Pay now (the banner), and Paystack comes back with `?reference=` (or `trxref=`), which is confirmed once.
 */

const OPEN = ["DUE", "OVERDUE"];

function sectionsSummary(r: InvoiceRowView) {
	const parts = [
		r.sections.platform ? `Platform ${money(r.sections.platform)}` : null,
		r.sections.messages ? `Messages ${money(r.sections.messages)}` : null,
		r.sections.devices ? `Devices ${money(r.sections.devices)}` : null,
		r.sections.carriedIn ? `Carried in ${money(r.sections.carriedIn)}` : null,
		r.sections.adjustments ? `Credits ${money(r.sections.adjustments)}` : null,
	].filter(Boolean);
	return parts.join(" · ") || "—";
}

export function BillingScreen({
	invoices,
	error,
	audience = "owner",
}: {
	invoices: InvoiceRowView[];
	error: string | null;
	audience?: "owner" | "manager";
}) {
	const router = useRouter();
	const params = useSearchParams();
	const openId = params.get("invoice");
	const reference = params.get("reference") ?? params.get("trxref");
	const autoPay = params.get("pay") === "1";
	const [invoice, setInvoice] = useState<InvoiceView | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [paying, setPaying] = useState(false);
	const confirmed = useRef(false);
	const autoPaid = useRef(false);

	const show = useCallback(
		(id: string | null) => router.replace(id ? `/dashboard/billing?invoice=${encodeURIComponent(id)}` : "/dashboard/billing", { scroll: false }),
		[router],
	);

	const pay = useCallback(async (id: string) => {
		setPaying(true);
		const back = `${window.location.origin}/hotel-owner/billing?invoice=${encodeURIComponent(id)}`;
		const r = await payInvoice(id, back);
		if (!r.ok) {
			setPaying(false);
			toast.error(r.error, { duration: 8000 });
			return;
		}
		window.location.assign(r.data.authorizationUrl);
	}, []);

	// Back from Paystack: confirm once (the webhook may have done it already), then show the invoice paid.
	useEffect(() => {
		if (!reference || confirmed.current) return;
		confirmed.current = true;
		void confirmInvoicePayment(reference).then((r) => {
			if (r.ok) {
				toast.success(`${r.data.number} is paid · thank you`, {
					description: "Anything that was paused starts again within a minute.",
				});
				setInvoice(r.data);
				show(r.data.id);
			} else if (/already paid|is paid/i.test(r.error)) {
				toast.success("This invoice is paid · thank you");
				show(openId);
			} else {
				toast.error(r.error, { duration: 8000 });
				show(openId);
			}
			router.refresh();
		});
	}, [reference, openId, router, show]);

	// The invoice in the address, loaded whenever it changes (not while the Paystack return is being confirmed).
	useEffect(() => {
		if (!openId || reference) {
			if (!openId) setInvoice(null);
			return;
		}
		let alive = true;
		setLoading(true);
		setLoadError(null);
		void myInvoice(openId).then((r) => {
			if (!alive) return;
			setLoading(false);
			if (r.ok) setInvoice(r.data);
			else {
				setInvoice(null);
				setLoadError(r.error);
			}
		});
		return () => {
			alive = false;
		};
	}, [openId, reference]);

	// "Pay now" from the banner: open the invoice and go straight to Paystack, once.
	useEffect(() => {
		if (!autoPay || autoPaid.current || !invoice || invoice.id !== openId) return;
		autoPaid.current = true;
		if (invoice.canPay) void pay(invoice.id);
		else show(invoice.id);
	}, [autoPay, invoice, openId, pay, show]);

	const open = invoices.filter((r) => OPEN.includes(r.status));
	const owed = open.reduce((a, r) => a + r.outstanding, 0);
	const next = [...open].sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
	const paidTotal = invoices.filter((r) => r.status !== "VOID").reduce((a, r) => a + r.paidAmount, 0);
	const restricted = open.some((r) => r.restricted);

	return (
		<>
			<PageHeader
				title="Billing & invoices"
				subtitle={
					audience === "manager"
						? "Hospio360's monthly invoice for your location, read-only · the owner pays it"
						: "One Hospio360 invoice a month: the platform fee, guest messages and devices · issued on the 1st, due 7 days later"
				}
			>
				<Link href="/dashboard/hospio-fees" className={cn(btn.secondary, "inline-flex items-center gap-2")}>
					<ReceiptIcon className="size-4" /> This month so far
				</Link>
			</PageHeader>
			{error && <Note tone="danger">{error}</Note>}
			{restricted && (
				<Note tone="danger">
					Card/transfer POS payments, new sales and new bookings are paused until the unpaid invoice is paid.
					{audience === "owner" ? " Pay it below and everything resumes within a minute." : " Ask the owner to pay it."}
				</Note>
			)}
			{audience === "owner" && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<KpiCard label="To pay" value={money(owed)} icon={CreditCardIcon} hint={open.length ? `${open.length} open invoice${open.length === 1 ? "" : "s"}` : "Nothing owed"} />
					<KpiCard label="Next due" value={next ? fmtLongDate(next.dueOn) : "—"} icon={CalendarClockIcon} hint={next ? next.number : undefined} />
					<KpiCard label="Paid to Hospio360" value={money(paidTotal)} icon={FileTextIcon} hint="On these invoices" />
				</div>
			)}
			<SectionCard title="Invoices" subtitle="Open one for its sections, day-by-day fees, payments and receipts" flush>
				{invoices.length === 0 ? (
					<EmptyState
						title="No invoices yet"
						hint="The first invoice is issued on the 1st for the month before. Until then, Hospio fees shows this month so far."
						className="m-5"
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[720px] text-left">
							<thead>
								<tr className={tableHead}>
									<th className={cell}>Invoice</th>
									<th className={cell}>Month</th>
									<th className={cell}>Sections</th>
									<th className={`${cell} text-right`}>Total</th>
									<th className={cell}>Status</th>
									<th className={cell}>Due</th>
								</tr>
							</thead>
							<tbody>
								{invoices.map((r) => (
									<tr key={r.id} className={cn(tableRow, "cursor-pointer")} onClick={() => show(r.id)}>
										<td className={`${cell} font-semibold`}>
											{r.number}
											<span className="block text-[11px] font-normal text-ink-3">Issued {fmtLongDate(r.issuedOn)}</span>
										</td>
										<td className={cell}>{r.monthLabel ?? r.month}</td>
										<td className={`${cell} text-[12px] text-ink-2`}>{sectionsSummary(r)}</td>
										<td className={`${cell} text-right font-semibold`}>
											{money(r.total)}
											{OPEN.includes(r.status) && r.paidAmount > 0 && (
												<span className="block text-[11px] font-normal text-ink-3">{money(r.outstanding)} left</span>
											)}
										</td>
										<td className={cell}>
											<InvoiceStatusPill status={r.displayStatus} />
										</td>
										<td className={`${cell} text-ink-2`}>
											{OPEN.includes(r.status) ? fmtLongDate(r.extendedUntil ?? r.dueOn) : "—"}
											{OPEN.includes(r.status) && r.extendedUntil && <span className="block text-[11px] text-ink-3">extended</span>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</SectionCard>
			<p className="text-[12px] text-ink-3">
				How it works: the invoice is issued on the 1st at 07:00 for the month before and is due on the 8th. Reminders go to the owner by email.
				If it isn't paid by the 11th, card/transfer POS payments, new sales and new bookings pause from 06:00 on the 12th; check-out, cash on
				existing bills and tabs, reports and paying the invoice still work. A month under ₦1,000 is carried into the next one. No VAT is charged.
			</p>

			<SidePanel
				open={!!openId && !reference}
				onOpenChange={(o) => !o && show(null)}
				title={invoice ? `Invoice ${invoice.number}` : "Invoice"}
				subtitle={
					invoice ? (
						<span className="inline-flex flex-wrap items-center gap-2">
							{invoice.monthLabel ?? invoice.month} · issued {fmtLongDate(invoice.issuedOn)} <InvoiceStatusPill status={invoice.displayStatus} />
						</span>
					) : undefined
				}
				icon={FileTextIcon}
				width="lg"
				footerInfo={
					invoice && OPEN.includes(invoice.status) && audience === "manager" ? "Only the owner can pay this invoice." : undefined
				}
				footer={
					invoice ? (
						<>
							<DownloadButton load={() => invoiceFile({ kind: "pdf", id: invoice.id })}>Download PDF</DownloadButton>
							{invoice.canPay && (
								<button type="button" className={btn.primary} disabled={paying} onClick={() => void pay(invoice.id)}>
									{paying ? "Opening Paystack…" : `Pay now · ${money(invoice.outstanding)}`}
								</button>
							)}
						</>
					) : undefined
				}
			>
				{loading && <p className="py-6 text-sm text-ink-3">Loading the invoice…</p>}
				{loadError && <Note tone="danger">{loadError}</Note>}
				{invoice && !loading && (
					<InvoiceBody
						invoice={invoice}
						audience={audience}
						loadDays={() => myInvoiceDays(invoice.id)}
						daysCsv={() => invoiceFile({ kind: "days", id: invoice.id })}
						receipt={(paymentId) => invoiceFile({ kind: "receipt", id: invoice.id, paymentId })}
					/>
				)}
			</SidePanel>
		</>
	);
}
