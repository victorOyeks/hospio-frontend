"use client";

import { MailIcon, MessageCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	allMessageInvoices,
	type CommInvoiceRow,
	type CommPlanView,
	type CommPriceSet,
	getDefaultMessagePrices,
	hotelMessagePlans,
	issueMessageInvoices,
	markMessageInvoicePaid,
	type Paged,
	setDefaultMessagePrices,
	setHotelMessagePlan,
	setHotelMessageSuspension,
} from "@hospio/api/actions/message-billing";
import { Button } from "@hospio/ui/primitives/button";
import { Switch } from "@hospio/ui/primitives/switch";
import { Note } from "@hospio/ui/shared/detail-list";
import { MoneyField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Guest messages as a paid service, Hospio360's side (hospio-backend docs/guest-message-billing.md): each hotel's plan
 * (on/off, its own prices, suspension) for onboarding and the hotel page, and the default prices and all invoices for
 * Fees & billing. Guest messages go by email and WhatsApp only (SMS is for sign-in codes), so there is no SMS price.
 */

const monthName = (yyyyMm: string) => {
	const [y, m] = yyyyMm.split("-").map(Number);
	return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

function InvoiceStatus({ status }: { status: string }) {
	return status === "PAID" ? (
		<StatusPill tone="success">Paid</StatusPill>
	) : status === "OVERDUE" ? (
		<StatusPill tone="danger">Overdue</StatusPill>
	) : status === "VOID" ? (
		<StatusPill tone="grey">Cancelled</StatusPill>
	) : (
		<StatusPill tone="warning">Due</StatusPill>
	);
}

/**
 * What a plan means for sending, from its two separate controls: the hotel's subscription (the switch; the hotel's manager can
 * change it too, in Hotel setup) and Hospio360's hold for non-payment (added on its own when an invoice goes overdue, lifted on its
 * own when it is paid, or by hand here).
 */
function sendingState(p: CommPlanView) {
	const wa = waOn(p);
	const em = emOn(p);
	if (!wa && !em) return { tone: "grey" as const, label: "Not subscribed", detail: "WhatsApp and email off: nothing is sent or billed" };
	if (p.suspended) return { tone: "danger" as const, label: "On hold", detail: holdDetail(p) };
	const free = p.freePeriod ? " · free period (₦0)" : "";
	if (wa && em) return { tone: "success" as const, label: "Sending", detail: `Guest emails and WhatsApp go to guests${free}` };
	return {
		tone: "success" as const,
		label: wa ? "WhatsApp only" : "Email only",
		detail: `${wa ? "Email" : "WhatsApp"} is switched off: never sent, never charged${free}`,
	};
}

/** Per channel (an older server sends only `enabled`: both follow it). */
const waOn = (p: CommPlanView) => p.whatsappOn ?? p.enabled;
const emOn = (p: CommPlanView) => p.emailOn ?? p.enabled;

function holdDetail(p: CommPlanView) {
	const why = p.suspendedReason ? p.suspendedReason.charAt(0).toUpperCase() + p.suspendedReason.slice(1) : "Held by Hospio360";
	return p.suspendedAt ? `${why} · since ${fmtLongDate(p.suspendedAt)}` : why;
}

/** Each hotel's guest-message plan: subscription, Hospio360's hold, prices. Onboarding and the hotel page. */
export function GuestMessagePlans({
	businessId,
	hotels,
	title = "Guest messages",
	subtitle = "Paid service: booking emails and WhatsApp to the location's guests, invoiced monthly per location",
}: {
	businessId: string;
	hotels: { id: string; name: string }[];
	title?: string;
	subtitle?: string;
}) {
	const [plans, setPlans] = useState<CommPlanView[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState<CommPlanView | null>(null);
	const [holding, setHolding] = useState<CommPlanView | null>(null);
	const [lifting, setLifting] = useState<CommPlanView | null>(null);
	const [reason, setReason] = useState("");
	const [busy, setBusy] = useState(false);
	const ids = hotels.map((h) => h.id).join(",");

	const load = useCallback(async () => {
		const r = await hotelMessagePlans(ids ? ids.split(",") : []);
		if (r.ok) {
			setPlans(r.data);
			setError(null);
		} else setError(r.error);
	}, [ids]);

	useEffect(() => {
		void load();
	}, [load]);

	async function toggle(p: CommPlanView, channel: "WHATSAPP" | "EMAIL", on: boolean) {
		const r = await setHotelMessagePlan(p.hotelId, channel === "WHATSAPP" ? { businessId, whatsappOn: on } : { businessId, emailOn: on });
		if (!r.ok) return toast.error(r.error);
		const name = channel === "WHATSAPP" ? "WhatsApp" : "Email";
		toast.success(
			on
				? `${nameOf(p)}: ${name} on for guest messages${p.suspended ? " (still on hold until the hold is lifted)" : ""}`
				: `${nameOf(p)}: ${name} off, never sent or charged`,
		);
		void load();
	}

	async function hold(p: CommPlanView, on: boolean, why?: string) {
		setBusy(true);
		const r = await setHotelMessageSuspension(p.hotelId, on, why);
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(on ? `${nameOf(p)}: guest messages on hold` : `${nameOf(p)}: hold lifted, guest messages go again`);
		setHolding(null);
		setLifting(null);
		setReason("");
		void load();
	}

	const nameOf = (p: CommPlanView) => hotels.find((h) => h.id === p.hotelId)?.name ?? p.hotelName ?? "Hotel";
	const link = "text-[13px] font-semibold text-brand hover:underline";

	// Prices · Put on hold… / Lift hold…: the same links in the table and on the narrow cards.
	const actions = (p: CommPlanView) => (
		<>
			<button type="button" className={link} onClick={() => setEditing(p)}>
				Prices
			</button>
			{(p.suspended || p.enabled) && <span className="text-ink-3"> · </span>}
			{p.suspended ? (
				<button type="button" className={link} onClick={() => setLifting(p)}>
					Lift hold…
				</button>
			) : (
				p.enabled && (
					<button
						type="button"
						className={link}
						onClick={() => {
							setReason(p.outstanding > 0 ? `Unpaid guest-message invoices (${naira(p.outstanding)})` : "");
							setHolding(p);
						}}
					>
						Put on hold…
					</button>
				)
			)}
		</>
	);

	return (
		<SectionCard title={title} subtitle={subtitle} flush>
			<p className="mx-5 mb-4 text-[12px] leading-relaxed text-ink-3">
				<span className="font-semibold text-ink-2">WhatsApp</span> and <span className="font-semibold text-ink-2">Email</span> are the
				hotel's choice per channel (their manager can change them in Hotel setup): a channel that is off is never sent or charged. <span className="font-semibold text-ink-2">On hold</span> is Hospio360 stopping it for
				non-payment: added on its own when an invoice goes overdue and lifted on its own when it is paid. Messages go only when
				a location is subscribed and not on hold.
			</p>
			{error && <Note tone="danger" className="mx-5 mb-4">{error}</Note>}
			{!plans ? (
				<div className="mx-5 mb-5 h-24 animate-pulse rounded-xl bg-subtle" />
			) : plans.length === 0 ? (
				<p className="px-5 pb-5 text-[13px] text-ink-3">Add the business's hotels first.</p>
			) : (
				// A table where there is room for it (820 px); narrower (the onboarding step on a tablet, the hotel drawer) each
				// location is a card, so Prices and Put on hold… are not scrolled off the right edge.
				<div className="@container">
				<ul className="flex flex-col @[820px]:hidden">
					{plans.map((p) => {
						const st = sendingState(p);
						return (
							<li key={p.hotelId} className="flex flex-col gap-3 border-t border-line px-5 py-4">
								<div className="flex flex-wrap items-start justify-between gap-2">
									<span className="text-[13px] font-semibold text-ink">{nameOf(p)}</span>
									<StatusPill tone={st.tone}>{st.label}</StatusPill>
								</div>
								<span className="-mt-2 block text-xs text-ink-3">{st.detail}</span>
								{!p.enabled && p.suspended && (
									<span className="-mt-2 block text-xs text-danger">Also on hold: {holdDetail(p)}</span>
								)}
								<div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-2">
									<span className="flex min-h-[44px] items-center gap-2">
										<Switch checked={waOn(p)} onCheckedChange={(on) => void toggle(p, "WHATSAPP", on)} aria-label={`${nameOf(p)} WhatsApp guest messages`} />
										WhatsApp {waOn(p) ? "on" : "off"}
									</span>
									<span className="flex min-h-[44px] items-center gap-2">
										<Switch checked={emOn(p)} onCheckedChange={(on) => void toggle(p, "EMAIL", on)} aria-label={`${nameOf(p)} email guest messages`} />
										Email {emOn(p) ? "on" : "off"}
									</span>
								</div>
								<dl className="grid grid-cols-3 gap-2 text-xs">
									<div>
										<dt className="text-ink-3">Email · WhatsApp</dt>
										<dd className="text-[13px] text-ink">{naira(p.prices.email)} · {naira(p.prices.whatsapp)}</dd>
										<dd className="text-ink-3">{p.customPrices ? "Own prices" : "Default prices"}</dd>
									</div>
									<div>
										<dt className="text-ink-3">This month</dt>
										<dd className="text-[13px] text-ink">{naira(p.thisMonth.total)}</dd>
									</div>
									<div>
										<dt className="text-ink-3">Unpaid</dt>
										<dd className={cn("text-[13px] text-ink", p.outstanding > 0 && "font-semibold text-danger")}>{naira(p.outstanding)}</dd>
									</div>
								</dl>
								<div className="flex flex-wrap items-center gap-x-1 [&>button]:min-h-[44px]">{actions(p)}</div>
							</li>
						);
					})}
				</ul>
				<div className="hidden overflow-x-auto @[820px]:block">
					<table className="w-full min-w-[820px]">
						<thead className={tableHead}>
							<tr>
								<th className="px-4 py-2 text-left">Hotel</th>
								<th className="px-4 py-2 text-left">Channels</th>
								<th className="px-4 py-2 text-left">Sending</th>
								<th className="px-4 py-2 text-left">Prices (email · WhatsApp)</th>
								<th className="px-4 py-2 text-right">This month</th>
								<th className="px-4 py-2 text-right">Unpaid</th>
								<th className="px-4 py-2" />
							</tr>
						</thead>
						<tbody>
							{plans.map((p) => {
								const st = sendingState(p);
								return (
									<tr key={p.hotelId} className={tableRow}>
										<td className={cn(cell, "font-semibold")}>{nameOf(p)}</td>
										<td className={cell}>
											<span className="flex flex-col gap-1.5 text-[13px] text-ink-2">
												<span className="flex items-center gap-2">
													<Switch checked={waOn(p)} onCheckedChange={(on) => void toggle(p, "WHATSAPP", on)} aria-label={`${nameOf(p)} WhatsApp guest messages`} />
													WhatsApp {waOn(p) ? "on" : "off"}
												</span>
												<span className="flex items-center gap-2">
													<Switch checked={emOn(p)} onCheckedChange={(on) => void toggle(p, "EMAIL", on)} aria-label={`${nameOf(p)} email guest messages`} />
													Email {emOn(p) ? "on" : "off"}
												</span>
											</span>
										</td>
										<td className={cn(cell, "max-w-[260px]")}>
											<StatusPill tone={st.tone}>{st.label}</StatusPill>
											<span className="mt-1 block text-xs text-ink-3">{st.detail}</span>
											{!p.enabled && p.suspended && (
												<span className="mt-1 block text-xs text-danger">Also on hold: {holdDetail(p)}</span>
											)}
										</td>
										<td className={cell}>
											{naira(p.prices.email)} · {naira(p.prices.whatsapp)}
											<span className="block text-xs text-ink-3">{p.customPrices ? "The hotel's own prices" : "Default prices"}</span>
										</td>
										<td className={cn(cell, "text-right")}>{naira(p.thisMonth.total)}</td>
										<td className={cn(cell, "text-right", p.outstanding > 0 && "font-semibold text-danger")}>{naira(p.outstanding)}</td>
										<td className={cn(cell, "whitespace-nowrap text-right")}>
											{actions(p)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				</div>
			)}
			<PricesModal
				plan={editing}
				hotelName={editing ? nameOf(editing) : ""}
				businessId={businessId}
				onClose={() => setEditing(null)}
				onSaved={() => {
					setEditing(null);
					void load();
				}}
			/>
			<ConfirmModal
				open={!!holding}
				onOpenChange={(o) => !o && setHolding(null)}
				tone="danger"
				title={holding ? `Put ${nameOf(holding)}'s guest messages on hold?` : ""}
				subtitle="Booking emails and WhatsApp to guests stop until the hold is lifted. The location stays subscribed but can't lift the hold itself; it is lifted on its own when their unpaid invoices are paid, or by you here."
				confirmLabel="Put on hold"
				pending={busy}
				confirmDisabled={reason.trim().length < 5}
				onConfirm={() => holding && void hold(holding, true, reason.trim())}
			>
				<TextField label="Reason (the business sees it)" value={reason} onChange={setReason} placeholder="e.g. Unpaid guest-message invoices" />
			</ConfirmModal>
			<ConfirmModal
				open={!!lifting}
				onOpenChange={(o) => !o && setLifting(null)}
				title={lifting ? `Lift the hold on ${nameOf(lifting)}?` : ""}
				subtitle={
					lifting
						? lifting.outstanding > 0
							? `${naira(lifting.outstanding)} is still unpaid (${lifting.openInvoices} invoice${lifting.openInvoices === 1 ? "" : "s"}). Lifting the hold lets messages go before it is paid; the amount stays owed.`
							: `Nothing is unpaid. ${lifting.enabled ? "Guest messages go again straight away." : "The location isn't subscribed, so nothing is sent until it subscribes."}`
						: undefined
				}
				confirmLabel="Lift hold"
				pending={busy}
				onConfirm={() => lifting && void hold(lifting, false)}
			/>
		</SectionCard>
	);
}

function PricesModal({
	plan,
	hotelName,
	businessId,
	onClose,
	onSaved,
}: {
	plan: CommPlanView | null;
	hotelName: string;
	businessId: string;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [email, setEmail] = useState<number | "">("");
	const [whatsapp, setWhatsapp] = useState<number | "">("");
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		if (!plan) return;
		setEmail(plan.customPrices ? plan.prices.email : "");
		setWhatsapp(plan.customPrices ? plan.prices.whatsapp : "");
	}, [plan]);
	if (!plan) return null;
	const save = async (useDefaults: boolean) => {
		setBusy(true);
		const r = await setHotelMessagePlan(plan.hotelId, {
			businessId,
			useDefaults,
			email: useDefaults || email === "" ? null : email,
			whatsapp: useDefaults || whatsapp === "" ? null : whatsapp,
		});
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(useDefaults ? `${hotelName} uses the default prices` : `${hotelName}'s prices saved`);
		onSaved();
	};
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`${hotelName} · prices per message`}
			subtitle={`Empty uses the default (${naira(plan.defaults.email)} · ${naira(plan.defaults.whatsapp)}). Applies to messages sent from now on.`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} disabled={busy} onClick={() => void save(true)}>
						Use default prices
					</Button>
					<Button className={btn.primary} disabled={busy} onClick={() => void save(false)}>
						Save prices
					</Button>
				</>
			}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<MoneyField label="Email" value={email} onChange={setEmail} placeholder={String(plan.defaults.email)} />
				<MoneyField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder={String(plan.defaults.whatsapp)} />
			</div>
		</Modal>
	);
}

/** Fees & billing → Guest messages: the default prices and every hotel's invoices. */
export function GuestMessageBilling() {
	const [prices, setPrices] = useState<CommPriceSet | null>(null);
	const [edit, setEdit] = useState<{ email: number | ""; whatsapp: number | "" } | null>(null);
	const [status, setStatus] = useState<string>("");
	const [page, setPage] = useState(0);
	const [invoices, setInvoices] = useState<Paged<CommInvoiceRow> | null>(null);
	const [paying, setPaying] = useState<CommInvoiceRow | null>(null);
	const [reference, setReference] = useState("");
	const [issue, setIssue] = useState(false);

	const load = useCallback(async () => {
		const [p, i] = await Promise.all([getDefaultMessagePrices(), allMessageInvoices({ status: status || undefined, page, size: 20 })]);
		if (p.ok) setPrices(p.data);
		if (i.ok) setInvoices(i.data);
		else toast.error(i.error);
	}, [status, page]);

	useEffect(() => {
		void load();
	}, [load]);

	async function savePrices() {
		if (!prices || !edit || edit.email === "" || edit.whatsapp === "") return toast.error("Enter both prices");
		const r = await setDefaultMessagePrices({ email: edit.email, whatsapp: edit.whatsapp });
		if (!r.ok) return toast.error(r.error);
		toast.success("Default prices saved");
		setEdit(null);
		setPrices(r.data);
	}

	async function markPaid() {
		if (!paying) return;
		const r = await markMessageInvoicePaid(paying.id, reference || undefined, "Paid by transfer");
		if (!r.ok) return toast.error(r.error);
		toast.success(`${paying.number} marked paid`);
		setPaying(null);
		setReference("");
		void load();
	}

	async function issueNow() {
		const r = await issueMessageInvoices();
		setIssue(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(`${r.data.length} invoice${r.data.length === 1 ? "" : "s"} issued for last month`);
		void load();
	}

	return (
		<div className="flex flex-col gap-4">
			<SectionCard
				title="Guest messages · default prices"
				subtitle="What a location pays per message unless it has its own prices · applies to messages sent from now on"
				headerRight={
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={() => prices && setEdit({ email: prices.email, whatsapp: prices.whatsapp })}
					>
						Change prices
					</Button>
				}
			>
				<div className="grid gap-3 pt-2 sm:grid-cols-2">
					{[
						{ icon: MailIcon, label: "Email", v: prices?.email },
						{ icon: MessageCircleIcon, label: "WhatsApp", v: prices?.whatsapp },
					].map(({ icon: Icon, label, v }) => (
						<div key={label} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
							<span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
								<Icon className="size-4" />
							</span>
							<div>
								<p className="text-xs text-ink-3">{label}</p>
								<p className="text-[15px] font-semibold text-ink">{v == null ? "…" : naira(v)}</p>
							</div>
						</div>
					))}
				</div>
			</SectionCard>

			<SectionCard
				title="Guest-message invoices"
				subtitle="One per location per month, made on the 1st · billed and paid on the business's Hospio360 monthly invoice (HIN-…)"
				headerRight={
					<div className="flex items-center gap-2">
						<select
							value={status}
							onChange={(e) => {
								setStatus(e.target.value);
								setPage(0);
							}}
							className="h-9 rounded-control border border-line bg-card px-3 text-[13px]"
							aria-label="Status"
						>
							<option value="">All</option>
							<option value="DUE">Due</option>
							<option value="OVERDUE">Overdue</option>
							<option value="PAID">Paid</option>
						</select>
						<Button variant="outline" className={btn.secondary} onClick={() => setIssue(true)}>
							Issue last month
						</Button>
					</div>
				}
				flush
			>
				{!invoices ? (
					<div className="mx-5 mb-5 h-24 animate-pulse rounded-xl bg-subtle" />
				) : invoices.content.length === 0 ? (
					<p className="px-5 pb-5 text-[13px] text-ink-3">No invoices{status ? " with that status" : " yet"}.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px]">
							<thead className={tableHead}>
								<tr>
									<th className="px-4 py-2 text-left">Invoice</th>
									<th className="px-4 py-2 text-left">Hotel</th>
									<th className="px-4 py-2 text-left">Month</th>
									<th className="px-4 py-2 text-right">Messages</th>
									<th className="px-4 py-2 text-right">Total</th>
									<th className="px-4 py-2 text-left">Due</th>
									<th className="px-4 py-2 text-left">Status</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{invoices.content.map((i) => (
									<tr key={i.id} className={tableRow}>
										<td className={cn(cell, "font-semibold")}>
											{i.number}
											{i.monthlyInvoiceNumber && (
												<span className="block text-[11px] font-normal text-ink-3">On {i.monthlyInvoiceNumber}</span>
											)}
										</td>
										<td className={cell}>{i.hotelName ?? "—"}</td>
										<td className={cell}>{monthName(i.month)}</td>
										<td className={cn(cell, "text-right")}>{i.emailCount + i.smsCount + i.whatsappCount}</td>
										<td className={cn(cell, "text-right font-semibold")}>{naira(i.totalAmount)}</td>
										<td className={cell}>{fmtLongDate(i.dueOn)}</td>
										<td className={cell}>
											<InvoiceStatus status={i.status} />
											{i.paidVia && <span className="block text-xs text-ink-3">{i.paidVia.startsWith("PAYSTACK") ? "Paystack" : "By hand"}</span>}
										</td>
										<td className={cn(cell, "text-right")}>
											{(i.status === "DUE" || i.status === "OVERDUE") && !i.monthlyInvoiceNumber && (
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
				)}
				{invoices && invoices.totalPages > 1 && (
					<div className="flex justify-end gap-2 px-5 py-3">
						<Button variant="outline" className={btn.secondary} disabled={page === 0} onClick={() => setPage(page - 1)}>
							Previous
						</Button>
						<Button variant="outline" className={btn.secondary} disabled={page + 1 >= invoices.totalPages} onClick={() => setPage(page + 1)}>
							Next
						</Button>
					</div>
				)}
			</SectionCard>

			{edit && (
				<Modal
					open
					onOpenChange={(o) => !o && setEdit(null)}
					title="Default prices per message"
					subtitle="Locations without their own prices pay these for every message sent from now on"
					footer={
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setEdit(null)}>
								Cancel
							</Button>
							<Button className={btn.primary} onClick={() => void savePrices()}>
								Save prices
							</Button>
						</>
					}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<MoneyField label="Email" value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} />
						<MoneyField label="WhatsApp" value={edit.whatsapp} onChange={(v) => setEdit({ ...edit, whatsapp: v })} />
					</div>
				</Modal>
			)}
			{paying && (
				<Modal
					open
					onOpenChange={(o) => !o && setPaying(null)}
					title={`Mark ${paying.number} paid`}
					subtitle={`${paying.hotelName ?? ""} · ${naira(paying.totalAmount)} · for a bank transfer or other payment outside Paystack`}
					footer={
						<>
							<Button variant="outline" className={btn.secondary} onClick={() => setPaying(null)}>
								Cancel
							</Button>
							<Button className={btn.primary} onClick={() => void markPaid()}>
								Mark paid
							</Button>
						</>
					}
				>
					<TextField label="Payment reference (optional)" value={reference} onChange={setReference} placeholder="e.g. bank transfer ref" />
				</Modal>
			)}
			<ConfirmModal
				open={issue}
				onOpenChange={setIssue}
				title="Issue last month's invoices now?"
				subtitle="This normally happens on its own at 00:30 on the 1st. Locations with billable messages last month get their invoice, an email and a notification."
				confirmLabel="Issue invoices"
				onConfirm={() => void issueNow()}
			/>
		</div>
	);
}
