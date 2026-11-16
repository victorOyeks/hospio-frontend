"use client";

import { CreditCardIcon, KeyRoundIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	adminDailyFees,
	adminPosConfig,
	type DailyFeeRow,
	type FeeCollectionView,
	feeCollection,
	type PosConfigView,
	redoFeeDay,
	runFeeDay,
	runFeeDebit,
	saveAdminPosConfig,
	setFeeCollection,
} from "@hospio/api/actions/daily-fees";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { Switch } from "@hospio/ui/primitives/switch";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * A hotel's POS provider keys and Hospio's daily fee (hospio-backend docs/plan-daily-fees.md, docs/pos-providers.md): the keys
 * are entered here by a super admin and shown masked; the debit switch turns on only when the provider's debit is configured on
 * the server and the hotel's keys are in; the daily fees list shows each day's sales, fee and debit.
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

export function feeStatus(status: string) {
	switch (status) {
		case "PAID":
			return <StatusPill tone="success">Debited</StatusPill>;
		case "SHADOW":
			return <StatusPill tone="info">Statement only</StatusPill>;
		case "NO_FEE":
			return <StatusPill tone="grey">No fee</StatusPill>;
		case "SCHEDULED":
			return <StatusPill tone="brand">Debit at 6am</StatusPill>;
		case "PENDING":
			return <StatusPill tone="warning">Waiting on provider</StatusPill>;
		case "PART_PAID":
			return <StatusPill tone="warning">Part debited</StatusPill>;
		case "UNPAID":
			return <StatusPill tone="danger">Not debited</StatusPill>;
		case "CARRIED":
			return <StatusPill tone="grey">Carried to next day</StatusPill>;
		default:
			return <StatusPill tone="grey">{status}</StatusPill>;
	}
}

export function HotelFeesPanel({ businessId, hotelId, role }: { businessId: string; hotelId: string; role: AdminRole }) {
	const superAdmin = role === "SUPER_ADMIN";
	const [pos, setPos] = useState<PosConfigView | null>(null);
	const [collection, setCollection] = useState<FeeCollectionView | null>(null);
	const [days, setDays] = useState<DailyFeeRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState(false);
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

	const toggleDebit = async (on: boolean) => {
		const r = await setFeeCollection(businessId, hotelId, collection?.provider ?? pos?.provider ?? null, on);
		if (r.ok) {
			setCollection(r.data);
			toast.success(on ? "Debit switched on: the fee is debited at 6am daily" : "Debit off: statements only");
		} else toast.error(r.error);
	};
	const chooseProvider = async (p: string) => {
		const r = await setFeeCollection(businessId, hotelId, p, false);
		if (r.ok) setCollection(r.data);
		else toast.error(r.error);
	};

	const state = collection?.providers.find((x) => x.provider === (collection?.provider ?? pos?.provider));
	const canSwitchOn = !!state && state.debitConfigured && state.hotelKeys;

	return (
		<>
			{error && <Note tone="danger">{error}</Note>}
			{superAdmin && (
				<SectionCard
					title="POS provider"
					subtitle="The hotel's own Moniepoint or OPay keys: card payments go to its terminals, and the daily fee is debited from its account"
					headerRight={
						<button type="button" className={`${btn.secondary} ${btn.small}`} onClick={() => setEditing(true)}>
							<KeyRoundIcon className="mr-1 inline size-4" /> {pos?.provider ? "Change keys" : "Add keys"}
						</button>
					}
				>
					{!pos ? (
						<p className="text-[13px] text-ink-3">Loading…</p>
					) : !pos.keyStoreReady ? (
						<Note tone="warning">The server has no POS_SECRETS_KEY yet, so keys can't be stored. Set it on the server first.</Note>
					) : !pos.provider ? (
						<p className="text-[13px] text-ink-2">No keys yet. This hotel's card payments use the server's POS setting.</p>
					) : (
						<DetailList
							columns={2}
							items={[
								{ label: "Provider", value: providerLabel(pos.provider) },
								{ label: "Keys", value: pos.complete ? <StatusPill tone="success">Complete</StatusPill> : <StatusPill tone="warning">Incomplete</StatusPill> },
								...FIELDS[pos.provider].map((f) => ({ label: f.label, value: pos.fields[f.key] ?? "—" })),
								{ label: "Updated", value: pos.updatedAt ? `${fmtWhen(pos.updatedAt)} by ${pos.updatedByName ?? "Hospio360"}` : "—" },
							]}
						/>
					)}
				</SectionCard>
			)}

			<SectionCard
				title="Hospio fee collection"
				subtitle="1.5 % of each day's sales (the business's fee rule), worked out at 00:05 and debited at 6am"
				headerRight={
					superAdmin ? (
						<div className="flex gap-2">
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								onClick={async () => {
									const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
									const r = await runFeeDay(y);
									if (r.ok) {
										toast.success(`${r.data.date}: ${r.data.worked} worked out, ${r.data.statements} statements${r.data.notes.length ? ` · ${r.data.notes.join("; ")}` : ""}`);
										void load();
									} else toast.error(r.error);
								}}
							>
								<PlayIcon className="mr-1 inline size-4" /> Work out yesterday
							</button>
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								onClick={async () => {
									const r = await runFeeDebit();
									if (r.ok) {
										toast.success(`Debit run: ${r.data.tried} tried, ${r.data.paid} paid, ${r.data.pending} pending, ${r.data.unpaid} unpaid`);
										void load();
									} else toast.error(r.error);
								}}
							>
								<CreditCardIcon className="mr-1 inline size-4" /> Run debit now
							</button>
						</div>
					) : undefined
				}
			>
				{!collection ? (
					<p className="text-[13px] text-ink-3">Loading…</p>
				) : (
					<div className="flex flex-col gap-4">
						<div className="grid gap-4 md:grid-cols-2">
							<SelectField
								label="Debit from"
								value={collection.provider ?? ""}
								onChange={(v) => void chooseProvider(v)}
								disabled={!superAdmin || collection.debitEnabled}
								options={[
									{ value: "MONIEPOINT", label: "Moniepoint" },
									{ value: "OPAY", label: "OPay" },
								]}
								hint={collection.debitEnabled ? "Switch the debit off to change the provider" : undefined}
							/>
							<div className="flex flex-col gap-2">
								<span className="text-[13px] font-medium text-ink">Automatic debit</span>
								<div className="flex items-center gap-3">
									<Switch
										checked={collection.debitEnabled}
										disabled={!superAdmin || (!collection.debitEnabled && !canSwitchOn)}
										onCheckedChange={(v) => void toggleDebit(v)}
									/>
									<span className="text-[13px] text-ink-2">
										{collection.debitEnabled ? "On: debited daily at 6am" : "Off: statements only (shadow mode)"}
									</span>
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{collection.providers.map((p) => (
								<span key={p.provider} className="rounded-lg border border-line px-3 py-2 text-[12px] text-ink-2">
									<b className="text-ink">{providerLabel(p.provider)}</b> · debit {p.debitConfigured ? "configured" : "not configured"} · hotel keys{" "}
									{p.hotelKeys ? "in" : "missing"}
									{p.reason ? ` · ${p.reason}` : ""}
								</span>
							))}
						</div>
						{collection.posPaused && (
							<Note tone="danger">POS push is paused: the fee has been unpaid for 3 days. It resumes when a debit goes through.</Note>
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
					current={pos}
					onClose={() => setEditing(false)}
					onSave={async (provider, fields) => {
						const r = await saveAdminPosConfig(businessId, hotelId, provider, fields);
						if (r.ok) {
							setPos(r.data);
							setEditing(false);
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
						superAdmin && (open.status === "SHADOW" || open.status === "NO_FEE")
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
						<th className={cell}>Due</th>
						<th className={cell}>Debited</th>
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
							<td className={cell}>{naira(d.due)}</td>
							<td className={cell}>{naira(d.collected ?? 0)}</td>
							<td className={cell}>{feeStatus(d.status)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function FeeDayModal({ day, onClose, onRedo }: { day: DailyFeeRow; onClose: () => void; onRedo?: () => void }) {
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title={`${day.hotelName ?? "Hotel"} · ${new Date(`${day.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
			subtitle="What was sold that day (VAT excluded), the fee and the debit"
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
						{ label: "Carried from earlier days", value: naira(day.carriedIn ?? 0) },
						{ label: "Due", value: naira(day.due) },
						{ label: "Debited", value: naira(day.collected ?? 0) },
						{ label: "Status", value: feeStatus(day.status) },
						{ label: "Debit from", value: providerLabel(day.provider) },
						{ label: "Reference", value: day.debitRef ?? "—" },
						{ label: "Statement sent", value: day.statementSentAt ? fmtWhen(day.statementSentAt) : "—" },
					]}
				/>
				{day.lastError && <Note tone="warning">{day.lastError}</Note>}
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
	current,
	onClose,
	onSave,
}: {
	current: PosConfigView;
	onClose: () => void;
	onSave: (provider: string, fields: Record<string, string>) => Promise<void>;
}) {
	const [provider, setProvider] = useState(current.provider ?? "MONIEPOINT");
	const [values, setValues] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const same = provider === current.provider;
	const missing = FIELDS[provider].filter((f) => !values[f.key]?.trim() && !(same && current.fields[f.key]));
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="POS provider keys"
			subtitle="Stored encrypted. Leave a field empty to keep the saved value; the hotel sees them masked."
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Provider"
					value={provider}
					onChange={(v) => {
						setProvider(v);
						setValues({});
					}}
					options={[
						{ value: "MONIEPOINT", label: "Moniepoint" },
						{ value: "OPAY", label: "OPay" },
					]}
				/>
				{FIELDS[provider].map((f) =>
					f.multiline ? (
						<label key={f.key} className="flex flex-col gap-1 text-[13px]">
							<span className="font-medium text-ink">{f.label}</span>
							<textarea
								className="min-h-24 rounded-lg border border-line bg-card px-3 py-2 font-mono text-[12px]"
								placeholder={same && current.fields[f.key] ? `Saved ${current.fields[f.key]}` : "Paste here"}
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
							placeholder={same && current.fields[f.key] ? `Saved ${current.fields[f.key]}` : undefined}
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
