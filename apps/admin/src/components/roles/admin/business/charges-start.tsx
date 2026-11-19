"use client";

import { CalendarClockIcon, GiftIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type ChargesStartDetail,
	type ChargesStartPreviewView,
	type ChargesStartRowView,
	chargesStart,
	chargesStartRows,
	previewChargesStart,
	setChargesStart,
} from "@hospio/api/actions/billing";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextareaField, TextField, ToggleField } from "@hospio/ui/shared/field";
import { fmtLongDate, fmtWhen, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";

/**
 * "Free until charges start" (hospio-backend docs/plan-monthly-invoices.md): each business's charges start date, kept by
 * platform-service. No date = free (no platform fee; device instalments and data plans are still billed); days on or after the
 * date accrue 1.5% (or the addendum rate) and are invoiced monthly. Only money roles (Super admin, Finance admin) change it, with a
 * reason; every change is in Changes by Hospio360 (area "Billing start").
 */

/** "Free" / "Billing from 1 Mar 2027" as a pill: the server's label when it has one. */
export function ChargesTag({ row, className }: { row?: ChargesStartRowView | null; className?: string }) {
	const free = !row?.chargesStartOn;
	const label = row?.label || (free ? "Free" : `Billing from ${fmtLongDate(row?.chargesStartOn ?? "")}`);
	return (
		<span className={className}>
			<StatusPill tone={free ? "success" : row?.state === "STARTS" ? "info" : "grey"}>{label}</StatusPill>
		</span>
	);
}

/** Every business's tag in one call (the Businesses list, Fees & billing). A business missing from the map is free. */
export function useChargesRows() {
	const [rows, setRows] = useState<Record<string, ChargesStartRowView> | null>(null);
	useEffect(() => {
		let alive = true;
		void chargesStartRows().then((r) => alive && setRows(r));
		return () => {
			alive = false;
		};
	}, []);
	return rows;
}

/** The business's charges start view (null while loading; an error string when it could not be read). */
export function useChargesStart(businessId: string) {
	const [view, setView] = useState<ChargesStartDetail | null>(null);
	const [error, setError] = useState<string | null>(null);
	const load = useCallback(async () => {
		const r = await chargesStart(businessId);
		if (r.ok) {
			setView(r.data);
			setError(null);
		} else setError(r.error);
	}, [businessId]);
	useEffect(() => {
		void load();
	}, [load]);
	return { view, error, reload: load, setView };
}

const stateWords = (v: ChargesStartDetail) =>
	!v.chargesStartOn
		? "Free: no platform fee until a date is set. Devices are still billed."
		: v.state === "STARTS"
			? `Free until then: from ${fmtLongDate(v.chargesStartOn)} each day accrues ${v.ratePct ?? 1.5}% of sales, invoiced monthly.`
			: `Each day from ${fmtLongDate(v.chargesStartOn)} accrues ${v.ratePct ?? 1.5}% of sales, invoiced monthly; days before it are free.`;

/** Business · Money tab: the date, who set it and why, Change / Clear (money roles) and the history. */
export function ChargesStartCard({ businessId }: { businessId: string }) {
	const { view, error, setView } = useChargesStart(businessId);
	const [editing, setEditing] = useState<"change" | "clear" | null>(null);
	return (
		<SectionCard
			title="Charges start on"
			subtitle="When the platform fee starts for this business · before it, days are free"
			headerRight={
				view?.canEdit ? (
					<div className="flex flex-wrap gap-2">
						<button type="button" className={btn.secondary} onClick={() => setEditing("change")}>
							{view.chargesStartOn ? "Change" : "Set date"}
						</button>
						{view.chargesStartOn && (
							<button type="button" className={btn.ghost} onClick={() => setEditing("clear")}>
								Clear
							</button>
						)}
					</div>
				) : undefined
			}
		>
			{error ? (
				<Note tone="danger">{error}</Note>
			) : !view ? (
				<div className="h-20 animate-pulse rounded-xl bg-subtle" />
			) : (
				<div className="flex flex-col gap-4">
					<div className="flex min-w-0 items-start gap-3">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
							{view.chargesStartOn ? <CalendarClockIcon className="size-5" /> : <GiftIcon className="size-5" />}
						</span>
						<div className="min-w-0 flex-1">
							<p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
								{view.chargesStartOn ? fmtLongDate(view.chargesStartOn) : "No date · free"}
								<ChargesTag row={view} />
							</p>
							<p className="mt-1 text-[13px] text-ink-2">{stateWords(view)}</p>
							{(view.setByName || view.reason) && (
								<p className="mt-1 text-xs text-ink-3">
									{view.setByName ? `Set by ${view.setByName}` : "Set"}
									{view.setAt ? ` · ${fmtWhen(view.setAt)}` : ""}
									{view.reason ? ` · “${view.reason}”` : ""}
								</p>
							)}
							{!view.canEdit && <p className="mt-1 text-xs text-ink-3">Only a Super admin or Finance admin can change it.</p>}
						</div>
					</div>
					{(view.history?.length ?? 0) > 0 && (
						<div>
							<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">History</p>
							<ul className="flex flex-col divide-y divide-line rounded-xl border border-line">
								{view.history?.map((h) => (
									<li key={h.id} className="px-3 py-2 text-[13px]">
										<p className="text-ink">
											{h.description ?? `${h.before ? fmtLongDate(h.before) : "Free"} → ${h.after ? fmtLongDate(h.after) : "Free"}`}
										</p>
										<p className="text-xs text-ink-3">
											{h.madeByName ?? "Hospio360"}
											{h.createdAt ? ` · ${fmtWhen(h.createdAt)}` : ""}
											{h.reason ? ` · “${h.reason}”` : ""}
										</p>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
			{view && editing && (
				<ChargesStartModal
					view={view}
					clearing={editing === "clear"}
					onClose={() => setEditing(null)}
					onSaved={(v) => {
						setView(v);
						setEditing(null);
					}}
				/>
			)}
		</SectionCard>
	);
}

/**
 * Edit business · Fee & contract: the same date as the Money tab, read from platform-service. Money roles change or clear it
 * through the same modal (reason, preview, confirm when free days become billable); it applies at once, apart from Save business.
 * `onChanged` gets the new date so the caller can mirror it into tenant's contractStartsOn (as onboarding step 3 does).
 */
export function ChargesStartField({ businessId, onChanged }: { businessId: string; onChanged?: (date: string | null) => void }) {
	const { view, error, setView } = useChargesStart(businessId);
	const [editing, setEditing] = useState<"change" | "clear" | null>(null);
	return (
		<div className="flex flex-col gap-2 rounded-xl border border-line p-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-[13px] font-medium text-ink">Charges start on</p>
				{view?.canEdit && (
					<div className="flex flex-wrap gap-2">
						<button type="button" className={btn.secondary} onClick={() => setEditing("change")}>
							{view.chargesStartOn ? "Change" : "Set date"}
						</button>
						{view.chargesStartOn && (
							<button type="button" className={btn.ghost} onClick={() => setEditing("clear")}>
								Clear
							</button>
						)}
					</div>
				)}
			</div>
			{error ? (
				<Note tone="danger">{error}</Note>
			) : !view ? (
				<div className="h-12 animate-pulse rounded-lg bg-subtle" />
			) : (
				<div className="min-w-0">
					<p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-ink">
						{view.chargesStartOn ? fmtLongDate(view.chargesStartOn) : "No date · free"}
						<ChargesTag row={view} />
					</p>
					<p className="mt-1 text-[13px] text-ink-2">{stateWords(view)}</p>
					{(view.setByName || view.reason) && (
						<p className="mt-1 text-xs text-ink-3">
							{view.setByName ? `Set by ${view.setByName}` : "Set"}
							{view.setAt ? ` · ${fmtWhen(view.setAt)}` : ""}
							{view.reason ? ` · “${view.reason}”` : ""}
						</p>
					)}
					<p className="mt-1 text-xs text-ink-3">
						{view.canEdit
							? "Changes apply at once with their own reason (not with Save business) and are logged in Changes by Hospio360 · Billing start. History is on the Money tab."
							: "Only a Super admin or Finance admin can change it. History is on the Money tab."}
					</p>
				</div>
			)}
			{view && editing && (
				<ChargesStartModal
					view={view}
					clearing={editing === "clear"}
					onClose={() => setEditing(null)}
					onSaved={(v) => {
						setView(v);
						setEditing(null);
						onChanged?.(v.chargesStartOn ?? null);
					}}
				/>
			)}
		</div>
	);
}

/** Set, move or clear the date: shows what it does to days not invoiced yet and asks for an explicit confirm when free days become billable. */
export function ChargesStartModal({
	view,
	clearing,
	onClose,
	onSaved,
	defaultReason = "",
}: {
	view: ChargesStartDetail;
	clearing: boolean;
	onClose: () => void;
	onSaved: (v: ChargesStartDetail) => void;
	defaultReason?: string;
}) {
	const [date, setDate] = useState(clearing ? "" : (view.chargesStartOn ?? ""));
	const [reason, setReason] = useState(defaultReason);
	const [preview, setPreview] = useState<ChargesStartPreviewView | null>(null);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [confirm, setConfirm] = useState(false);
	const [busy, setBusy] = useState(false);
	const target = clearing ? null : date || null;
	const unchanged = (target ?? null) === (view.chargesStartOn ?? null);

	useEffect(() => {
		setConfirm(false);
		setPreview(null);
		setPreviewError(null);
		if (unchanged || (!clearing && !date)) return;
		let alive = true;
		const timer = setTimeout(() => {
			void previewChargesStart(view.businessId, target).then((r) => {
				if (!alive) return;
				if (r.ok) setPreview(r.data);
				else setPreviewError(r.error);
			});
		}, 250);
		return () => {
			alive = false;
			clearTimeout(timer);
		};
	}, [view.businessId, target, unchanged, clearing, date]);

	const reasonOk = reason.trim().length >= 8 && reason.trim().length <= 500;
	const needsConfirm = !!preview?.earlier;
	const canSave = !unchanged && reasonOk && (clearing || !!date) && (!needsConfirm || confirm) && !busy;

	async function save() {
		setBusy(true);
		const r = await setChargesStart(view.businessId, { chargesStartOn: target, reason, confirmEarlier: needsConfirm && confirm });
		setBusy(false);
		if (!r.ok) return toast.error(r.error, { duration: 8000 });
		toast.success(target ? `Charges start on ${fmtLongDate(target)}` : "Charges start date cleared: the business is free");
		onSaved(r.data);
	}

	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={clearing ? "Clear the charges start date?" : view.chargesStartOn ? "Change the charges start date" : "Set the charges start date"}
			subtitle={
				clearing
					? "The business goes back to free from the next day not on an invoice. Issued invoices are not touched."
					: "Days on or after this date accrue the platform fee and are invoiced monthly; days before it are free. Issued invoices are never changed."
			}
			icon={CalendarClockIcon}
			tone={clearing ? "danger" : "default"}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button className={clearing ? btn.danger : btn.primary} disabled={!canSave} onClick={() => void save()}>
						{busy ? "Saving…" : clearing ? "Clear date" : "Save date"}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{!clearing && (
					<TextField
						label="Charges start on"
						type="date"
						value={date}
						onChange={setDate}
						hint={view.chargesStartOn ? `Now ${fmtLongDate(view.chargesStartOn)}` : "Now: no date (free)"}
					/>
				)}
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					placeholder="Order form signed 18 Nov: charges start 1 March 2027"
					rows={2}
					hint="8 to 500 characters · kept in Changes by Hospio360"
				/>
				{previewError && <Note tone="danger">{previewError}</Note>}
				{preview && (
					<Note tone={preview.earlier ? "warning" : "info"}>
						{preview.message ||
							[
								preview.toBill.days > 0 ? `${preview.toBill.days} free day(s) become billable (${naira(preview.toBill.fee)})` : null,
								preview.toFree.days > 0 ? `${preview.toFree.days} day(s) become free (${naira(preview.toFree.fee)} not charged)` : null,
							]
								.filter(Boolean)
								.join(" · ") ||
							"No day already worked out changes."}
					</Note>
				)}
				{needsConfirm && preview && (
					<ToggleField
						label={`Yes, bill ${preview.toBill.days} free day${preview.toBill.days === 1 ? "" : "s"} (${naira(preview.toBill.fee)}) on the next invoice`}
						hint="Moving the date earlier charges days that were free. Only days not on an invoice are affected."
						checked={confirm}
						onChange={setConfirm}
					/>
				)}
			</div>
		</Modal>
	);
}
