"use client";

import { AlertTriangleIcon, BanknoteIcon, CheckCircle2Icon, CoinsIcon, FileTextIcon, SparklesIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import {
	adjustInvoice,
	adminInvoice,
	adminInvoiceDays,
	adminInvoices,
	exportInvoices,
	extendInvoice,
	type InvoiceEventView,
	type InvoiceListView,
	type InvoiceView,
	invoiceFile,
	issueInvoices,
	recordInvoicePayment,
	voidInvoice,
} from "@hospio/api/actions/billing";
import { useAction } from "@hospio/api/actions/use-action";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import type { BusinessRow } from "@hospio/api/data/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { MoneyField, SelectField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, fmtWhen } from "@hospio/ui/shared/format";
import { DownloadButton, InvoiceBody, InvoiceStatusPill, invoiceStatusLabel, money } from "@hospio/ui/shared/invoice";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { FilterSelect, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { Loading, monthOptions } from "./live";
import { can } from "./shared";

/**
 * Admin · Fees & billing → Invoices (hospio-backend docs/plan-monthly-invoices.md): every business's Hospio360 monthly invoice
 * (HIN-YYYYMM-NNNN) by status, month and business, with counts, totals and the CSV export. A row opens the invoice in a panel
 * (`?invoice=`): sections, day by day, payments and receipts, the reminder and action log, and for the money roles Record
 * payment, Extend (once), Credit note / adjustment and Void (optionally reissue). Super admin can issue a month that has ended.
 * With `businessId` it is that business's invoices (the business page's Money tab) and the business filter is hidden.
 */

const STATUSES = ["DUE", "DUE_SOON", "OVERDUE", "RESTRICTED", "PAID", "CARRIED_FORWARD", "VOID"];
const OPEN = ["DUE", "OVERDUE"];

const EVENT_LABEL: Record<string, string> = {
	ISSUED: "Issued",
	REMINDER: "Reminder",
	DUE_TODAY: "Due today",
	OVERDUE: "Overdue notice",
	FINAL_WARNING: "Final warning",
	RESTRICTED: "Restriction notice",
	RESTRICTED_ON: "Restricted",
	LIFTED: "Restriction lifted",
	PAYMENT: "Payment",
	PAID: "Paid",
	RECEIPT: "Receipt sent",
	EXTENDED: "Extended",
	ADJUSTED: "Adjusted",
	VOIDED: "Voided",
	REISSUED: "Reissued",
	CARRIED_FORWARD: "Carried forward",
};
const OUTCOME_LABEL: Record<string, string> = {
	EMAILED: "emailed",
	NO_EMAIL: "no email on file",
	SKIPPED_QA_ONLY: "not sent (staging: QA businesses only)",
};

function previousMonth() {
	const d = new Date();
	const m = new Date(d.getFullYear(), d.getMonth() - 1, 1);
	return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export function InvoicesTab({
	role,
	businesses = [],
	businessId,
}: {
	role: AdminRole;
	businesses?: BusinessRow[];
	/** One business's invoices (business page): no business filter. */
	businessId?: string;
}) {
	const money_ = can.money(role);
	const opts = parseAsString.withOptions({ history: "replace", scroll: false });
	const [status, setStatus] = useQueryState("istatus", opts);
	const [month, setMonth] = useQueryState("imonth", opts);
	const [biz, setBiz] = useQueryState("ibusiness", opts);
	const [openId, setOpenId] = useQueryState("invoice", opts);
	const [list, setList] = useState<InvoiceListView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [issue, setIssue] = useState(false);
	const forBusiness = businessId ?? biz ?? undefined;
	const query = { status: status ?? undefined, month: month ?? undefined, businessId: forBusiness };

	const load = useCallback(async () => {
		const r = await adminInvoices({ status: status ?? undefined, month: month ?? undefined, businessId: businessId ?? biz ?? undefined });
		if (r.ok) {
			setList(r.data);
			setError(null);
		} else setError(r.error);
	}, [status, month, biz, businessId]);
	useEffect(() => {
		void load();
	}, [load]);

	const counts = list?.counts ?? {};
	const totals = list?.totals ?? {};
	const rows = list?.invoices ?? [];

	return (
		<div className="flex flex-col gap-4">
			{!businessId && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<KpiCard label="Invoiced" value={money(totals.invoiced)} icon={FileTextIcon} hint="Not counting void invoices" />
					<KpiCard label="Paid" value={money(totals.paid)} icon={CheckCircle2Icon} />
					<KpiCard label="Outstanding" value={money(totals.outstanding)} icon={AlertTriangleIcon} hint="On open invoices" />
					<KpiCard label="Platform fee" value={money(totals.platformFee)} icon={CoinsIcon} hint="The platform fee section" />
				</div>
			)}
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "ALL", label: "All" },
							...STATUSES.map((s) => ({ key: s, label: invoiceStatusLabel(s), count: counts[s] || undefined })),
						]}
						value={status ?? "ALL"}
						onChange={(k) => void setStatus(k === "ALL" ? null : k)}
					/>
				}
				right={
					<>
						<FilterSelect value={month ?? ""} onChange={(v) => void setMonth(v || null)} all="All months" options={monthOptions(14)} />
						{!businessId && (
							<FilterSelect
								value={biz ?? ""}
								onChange={(v) => void setBiz(v || null)}
								all="All businesses"
								options={businesses.map((b) => ({ value: b.id, label: b.name }))}
							/>
						)}
						<DownloadButton load={() => exportInvoices(query)}>Export CSV</DownloadButton>
						{role === "SUPER_ADMIN" && (
							<button type="button" className={cn(btn.primary, "inline-flex items-center gap-2")} onClick={() => setIssue(true)}>
								<SparklesIcon className="size-4" /> Issue a month
							</button>
						)}
					</>
				}
			/>
			{error && <Note tone="danger">{error}</Note>}
			<section className="rounded-card border border-line bg-card">
				{!list && !error ? (
					<div className="px-5">
						<Loading label="Loading invoices…" />
					</div>
				) : rows.length === 0 ? (
					<EmptyState
						title="No invoices"
						hint="Invoices are issued on the 1st at 07:00 for the month before. Change the filters to see others."
						className="m-5"
					/>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[900px] text-left">
							<thead>
								<tr className={tableHead}>
									<th className={cell}>Invoice</th>
									{!businessId && <th className={cell}>Business</th>}
									<th className={cell}>Month</th>
									<th className={`${cell} text-right`}>Platform</th>
									<th className={`${cell} text-right`}>Messages</th>
									<th className={`${cell} text-right`}>Devices</th>
									<th className={`${cell} text-right`}>Total</th>
									<th className={`${cell} text-right`}>Outstanding</th>
									<th className={cell}>Status</th>
									<th className={cell}>Due</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.id} className={cn(tableRow, "cursor-pointer")} onClick={() => void setOpenId(r.id)}>
										<td className={`${cell} font-semibold`}>
											{r.number}
											<span className="block text-[11px] font-normal text-ink-3">Issued {fmtLongDate(r.issuedOn)}</span>
										</td>
										{!businessId && <td className={cell}>{r.businessName ?? "—"}</td>}
										<td className={cell}>{r.monthLabel ?? r.month}</td>
										<td className={`${cell} text-right`}>{money(r.sections.platform)}</td>
										<td className={`${cell} text-right`}>{r.sections.messages ? money(r.sections.messages) : "—"}</td>
										<td className={`${cell} text-right`}>{r.sections.devices ? money(r.sections.devices) : "—"}</td>
										<td className={`${cell} text-right font-semibold`}>{money(r.total)}</td>
										<td className={cn(cell, "text-right", r.outstanding > 0 && "font-semibold text-danger")}>{money(r.outstanding)}</td>
										<td className={cell}>
											<InvoiceStatusPill status={r.displayStatus} />
										</td>
										<td className={`${cell} text-ink-2`}>
											{fmtLongDate(r.dueOn)}
											{r.extendedUntil && <span className="block text-[11px] text-ink-3">extended to {fmtLongDate(r.extendedUntil)}</span>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
			<InvoicePanel id={openId} onClose={() => void setOpenId(null)} money={money_} onChanged={() => void load()} />
			{issue && (
				<IssueModal
					businesses={businesses}
					businessId={businessId}
					onClose={() => setIssue(false)}
					onDone={() => {
						setIssue(false);
						void load();
					}}
				/>
			)}
		</div>
	);
}

type Action = "pay" | "extend" | "adjust" | "void" | null;

function InvoicePanel({ id, onClose, money: canMoney, onChanged }: { id: string | null; onClose: () => void; money: boolean; onChanged: () => void }) {
	const [invoice, setInvoice] = useState<InvoiceView | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [action, setAction] = useState<Action>(null);
	useEffect(() => {
		if (!id) {
			setInvoice(null);
			return;
		}
		let alive = true;
		setLoading(true);
		void adminInvoice(id).then((r) => {
			if (!alive) return;
			setLoading(false);
			if (r.ok) {
				setInvoice(r.data);
				setError(null);
			} else setError(r.error);
		});
		return () => {
			alive = false;
		};
	}, [id]);
	const changed = (i: InvoiceView) => {
		setInvoice(i);
		setAction(null);
		onChanged();
	};
	const open = !!invoice && OPEN.includes(invoice.status);
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={invoice ? `Invoice ${invoice.number}` : "Invoice"}
			subtitle={
				invoice ? (
					<span className="inline-flex flex-wrap items-center gap-2">
						{invoice.businessName} · {invoice.monthLabel ?? invoice.month} · issued {fmtLongDate(invoice.issuedOn)}{" "}
						<InvoiceStatusPill status={invoice.displayStatus} />
					</span>
				) : undefined
			}
			icon={FileTextIcon}
			width="lg"
			footer={
				invoice ? (
					<>
						<DownloadButton load={() => invoiceFile({ kind: "pdf", id: invoice.id }, true)}>Download PDF</DownloadButton>
						{canMoney && open && (
							<button type="button" className={cn(btn.primary, "inline-flex items-center gap-2")} onClick={() => setAction("pay")}>
								<BanknoteIcon className="size-4" /> Record payment
							</button>
						)}
					</>
				) : undefined
			}
		>
			{loading && <Loading label="Loading the invoice…" />}
			{error && <Note tone="danger">{error}</Note>}
			{invoice && !loading && (
				<div className="flex flex-col gap-6">
					{canMoney && invoice.status !== "VOID" && (
						<div className="flex flex-wrap gap-2">
							{open && (
								<button
									type="button"
									className={btn.secondary}
									disabled={!!invoice.extendedUntil}
									title={invoice.extendedUntil ? "An invoice can be extended once" : undefined}
									onClick={() => setAction("extend")}
								>
									{invoice.extendedUntil ? "Extended once" : "Extend"}
								</button>
							)}
							{invoice.status !== "PAID" && (
								<button type="button" className={btn.secondary} onClick={() => setAction("adjust")}>
									Credit note / adjustment
								</button>
							)}
							<button type="button" className={btn.dangerSoft} onClick={() => setAction("void")}>
								Void
							</button>
						</div>
					)}
					<InvoiceBody
						invoice={invoice}
						audience="admin"
						loadDays={() => adminInvoiceDays(invoice.id)}
						receipt={(paymentId) => invoiceFile({ kind: "receipt", id: invoice.id, paymentId }, true)}
					/>
					<PanelSection title="Reminders & actions">
						<EventLog events={invoice.events ?? []} />
					</PanelSection>
				</div>
			)}
			{invoice && action === "pay" && <PaymentModal invoice={invoice} onClose={() => setAction(null)} onDone={changed} />}
			{invoice && action === "extend" && <ExtendModal invoice={invoice} onClose={() => setAction(null)} onDone={changed} />}
			{invoice && action === "adjust" && <AdjustModal invoice={invoice} onClose={() => setAction(null)} onDone={changed} />}
			{invoice && action === "void" && <VoidModal invoice={invoice} onClose={() => setAction(null)} onDone={changed} />}
		</SidePanel>
	);
}

function EventLog({ events }: { events: InvoiceEventView[] }) {
	if (events.length === 0) return <p className="text-[13px] text-ink-3">Nothing logged yet.</p>;
	return (
		<ol className="flex flex-col divide-y divide-line">
			{events.map((e) => (
				<li key={e.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
					<div className="min-w-0">
						<p className="text-[13px] font-medium text-ink">
							{EVENT_LABEL[e.kind] ?? e.kind}
							{e.outcome ? <span className="font-normal text-ink-3"> · {OUTCOME_LABEL[e.outcome] ?? e.outcome.toLowerCase()}</span> : null}
						</p>
						<p className="text-[12px] text-ink-3">
							{[e.recipient, e.actorName ? `by ${e.actorName}` : null, e.note].filter(Boolean).join(" · ") || "—"}
						</p>
					</div>
					<span className="shrink-0 text-[12px] text-ink-3">{e.createdAt ? fmtWhen(e.createdAt) : e.onDate ? fmtLongDate(e.onDate) : ""}</span>
				</li>
			))}
		</ol>
	);
}

function PaymentModal({ invoice, onClose, onDone }: { invoice: InvoiceView; onClose: () => void; onDone: (i: InvoiceView) => void }) {
	const [amount, setAmount] = useState<number | "">(invoice.outstanding);
	const [via, setVia] = useState("BANK_TRANSFER");
	const [reference, setReference] = useState("");
	const [paidOn, setPaidOn] = useState(today());
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	const ok = typeof amount === "number" && amount > 0 && amount <= invoice.outstanding + 0.001 && !!paidOn;
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Record a payment"
			subtitle={`${invoice.number} · ${money(invoice.outstanding)} to pay · part payments are fine`}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!ok || pending}
						onClick={() =>
							run(() => recordInvoicePayment(invoice.id, { amount: amount as number, via, reference, paidOn, note }), (i) =>
								i.status === "PAID" ? `${i.number} is paid · receipt made` : `Payment recorded · ${money(i.outstanding)} still to pay`,
							onDone)
						}
					>
						{pending ? "Saving…" : "Record payment"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<MoneyField label="Amount" value={amount} onChange={setAmount} required hint={`Up to ${money(invoice.outstanding)}`} />
				<SelectField
					label="How it was paid"
					value={via}
					onChange={setVia}
					options={[
						{ value: "BANK_TRANSFER", label: "Bank transfer" },
						{ value: "CASH", label: "Cash" },
						{ value: "CHEQUE", label: "Cheque" },
						{ value: "OTHER", label: "Other" },
					]}
				/>
				<TextField label="Reference" value={reference} onChange={setReference} placeholder="Bank reference or cheque number" />
				<TextField label="Paid on" type="date" value={paidOn} onChange={setPaidOn} required />
				<TextareaField label="Note" value={note} onChange={setNote} rows={2} />
				<Note tone="info">The business gets a receipt. When the invoice is fully paid, anything paused starts again within a minute.</Note>
			</div>
		</Modal>
	);
}

function ExtendModal({ invoice, onClose, onDone }: { invoice: InvoiceView; onClose: () => void; onDone: (i: InvoiceView) => void }) {
	const [until, setUntil] = useState("");
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const ok = !!until && reason.trim().length >= 3 && (!invoice.lastDay || until > invoice.lastDay);
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Extend the last day to pay"
			subtitle={`${invoice.number} · last day now ${invoice.lastDay ? fmtLongDate(invoice.lastDay) : "—"} · once per invoice`}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!ok || pending}
						onClick={() => run(() => extendInvoice(invoice.id, until, reason), (i) => `Extended to ${fmtLongDate(i.extendedUntil ?? until)}`, onDone)}
					>
						{pending ? "Saving…" : "Extend"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField label="New last day" type="date" value={until} onChange={setUntil} required hint="If it is still unpaid, the pause starts at 06:00 the next morning" />
				<TextareaField label="Reason" value={reason} onChange={setReason} rows={2} placeholder="Shown on the invoice" />
				{invoice.restricted && <Note tone="info">The business is paused now; extending lifts the pause until the new last day.</Note>}
			</div>
		</Modal>
	);
}

function AdjustModal({ invoice, onClose, onDone }: { invoice: InvoiceView; onClose: () => void; onDone: (i: InvoiceView) => void }) {
	const [kind, setKind] = useState("CREDIT");
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const ok = typeof amount === "number" && amount > 0 && reason.trim().length >= 3;
	const signed = typeof amount === "number" ? (kind === "CREDIT" ? -amount : amount) : 0;
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Credit note or adjustment"
			subtitle={`${invoice.number} · total now ${money(invoice.total)}`}
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!ok || pending}
						onClick={() => run(() => adjustInvoice(invoice.id, signed, reason), (i) => `Saved · total now ${money(i.total)}`, onDone)}
					>
						{pending ? "Saving…" : kind === "CREDIT" ? "Add credit note" : "Add adjustment"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Kind"
					value={kind}
					onChange={setKind}
					options={[
						{ value: "CREDIT", label: "Credit note (takes money off)" },
						{ value: "ADJUST", label: "Adjustment (adds money)" },
					]}
				/>
				<MoneyField label="Amount" value={amount} onChange={setAmount} required />
				<TextareaField label="Reason" value={reason} onChange={setReason} rows={2} placeholder="Shown on the invoice" />
				{typeof amount === "number" && amount > 0 && (
					<p className="text-[13px] text-ink-2">New total: {money(invoice.total + signed)}</p>
				)}
			</div>
		</Modal>
	);
}

function VoidModal({ invoice, onClose, onDone }: { invoice: InvoiceView; onClose: () => void; onDone: (i: InvoiceView) => void }) {
	const [reason, setReason] = useState("");
	const [reissue, setReissue] = useState(true);
	const { run, pending } = useAction();
	return (
		<Modal
			open
			tone="danger"
			onOpenChange={(o) => !o && onClose()}
			title={`Void ${invoice.number}`}
			subtitle="Nothing is owed on a void invoice and any pause lifts"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.danger}
						disabled={reason.trim().length < 3 || pending}
						onClick={() =>
							run(() => voidInvoice(invoice.id, reason, reissue), (i) => (i.replacedByNumber ? `Voided · reissued as ${i.replacedByNumber}` : "Voided"), onDone)
						}
					>
						{pending ? "Voiding…" : reissue ? "Void and reissue" : "Void"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextareaField label="Reason" value={reason} onChange={setReason} rows={2} placeholder="Why it is being voided" />
				<label className="flex items-start gap-2 text-[13px] text-ink">
					<input type="checkbox" className="mt-[3px] accent-[var(--color-brand)]" checked={reissue} onChange={(e) => setReissue(e.target.checked)} />
					<span>
						Reissue a fresh invoice for {invoice.monthLabel ?? invoice.month} from the current figures (the new one is due 7 days from today)
					</span>
				</label>
				{invoice.payments.length > 0 && (
					<Note tone="warning">This invoice has {invoice.payments.length} payment(s) recorded. Check how they should be treated before voiding.</Note>
				)}
			</div>
		</Modal>
	);
}

function IssueModal({
	businesses,
	businessId,
	onClose,
	onDone,
}: {
	businesses: BusinessRow[];
	businessId?: string;
	onClose: () => void;
	onDone: () => void;
}) {
	const [month, setMonth] = useState(previousMonth());
	const [biz, setBiz] = useState(businessId ?? "ALL");
	const { run, pending } = useAction();
	const ended = monthOptions(14).filter((m) => m.value < new Date().toISOString().slice(0, 7));
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Issue a month now"
			subtitle="Normally done on the 1st at 07:00. Only a month that has ended; businesses that already have that month's invoice are skipped."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button type="button" className={btn.primary} disabled={!month || pending} onClick={() => run(() => issueInvoices(month, biz === "ALL" ? undefined : biz), (s) => s, onDone)}>
						{pending ? "Issuing…" : "Issue"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField label="Month" value={month} onChange={setMonth} options={ended} />
				{!businessId && (
					<SelectField
						label="Business"
						value={biz}
						onChange={setBiz}
						options={[{ value: "ALL", label: "Every live business" }, ...businesses.map((b) => ({ value: b.id, label: b.name }))]}
					/>
				)}
				<Note tone="warning">Each business is emailed its invoice straight away.</Note>
			</div>
		</Modal>
	);
}
