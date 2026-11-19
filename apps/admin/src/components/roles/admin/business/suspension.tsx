"use client";

import { BanIcon, MailWarningIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	businessSuspension,
	reactivateBusiness,
	sendSuspensionNotice,
	suspendBusiness,
	suspensionCandidates,
	type SuspensionCandidateView,
	type SuspensionReasonType,
	type SuspensionStateView,
} from "@hospio/api/actions/suspension";
import { useAction } from "@hospio/api/actions/use-action";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { SelectField, TextareaField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { money } from "@hospio/ui/shared/invoice";
import { Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { Loading } from "../live";
import { can } from "../shared";

/**
 * Real suspension (hospio-backend docs/suspension.md; Terms 7.3, Fees 5.5): the business page's suspension card, the
 * "Suspension candidates" list under Fees & billing, and the three steps: send the 7 days' notice, suspend, reactivate.
 * Super and finance admins act; support reads. Everything is written to Changes by Hospio360 by the services.
 */

const NOTICE_DAYS = 7;
const OVERDUE_DAYS = 30;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const addDays = (iso: string, n: number) => {
	const d = new Date(`${iso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};
const reasonLabel = (t?: string | null) => (t === "UNPAID_INVOICE" ? "Unpaid invoices" : "Another reason");

/** What the admin is told before suspending outside the Terms' steps; the services say the same and refuse a finance admin. */
function warningsFor(state: SuspensionStateView | null, type: SuspensionReasonType, noticeSent: boolean, noticeSentOn: string): string[] {
	if (type !== "UNPAID_INVOICE" || !state) return [];
	const out: string[] = [];
	if (state.overdue.length > 0 && state.oldestDaysOverdue < OVERDUE_DAYS)
		out.push(`The oldest unpaid invoice is ${state.oldestDaysOverdue} days overdue; the Terms allow a suspension at ${OVERDUE_DAYS} days.`);
	if (!noticeSent || !noticeSentOn) out.push("No 7 days' notice is recorded; the Terms need one before a suspension for unpaid invoices.");
	else if (addDays(noticeSentOn, NOTICE_DAYS) > today())
		out.push(`The notice was sent on ${fmtLongDate(noticeSentOn)}: the 7 days end on ${fmtLongDate(addDays(noticeSentOn, NOTICE_DAYS))}.`);
	return out;
}

export function useSuspension(businessId: string) {
	const [state, setState] = useState<SuspensionStateView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const load = useCallback(async () => {
		const r = await businessSuspension(businessId);
		if (r.ok) {
			setState(r.data);
			setError(null);
		} else setError(r.error);
	}, [businessId]);
	useEffect(() => {
		void load();
	}, [load]);
	return { state, error, load, setState };
}

/** Suspend: reason type, note, whether the business sees the note, and for unpaid invoices the notice date. */
export function SuspendModal({
	open,
	onOpenChange,
	businessId,
	businessName,
	role,
	onDone,
	onBack,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businessId: string;
	businessName: string;
	role: AdminRole;
	onDone: (s: SuspensionStateView) => void;
	/** From Change stage: back to the stage list. */
	onBack?: () => void;
}) {
	const { run, pending } = useAction();
	const { state, error } = useSuspension(businessId);
	const superAdmin = role === "SUPER_ADMIN";
	const allowed = can.money(role);
	const [type, setType] = useState<SuspensionReasonType>("UNPAID_INVOICE");
	const [note, setNote] = useState("");
	const [showNote, setShowNote] = useState(false);
	const [noticeSent, setNoticeSent] = useState(false);
	const [noticeSentOn, setNoticeSentOn] = useState("");
	// The notice Hospio360 sent from here fills the date in.
	useEffect(() => {
		if (state?.lastNotice?.sentOn) {
			setNoticeSent(true);
			setNoticeSentOn(state.lastNotice.sentOn);
		}
	}, [state?.lastNotice?.sentOn]);
	const unpaid = type === "UNPAID_INVOICE";
	const warnings = warningsFor(state, type, noticeSent, noticeSentOn);
	const nothingOverdue = unpaid && !!state && state.overdue.length === 0;
	const blocked = !allowed || (unpaid ? nothingOverdue || (warnings.length > 0 && !superAdmin) : !superAdmin);
	const valid = note.trim().length >= 8 && !blocked && (!noticeSent || !!noticeSentOn);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Suspend business"
			subtitle={businessName}
			icon={ShieldAlertIcon}
			tone="danger"
			size="form"
			footerInfo="The owner is emailed and owners and managers get a bell notice. It is written to Changes by Hospio360."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => (onBack ? onBack() : onOpenChange(false))} disabled={pending}>
						{onBack ? "Back" : "Cancel"}
					</button>
					<button
						type="button"
						className={btn.danger}
						disabled={!valid || pending}
						data-testid="suspend-confirm"
						onClick={() =>
							run(
								() =>
									suspendBusiness(businessId, {
										reasonType: type,
										note: note.trim(),
										showNote,
										noticeSent: unpaid && noticeSent,
										noticeSentOn: unpaid && noticeSent ? noticeSentOn : null,
									}),
								`${businessName} is suspended`,
								onDone,
							)
						}
					>
						{pending ? "Suspending…" : "Suspend business"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{!allowed && <Note tone="warning">Only a super admin or a finance admin can suspend a business.</Note>}
				{error && <Note tone="danger">{error}</Note>}
				<WhatHappens
					tone="danger"
					items={[
						"Within a minute nobody at the business can use Hospio360: every page shows “This account is suspended” and every action is refused",
						"The owner can still sign in to see what is owed, pay it and download invoices and receipts; managers and staff are told to ask the owner",
						"Reminders, scheduled reports and guest messages stop; no new fee days or invoices are made",
						"Nothing is deleted. Hospio360 can still open the business and view as the owner",
					]}
				/>
				<SelectField
					label="Reason type"
					value={type}
					onChange={(v) => setType(v as SuspensionReasonType)}
					options={[
						{ value: "UNPAID_INVOICE", label: "Unpaid invoices", hint: "Lifts by itself when every overdue invoice is paid in full" },
						{ value: "OTHER", label: "Another reason", hint: "Fraud, a breach of the Terms, the owner asked. Only Hospio360 lifts it (super admin)" },
					]}
				/>
				{unpaid && state && (
					<div className="rounded-control border border-line px-4 py-3 text-[13px]" data-testid="suspend-overdue">
						{state.overdue.length === 0 ? (
							<span className="text-ink-2">No invoice is overdue. Choose another reason, or check Money → invoices.</span>
						) : (
							<>
								<p className="font-medium text-ink">
									Overdue: {money(state.overdueTotal)} · oldest {state.oldestDaysOverdue} days past its due date
								</p>
								<ul className="mt-1 text-ink-2">
									{state.overdue.map((i) => (
										<li key={i.id}>
											{i.number} · {money(i.outstanding)} · due {fmtLongDate(i.dueOn)} ({i.daysOverdue} days)
										</li>
									))}
								</ul>
							</>
						)}
					</div>
				)}
				{unpaid && (
					<div className="flex flex-col gap-2 rounded-control border border-line px-4 py-3">
						<label className="flex items-start gap-3 text-[13px] font-medium text-ink">
							<input
								type="checkbox"
								className="mt-[2px] size-4 accent-[var(--color-brand)]"
								checked={noticeSent}
								onChange={(e) => {
									setNoticeSent(e.target.checked);
									if (e.target.checked && !noticeSentOn) setNoticeSentOn(state?.lastNotice?.sentOn ?? "");
								}}
								data-testid="suspend-notice-sent"
							/>
							<span>
								7 days' notice was sent on{noticeSentOn ? ` ${fmtLongDate(noticeSentOn)}` : " …"}
								<span className="block text-xs font-normal text-ink-3">
									{state?.lastNotice
										? `Hospio360 sent one on ${fmtLongDate(state.lastNotice.sentOn)} (suspension from ${fmtLongDate(state.lastNotice.suspendOn)}).`
										: "None was sent from here. Use Send suspension notice first, or enter the date it was sent another way."}
								</span>
							</span>
						</label>
						{noticeSent && <TextField label="Date the notice was sent" type="date" value={noticeSentOn} onChange={setNoticeSentOn} required />}
					</div>
				)}
				{warnings.map((w) => (
					<Note key={w} tone={superAdmin ? "warning" : "danger"}>
						{w} {superAdmin ? "As a super admin you can still suspend; it is recorded." : "Only a super admin can suspend before that."}
					</Note>
				))}
				{!unpaid && !superAdmin && allowed && <Note tone="danger">Only a super admin can suspend for a reason other than unpaid invoices.</Note>}
				<TextareaField
					label="Note (required)"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder={unpaid ? "Invoice HIN-202610-0002 unpaid 38 days · notice sent 11 Nov" : "What happened, and the ticket if there is one"}
					hint="At least 8 characters. Kept on the business and in Changes by Hospio360."
					error={note.length > 0 && note.trim().length < 8 ? "Say a little more" : undefined}
				/>
				<ToggleField
					label="Show this note to the business"
					hint="On: the suspended screen and the owner's email show it as “Reason”. Off: they only see that the account is suspended."
					checked={showNote}
					onChange={setShowNote}
				/>
			</div>
		</Modal>
	);
}

export function ReactivateModal({
	open,
	onOpenChange,
	businessId,
	businessName,
	role,
	state,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businessId: string;
	businessName: string;
	role: AdminRole;
	state: SuspensionStateView | null;
	onDone: (s: SuspensionStateView) => void;
}) {
	const { run, pending } = useAction();
	const [note, setNote] = useState("");
	const other = state?.reasonType !== "UNPAID_INVOICE";
	const allowed = can.money(role) && (!other || role === "SUPER_ADMIN");
	const back = state?.previousStage === "AT_RISK" ? "At risk" : "Live";
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Reactivate business"
			subtitle={`${businessName} · suspended${state?.suspendedAt ? ` since ${fmtLongDate(state.suspendedAt)}` : ""} · ${reasonLabel(state?.reasonType)}`}
			icon={ShieldCheckIcon}
			size="confirm"
			footerInfo="The owner is emailed and owners and managers get a bell notice. It is written to Changes by Hospio360."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)} disabled={pending}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!allowed || note.trim().length < 8 || pending}
						data-testid="reactivate-confirm"
						onClick={() => run(() => reactivateBusiness(businessId, note.trim()), `${businessName} is active again (${back})`, onDone)}
					>
						{pending ? "Reactivating…" : "Reactivate"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{!allowed && (
					<Note tone="warning">
						{other ? "Only a super admin can reactivate a business suspended for a reason other than unpaid invoices." : "Only a super admin or a finance admin can reactivate a business."}
					</Note>
				)}
				<WhatHappens
					items={[
						`The stage goes back to ${back}, the stage it had before`,
						"Within a minute everyone can use Hospio360 again; people on the suspended screen are let in by themselves",
						state && state.overdue.length > 0
							? `${money(state.overdueTotal)} is still overdue: card/transfer POS payments, new sales and new bookings stay paused until it is paid`
							: "Nothing is overdue, so nothing stays paused",
					]}
				/>
				<TextareaField
					label="Note (required)"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="Why it is reactivated"
					hint="At least 8 characters. Kept in Changes by Hospio360."
					error={note.length > 0 && note.trim().length < 8 ? "Say a little more" : undefined}
				/>
			</div>
		</Modal>
	);
}

/** Send the 7 days' notice: email to the owner, bell to owners and managers; the date is recorded. */
export function NoticeModal({
	open,
	onOpenChange,
	businessId,
	businessName,
	overdueTotal,
	invoiceNumbers,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businessId: string;
	businessName: string;
	overdueTotal: number;
	invoiceNumbers: string;
	onDone: (s: SuspensionStateView) => void;
}) {
	const { run, pending } = useAction();
	const earliest = addDays(today(), NOTICE_DAYS);
	const [suspendOn, setSuspendOn] = useState(earliest);
	const valid = !!suspendOn && suspendOn >= earliest;
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Send suspension notice"
			subtitle={`${businessName} · ${invoiceNumbers} · ${money(overdueTotal)} overdue`}
			icon={MailWarningIcon}
			size="confirm"
			footerInfo="Email only: no SMS or WhatsApp. The notice date is recorded and filled in when you suspend."
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={() => onOpenChange(false)} disabled={pending}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!valid || pending}
						data-testid="notice-confirm"
						onClick={() =>
							run(
								() => sendSuspensionNotice(businessId, suspendOn),
								(s) => (s.warnings?.length ? s.warnings[0] : `Notice sent · ${businessName} may be suspended from ${fmtLongDate(suspendOn)}`),
								onDone,
							)
						}
					>
						{pending ? "Sending…" : "Send notice"}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<WhatHappens
					items={[
						`The owner is emailed: “Your account will be suspended on ${fmtLongDate(suspendOn)} unless ${invoiceNumbers} ${invoiceNumbers.includes(",") ? "are" : "is"} paid”, with the amount and a Pay now link`,
						"Owners and managers get the same as a bell notice in the app",
						"Nothing is suspended by this: after the date, if it is still unpaid, use Suspend business",
					]}
				/>
				<TextField
					label="Suspension date"
					type="date"
					value={suspendOn}
					onChange={setSuspendOn}
					required
					hint={`At least 7 days from today: ${fmtLongDate(earliest)} or later.`}
					error={suspendOn && suspendOn < earliest ? "That is less than 7 days' notice" : undefined}
				/>
			</div>
		</Modal>
	);
}

type CardAction = "notice" | "suspend" | "reactivate" | null;

/**
 * On the business page: red while suspended (why, since, by whom, Reactivate); amber when an invoice is 30+ days overdue
 * (Send suspension notice, Suspend business); nothing otherwise.
 */
export function SuspensionCard({
	businessId,
	businessName,
	role,
	stage,
	onChanged,
}: {
	businessId: string;
	businessName: string;
	role: AdminRole;
	/** The stage the page shows: a change made elsewhere (Change stage) reloads the card. */
	stage: string;
	onChanged: (s: SuspensionStateView) => void;
}) {
	const { state, load, setState } = useSuspension(businessId);
	const [action, setAction] = useState<CardAction>(null);
	useEffect(() => {
		void load();
	}, [stage, load]);
	const done = (s: SuspensionStateView) => {
		setState(s);
		setAction(null);
		onChanged(s);
	};
	if (!state || (!state.suspended && !state.candidate && !state.lastNotice)) return null;
	const acts = can.money(role);
	const numbers = state.overdue.map((i) => i.number).join(", ");
	return (
		<>
			<section
				className={cn(
					"flex flex-wrap items-start gap-4 rounded-card border px-5 py-4",
					state.suspended ? "border-danger/40 bg-danger-soft" : state.candidate ? "border-warning/40 bg-warning-soft" : "border-line bg-card",
				)}
				data-testid="suspension-card"
				data-state={state.suspended ? "SUSPENDED" : state.candidate ? "CANDIDATE" : "NOTICE"}
			>
				<BanIcon className={cn("mt-[2px] size-5 shrink-0", state.suspended ? "text-danger" : "text-warning")} aria-hidden="true" />
				<div className="min-w-0 flex-1 text-[13px] text-ink">
					{state.suspended ? (
						<>
							<p className="text-[14px] font-semibold">
								Suspended{state.suspendedAt ? ` since ${fmtLongDate(state.suspendedAt)}` : ""} · {reasonLabel(state.reasonType)}
							</p>
							<p className="mt-1">
								{state.reason} {state.suspendedByName ? `· by ${state.suspendedByName}` : ""} · the note is{" "}
								{state.showReason ? "shown to the business" : "not shown to the business"}
								{state.noticeSentOn ? ` · notice sent ${fmtLongDate(state.noticeSentOn)}` : ""}
							</p>
							<p className="mt-1 text-ink-2">
								Nobody at the business can use Hospio360.{" "}
								{state.reasonType === "UNPAID_INVOICE"
									? state.overdue.length > 0
										? `It comes back by itself when ${numbers} (${money(state.overdueTotal)}) ${state.overdue.length === 1 ? "is" : "are"} paid in full.`
										: "Nothing is overdue now."
									: "Paying invoices does not lift it: a super admin reactivates."}
							</p>
						</>
					) : (
						<>
							<p className="text-[14px] font-semibold">
								{state.candidate
									? `Suspension candidate · ${money(state.overdueTotal)} overdue, oldest ${state.oldestDaysOverdue} days past its due date`
									: "Suspension notice on record"}
							</p>
							{state.overdue.length > 0 && <p className="mt-1">{state.overdue.map((i) => `${i.number} (${i.daysOverdue} days)`).join(" · ")}</p>}
							<p className="mt-1 text-ink-2" data-testid="suspension-last-notice">
								{state.lastNotice
									? `Notice sent ${fmtLongDate(state.lastNotice.sentOn)}${state.lastNotice.sentByName ? ` by ${state.lastNotice.sentByName}` : ""} to ${state.lastNotice.recipient ?? "nobody (no email)"}: may be suspended from ${fmtLongDate(state.lastNotice.suspendOn)}.`
									: "No notice sent yet. The Terms (7.3) need 7 days' notice before a suspension for unpaid invoices."}
							</p>
						</>
					)}
				</div>
				{acts && (
					<div className="flex flex-wrap items-center gap-2">
						{state.suspended ? (
							<button type="button" className={btn.primary} onClick={() => setAction("reactivate")} data-testid="reactivate-open">
								Reactivate
							</button>
						) : (
							state.candidate && (
								<>
									<button type="button" className={btn.secondary} onClick={() => setAction("notice")} data-testid="notice-open">
										Send suspension notice
									</button>
									<button type="button" className={btn.danger} onClick={() => setAction("suspend")} data-testid="suspend-open">
										Suspend business
									</button>
								</>
							)
						)}
					</div>
				)}
			</section>
			{action === "notice" && (
				<NoticeModal
					open
					onOpenChange={(o) => !o && setAction(null)}
					businessId={businessId}
					businessName={businessName}
					overdueTotal={state.overdueTotal}
					invoiceNumbers={numbers}
					onDone={done}
				/>
			)}
			{action === "suspend" && (
				<SuspendModal open onOpenChange={(o) => !o && setAction(null)} businessId={businessId} businessName={businessName} role={role} onDone={done} />
			)}
			{action === "reactivate" && (
				<ReactivateModal
					open
					onOpenChange={(o) => !o && setAction(null)}
					businessId={businessId}
					businessName={businessName}
					role={role}
					state={state}
					onDone={done}
				/>
			)}
		</>
	);
}

/** Fees & billing → Invoices → Suspension candidates: businesses not suspended with an invoice 30+ days past its due date. */
export function SuspensionCandidates({ role, onCount }: { role: AdminRole; onCount?: (n: number) => void }) {
	const [rows, setRows] = useState<SuspensionCandidateView[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [action, setAction] = useState<{ kind: "notice" | "suspend"; row: SuspensionCandidateView } | null>(null);
	const load = useCallback(async () => {
		const r = await suspensionCandidates();
		if (r.ok) {
			setRows(r.data);
			setError(null);
			onCount?.(r.data.length);
		} else setError(r.error);
	}, [onCount]);
	useEffect(() => {
		void load();
	}, [load]);
	const acts = can.money(role);
	const done = () => {
		setAction(null);
		void load();
	};
	return (
		<section className="rounded-card border border-line bg-card" data-testid="suspension-candidates">
			<p className="border-b border-line px-5 py-3 text-[13px] text-ink-2">
				Not suspended, with an invoice unpaid 30 or more days after its due date (Terms 7.3). Send the 7 days' notice first; after its date,
				if it is still unpaid, suspend. A suspension for unpaid invoices lifts by itself when every overdue invoice is paid.
			</p>
			{error && <Note tone="danger" className="m-5">{error}</Note>}
			{!rows && !error ? (
				<div className="px-5">
					<Loading label="Loading candidates…" />
				</div>
			) : rows && rows.length === 0 ? (
				<EmptyState title="No suspension candidates" hint="No business has an invoice 30 or more days past its due date." className="m-5" />
			) : (
				rows && (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[900px] text-left">
							<thead>
								<tr className={tableHead}>
									<th className={cell}>Business</th>
									<th className={cell}>Overdue invoices</th>
									<th className={`${cell} text-right`}>Overdue</th>
									<th className={`${cell} text-right`}>Oldest</th>
									<th className={cell}>Notice</th>
									{acts && <th className={cell} />}
								</tr>
							</thead>
							<tbody>
								{rows.map((r) => (
									<tr key={r.businessId} className={tableRow} data-testid="candidate-row">
										<td className={`${cell} font-semibold`}>
											<Link href={`/dashboard/businesses/${r.businessId}`} className="hover:underline">
												{r.businessName ?? r.businessId}
											</Link>
											<span className="block text-[11px] font-normal text-ink-3">
												{r.ownerName ?? "—"} · {r.ownerEmail ?? "no email"}
											</span>
										</td>
										<td className={cell}>{r.overdue.map((i) => i.number).join(", ")}</td>
										<td className={`${cell} text-right font-semibold text-danger`}>{money(r.overdueTotal)}</td>
										<td className={`${cell} text-right`}>{r.oldestDaysOverdue} days</td>
										<td className={`${cell} text-ink-2`}>
											{r.lastNotice ? (
												<>
													Sent {fmtLongDate(r.lastNotice.sentOn)}
													<span className={cn("block text-[11px]", r.noticeElapsed ? "font-semibold text-danger" : "text-ink-3")}>
														{r.noticeElapsed ? "7 days over: can be suspended" : `suspension from ${fmtLongDate(r.lastNotice.suspendOn)}`}
													</span>
												</>
											) : (
												"Not sent"
											)}
										</td>
										{acts && (
											<td className={cell}>
												<div className="flex flex-wrap justify-end gap-2">
													<button type="button" className={btn.secondary} onClick={() => setAction({ kind: "notice", row: r })}>
														Send notice
													</button>
													<button type="button" className={btn.danger} onClick={() => setAction({ kind: "suspend", row: r })}>
														Suspend
													</button>
												</div>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)
			)}
			{action?.kind === "notice" && (
				<NoticeModal
					open
					onOpenChange={(o) => !o && setAction(null)}
					businessId={action.row.businessId}
					businessName={action.row.businessName ?? "This business"}
					overdueTotal={action.row.overdueTotal}
					invoiceNumbers={action.row.overdue.map((i) => i.number).join(", ")}
					onDone={done}
				/>
			)}
			{action?.kind === "suspend" && (
				<SuspendModal
					open
					onOpenChange={(o) => !o && setAction(null)}
					businessId={action.row.businessId}
					businessName={action.row.businessName ?? "This business"}
					role={role}
					onDone={done}
				/>
			)}
		</section>
	);
}
