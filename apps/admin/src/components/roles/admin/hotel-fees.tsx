"use client";

import { KeyRoundIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	adminDailyFees,
	adminPosConfig,
	type DailyFeeRow,
	type FeeCollectionView,
	feeCollection,
	type PosConfigView,
	type PosProviderKeysView,
	redoFeeDay,
	removeAdminPosConfig,
	runFeeDay,
	saveAdminPosConfig,
} from "@hospio/api/actions/daily-fees";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { TextField } from "@hospio/ui/shared/field";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * A hotel's POS provider keys and Hospio's daily fee (hospio-backend docs/plan-daily-fees.md, docs/pos-providers.md,
 * docs/plan-monthly-invoices.md): the keys are entered here by a super admin and shown masked, and are only for taking guest
 * payments. Nothing is debited: each day's fee is billed on the business's monthly invoice; the daily fees list shows each
 * day's sales, fee and where it is billed.
 */

const FIELDS: Record<string, { key: string; label: string; multiline?: boolean; hint?: string }[]> = {
	MONIEPOINT: [
		{ key: "apiKey", label: "API key", hint: "Moniepoint business → Developer → API keys" },
		{ key: "webhookSecret", label: "Webhook secret", hint: "Signs Moniepoint's payment notifications" },
	],
	OPAY: [
		{ key: "clientAuthKey", label: "Client auth key" },
		{ key: "opayPublicKey", label: "OPay public key", multiline: true, hint: "PEM or base64 (X.509)" },
		{ key: "merchantPrivateKey", label: "Merchant private key", multiline: true, hint: "PKCS#8 PEM (BEGIN PRIVATE KEY)" },
		{ key: "headMerchantId", label: "Head merchant ID" },
		{ key: "merchantId", label: "Merchant ID" },
	],
};

const providerLabel = (p?: string | null) => (p === "OPAY" ? "OPay" : p === "MONIEPOINT" ? "Moniepoint" : "Not set");

/** ACCRUED: waiting for the month's invoice; INVOICED: on an invoice not paid yet; PAID: the invoice is paid. */
export function feeStatus(status: string) {
	switch (status) {
		case "ACCRUED":
			return <StatusPill tone="brand">Waiting for the invoice</StatusPill>;
		case "INVOICED":
			return <StatusPill tone="warning">On invoice, unpaid</StatusPill>;
		case "PAID":
			return <StatusPill tone="success">Paid</StatusPill>;
		case "SHADOW":
			return <StatusPill tone="info">Statement only</StatusPill>;
		case "NO_FEE":
			return <StatusPill tone="grey">No fee</StatusPill>;
		default:
			return <StatusPill tone="grey">{status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}</StatusPill>;
	}
}

export function HotelFeesPanel({ businessId, hotelId, role }: { businessId: string; hotelId: string; role: AdminRole }) {
	const superAdmin = role === "SUPER_ADMIN";
	const [pos, setPos] = useState<PosConfigView | null>(null);
	const [collection, setCollection] = useState<FeeCollectionView | null>(null);
	const [days, setDays] = useState<DailyFeeRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	/** The provider whose keys are being added or changed (null: closed). */
	const [editing, setEditing] = useState<string | null>(null);
	const [open, setOpen] = useState<DailyFeeRow | null>(null);

	const load = useCallback(async () => {
		const [p, c, d] = await Promise.all([superAdmin ? adminPosConfig(hotelId) : Promise.resolve(null), feeCollection(businessId, hotelId), adminDailyFees({ hotelId })]);
		if (p?.ok) setPos(p.data);
		if (c.ok) setCollection(c.data);
		if (d.ok) setDays(d.data);
		setError(!c.ok ? c.error : !d.ok ? d.error : p && !p.ok ? p.error : null);
	}, [businessId, hotelId, superAdmin]);
	useEffect(() => {
		void load();
	}, [load]);


	return (
		<>
			{error && <Note tone="danger">{error}</Note>}
			{superAdmin && (
				<SectionCard
					title="POS providers"
					subtitle="The hotel's own Moniepoint and OPay keys, only for taking guest payments. Each card payment goes through its terminal's provider"
				>
					{!pos ? (
						<p className="text-[13px] text-ink-3">Loading…</p>
					) : !pos.keyStoreReady ? (
						<Note tone="warning">The server has no POS_SECRETS_KEY yet, so keys can't be stored. Set it on the server first.</Note>
					) : (
						<div className="flex flex-col gap-3">
							{(["MONIEPOINT", "OPAY"] as const).map((provider) => {
								const keys = pos.providers.find((x) => x.provider === provider);
								return (
									<div key={provider} className="rounded-card border border-line p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span className="text-[14px] font-semibold text-ink">{providerLabel(provider)}</span>
												{!keys ? (
													<StatusPill tone="grey">Not added</StatusPill>
												) : keys.complete ? (
													<StatusPill tone="success">Complete</StatusPill>
												) : (
													<StatusPill tone="warning">Incomplete</StatusPill>
												)}
											</div>
											<div className="flex gap-2">
												{keys && (
													<button
														type="button"
														className={`${btn.secondary} ${btn.small}`}
														onClick={async () => {
															if (!window.confirm(`Remove this hotel's ${providerLabel(provider)} keys? Payments on its ${providerLabel(provider)} terminals go back to the server's POS setting.`)) return;
															const r = await removeAdminPosConfig(hotelId, provider);
															if (r.ok) {
																setPos(r.data);
																toast.success(`${providerLabel(provider)} keys removed`);
																void load();
															} else toast.error(r.error);
														}}
													>
														Remove
													</button>
												)}
												<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => setEditing(provider)}>
													<KeyRoundIcon className="mr-1 inline size-4" /> {keys ? "Change keys" : "Add keys"}
												</button>
											</div>
										</div>
										{keys && (
											<div className="mt-3">
												<DetailList
													columns={2}
													items={[
														...FIELDS[provider].map((f) => ({ label: f.label, value: keys.fields[f.key] ?? "—" })),
														{ label: "Updated", value: keys.updatedAt ? `${fmtWhen(keys.updatedAt)} by ${keys.updatedByName ?? "Hospio360"}` : "—" },
													]}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</SectionCard>
			)}

			<SectionCard
				title="Hospio fee"
				subtitle="% of each day's sales (the business's fee rule), worked out at 00:05 and billed on the business's monthly invoice"
				headerRight={
					superAdmin ? (
						<button
							type="button"
							className={`${btn.secondary} ${btn.small}`}
							onClick={async () => {
								const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
								const r = await runFeeDay(y);
								if (r.ok) {
									toast.success(`${r.data.date}: ${r.data.worked} worked out, ${r.data.skipped} already done or skipped${r.data.notes.length ? ` · ${r.data.notes.join("; ")}` : ""}`);
									void load();
								} else toast.error(r.error);
							}}
						>
							<PlayIcon className="mr-1 inline size-4" /> Work out yesterday
						</button>
					) : undefined
				}
			>
				{!collection ? (
					<p className="text-[13px] text-ink-3">Loading…</p>
				) : (
					<div className="flex flex-col gap-3">
						<p className="text-[13px] text-ink-2">
							Nothing is taken from the hotel's accounts. Each month's fees go on the business's Hospio360 invoice, issued on the 1st and due 7
							days later (Fees &amp; billing → Invoices).
						</p>
						{collection.posPaused && (
							<Note tone="danger">
								POS payments are paused for an unpaid Hospio360 invoice. They resume within a minute of it being paid, extended or voided.
							</Note>
						)}
						{collection.changedAt && (
							<p className="text-[12px] text-ink-3">
								Last changed {fmtWhen(collection.changedAt)} by {collection.changedByName ?? "Hospio360"}
							</p>
						)}
					</div>
				)}
			</SectionCard>

			<SectionCard
				title="Daily fees"
				subtitle="Last 30 days"
				headerRight={
					<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => void load()}>
						<RefreshCwIcon className="mr-1 inline size-4" /> Refresh
					</button>
				}
			>
				{!days ? (
					<p className="text-[13px] text-ink-3">Loading…</p>
				) : days.length === 0 ? (
					<p className="text-[13px] text-ink-2">No days worked out yet. The first appears after midnight, or use "Work out yesterday".</p>
				) : (
					<FeeTable days={days} onOpen={setOpen} />
				)}
			</SectionCard>

			{editing && pos && (
				<PosKeysModal
					provider={editing}
					current={pos.providers.find((x) => x.provider === editing) ?? null}
					onClose={() => setEditing(null)}
					onSave={async (provider, fields) => {
						const r = await saveAdminPosConfig(businessId, hotelId, provider, fields);
						if (r.ok) {
							setPos(r.data);
							setEditing(null);
							toast.success("POS keys saved");
							void load();
						} else toast.error(r.error);
					}}
				/>
			)}
			{open && (
				<FeeDayModal
					day={open}
					onClose={() => setOpen(null)}
					onRedo={
						superAdmin && ["SHADOW", "NO_FEE", "ACCRUED"].includes(open.status)
							? async () => {
									const r = await redoFeeDay(open.id);
									if (r.ok) {
										toast.success("Worked out again");
										setOpen(r.data);
										void load();
									} else toast.error(r.error);
								}
							: undefined
					}
				/>
			)}
		</>
	);
}

export function FeeTable({ days, onOpen, showHotel = false }: { days: DailyFeeRow[]; onOpen: (d: DailyFeeRow) => void; showHotel?: boolean }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-left">
				<thead>
					<tr className={tableHead}>
						<th className={cell}>Day</th>
						{showHotel && <th className={cell}>Hotel</th>}
						<th className={cell}>Sales</th>
						<th className={cell}>Fee</th>
						<th className={cell}>Devices</th>
						<th className={cell}>Paid</th>
						<th className={cell}>Status</th>
					</tr>
				</thead>
				<tbody>
					{days.map((d) => (
						<tr key={d.id} className={`${tableRow} cursor-pointer`} onClick={() => onOpen(d)}>
							<td className={cell}>{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</td>
							{showHotel && <td className={cell}>{d.hotelName ?? "—"}</td>}
							<td className={cell}>{naira(d.sales)}</td>
							<td className={cell}>{naira(d.fee)}</td>
							<td className={cell}>{(d.deviceFee ?? 0) > 0 ? naira(d.deviceFee ?? 0) : "—"}</td>
							<td className={cell}>
								{naira(d.collected ?? 0)}
								{(d.refunded ?? 0) > 0 && <span className="block text-xs text-danger">{naira(d.refunded)} refunded</span>}
							</td>
							<td className={cell}>{feeStatus(d.status)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** What Hospio360 can still give back from a day: the platform fee it collected less what was already refunded. */
export const refundableOf = (day: DailyFeeRow) => Math.max(0, Math.round(((day.platformPaid ?? 0) - (day.refunded ?? 0)) * 100) / 100);

export function FeeDayModal({
	day,
	onClose,
	onRedo,
	onRefund,
}: {
	day: DailyFeeRow;
	onClose: () => void;
	onRedo?: () => void;
	/** Money roles: record a refund of part of the collected platform fee (the marketer's commission is clawed back). */
	onRefund?: (amount: number, reason: string) => Promise<boolean>;
}) {
	const refundable = refundableOf(day);
	const [refunding, setRefunding] = useState(false);
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState("");
	const [busy, setBusy] = useState(false);
	const value = Number(amount.replace(/,/g, ""));
	const amountError = amount && (!(value > 0) || value > refundable) ? `Enter an amount up to ${naira(refundable)}` : undefined;
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`${day.hotelName ?? "Hotel"} · ${new Date(`${day.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
			subtitle="What was sold that day (VAT excluded) and the fee, billed on the monthly invoice"
		>
			<div className="flex flex-col gap-4">
				<table className="w-full text-left text-[13px]">
					<tbody>
						{(day.lines ?? []).map((l) => (
							<tr key={l.source} className="border-b border-line">
								<td className="py-2 pr-2 text-ink-2">{l.label}</td>
								<td className="py-2 pr-2 text-right text-ink-3">{l.count}</td>
								<td className="py-2 text-right font-medium">{naira(l.amount)}</td>
							</tr>
						))}
						<tr>
							<td className="py-2 font-semibold">Sales</td>
							<td />
							<td className="py-2 text-right font-semibold">{naira(day.sales)}</td>
						</tr>
					</tbody>
				</table>
				<DetailList
					columns={2}
					items={[
						{ label: `Fee at ${day.rate} %`, value: naira(day.fee) },
						...((day.carriedIn ?? 0) > 0 ? [{ label: "Carried from earlier days", value: naira(day.carriedIn ?? 0) }] : []),
						...((day.deviceFee ?? 0) > 0 ? [{ label: `Devices at ${day.deviceRate ?? 0} %`, value: naira(day.deviceFee ?? 0) }] : []),
						{ label: "Paid", value: naira(day.collected ?? 0) },
						...((day.refunded ?? 0) > 0 ? [{ label: "Refunded", value: <span className="text-danger">{naira(day.refunded)}</span> }] : []),
						{ label: "Status", value: feeStatus(day.status) },
						...(day.statementSentAt ? [{ label: "Statement sent", value: fmtWhen(day.statementSentAt) }] : []),
					]}
				/>
				{day.refundNote && <Note tone="info">Refund: {day.refundNote}</Note>}
				{onRefund && refundable > 0 && !refunding && (
					<button type="button" className={btn.secondary} onClick={() => setRefunding(true)}>
						Record refund
					</button>
				)}
				{onRefund && refunding && (
					<div className="flex flex-col gap-3 rounded-xl border border-line p-4">
						<TextField
							label="Amount refunded (₦)"
							value={amount}
							onChange={setAmount}
							error={amountError}
							hint={`Up to ${naira(refundable)} of the platform fee collected that day`}
							required
						/>
						<TextField label="Reason" value={reason} onChange={setReason} placeholder="Charged twice; refunded to the hotel" required />
						<Note tone="info">The referring marketer's commission on the refunded amount comes off their next statement.</Note>
						<div className="flex justify-end gap-2">
							<button type="button" className={btn.secondary} onClick={() => setRefunding(false)}>
								Cancel
							</button>
							<button
								type="button"
								className={btn.primary}
								disabled={busy || !amount || !!amountError || reason.trim().length < 3}
								onClick={async () => {
									setBusy(true);
									const ok = await onRefund(value, reason);
									setBusy(false);
									if (ok) {
										setRefunding(false);
										setAmount("");
										setReason("");
									}
								}}
							>
								Record refund
							</button>
						</div>
					</div>
				)}
				{onRedo && (
					<button type="button" className={btn.secondary} onClick={onRedo}>
						Work this day out again
					</button>
				)}
			</div>
		</Modal>
	);
}

function PosKeysModal({
	provider,
	current,
	onClose,
	onSave,
}: {
	provider: string;
	/** The provider's saved keys, masked; null when none are saved yet. */
	current: PosProviderKeysView | null;
	onClose: () => void;
	onSave: (provider: string, fields: Record<string, string>) => Promise<void>;
}) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const saved = (key: string) => current?.fields[key] ?? null;
	const missing = FIELDS[provider].filter((f) => !values[f.key]?.trim() && !saved(f.key));
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`${providerLabel(provider)} keys`}
			subtitle="Stored encrypted. Leave a field empty to keep the saved value; the hotel sees them masked."
		>
			<div className="flex flex-col gap-4">
				{FIELDS[provider].map((f) =>
					f.multiline ? (
						<label key={f.key} className="flex flex-col gap-1 text-[13px]">
							<span className="font-medium text-ink">{f.label}</span>
							<textarea
								className="min-h-24 rounded-lg border border-line bg-card px-3 py-2 font-mono text-[12px]"
								placeholder={saved(f.key) ? `Saved ${saved(f.key)}` : "Paste here"}
								value={values[f.key] ?? ""}
								onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
							/>
							{f.hint && <span className="text-[12px] text-ink-3">{f.hint}</span>}
						</label>
					) : (
						<TextField
							key={f.key}
							label={f.label}
							value={values[f.key] ?? ""}
							onChange={(v) => setValues({ ...values, [f.key]: v })}
							placeholder={saved(f.key) ? `Saved ${saved(f.key)}` : undefined}
							hint={f.hint}
						/>
					),
				)}
				{missing.length > 0 && <Note tone="info">Still needed: {missing.map((f) => f.label).join(", ")}</Note>}
				<div className="flex justify-end gap-2">
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={saving || Object.values(values).every((v) => !v?.trim())}
						onClick={async () => {
							setSaving(true);
							await onSave(provider, values);
							setSaving(false);
						}}
					>
						Save keys
					</button>
				</div>
			</div>
		</Modal>
	);
}
