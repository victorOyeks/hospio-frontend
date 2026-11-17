"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	cancelDevicePackage,
	type DeviceCatalogueRow,
	type DevicePackageView,
	deviceCatalogue,
	hotelDevicePackage,
	installDevicePackage,
	markDataPlanRenewed,
	recordDevicePayment,
	saveDevicePackage,
	setDataPlan,
} from "@hospio/api/actions/device-packages";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { Checkbox } from "@hospio/ui/primitives/checkbox";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, MoneyField, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { can } from "../shared";
import { PackageInvoices } from "./device-invoices";

/**
 * A hotel's devices and internet package (hospio-backend docs/plan-device-packages.md): tick what Hospio360 supplies from the
 * catalogue (quantities and prices can change for this hotel), choose how it is paid for, then mark it installed and follow
 * what has been collected. Used in onboarding (Connections) and the hotel panel.
 */

export const OPTIONS = [
	{ value: "OWN_DEVICES", label: "Own devices", hint: "The hotel has its own tablets and internet: nothing supplied, nothing charged" },
	{ value: "TRANSACTION", label: "From transactions", hint: "A share of each day's sales, debited each morning with the Hospio fee until paid off" },
	{ value: "MONTHLY", label: "Monthly", hint: "The total in 1 to 6 monthly instalments, invoiced and debited" },
	{ value: "ONE_TIME", label: "One time", hint: "Paid in full at installation (cash or transfer)" },
] as const;
type Option = (typeof OPTIONS)[number]["value"];

export const optionLabel = (o?: string | null) => OPTIONS.find((x) => x.value === o)?.label ?? o ?? "—";

export function packageStatus(p: { status: string; paymentOption: string }) {
	if (p.paymentOption === "OWN_DEVICES" && p.status === "DRAFT") return <StatusPill tone="grey">Own devices</StatusPill>;
	switch (p.status) {
		case "DRAFT":
			return <StatusPill tone="info">Agreed · not installed</StatusPill>;
		case "INSTALLED":
			return <StatusPill tone="warning">Paying off</StatusPill>;
		case "PAID_OFF":
			return <StatusPill tone="success">Paid off</StatusPill>;
		case "CANCELLED":
			return <StatusPill tone="grey">Cancelled</StatusPill>;
		default:
			return <StatusPill tone="grey">{p.status}</StatusPill>;
	}
}

const sourceLabel: Record<string, string> = {
	TRANSACTION: "From the daily debit",
	INVOICE: "Monthly invoice",
	ONE_TIME: "One-time payment",
	MANUAL: "Recorded by hand",
};

/** How far a package is: paid of total, with a bar. */
export function PackageProgress({ p }: { p: DevicePackageView }) {
	const pct = p.total > 0 ? Math.min(100, Math.round((p.paid / p.total) * 100)) : 0;
	return (
		<div className="flex flex-col gap-1">
			<div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
				<div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
			</div>
			<span className="text-[12px] text-ink-3">
				{naira(p.paid)} of {naira(p.total)} paid · {naira(p.remaining)} left
			</span>
		</div>
	);
}

type Row = { catalogueId: string; name: string; kind: string; on: boolean; quantity: number | ""; unitPrice: number | "" };

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

export function DevicePackagePanel({
	businessId,
	hotelId,
	hotelName,
	role,
	title,
}: {
	businessId: string;
	hotelId: string;
	hotelName?: string;
	role: AdminRole;
	title?: string;
}) {
	const [pkg, setPkg] = useState<DevicePackageView | null | undefined>(undefined);
	const [catalogue, setCatalogue] = useState<DeviceCatalogueRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [editing, setEditing] = useState(false);
	const load = useCallback(async () => {
		const [p, c] = await Promise.all([hotelDevicePackage(businessId, hotelId), deviceCatalogue()]);
		if (p.ok) setPkg(p.data && p.data.status !== "CANCELLED" ? p.data : null);
		else setError(p.error);
		if (c.ok) setCatalogue(c.data);
	}, [businessId, hotelId]);
	useEffect(() => {
		void load();
	}, [load]);

	const heading = title ?? `Devices & internet${hotelName ? ` · ${hotelName}` : ""}`;
	if (error) return <Note tone="danger">{error}</Note>;
	if (pkg === undefined) return <div className="h-28 animate-pulse rounded-card border border-line bg-card" />;
	const canEdit = !pkg || pkg.status === "DRAFT";
	if (editing || !pkg) {
		return (
			<SectionCard title={heading} subtitle="What Hospio360 supplies to this hotel and how it is paid for">
				<PackageEditor
					businessId={businessId}
					hotelId={hotelId}
					current={pkg}
					catalogue={catalogue}
					onCancel={pkg ? () => setEditing(false) : undefined}
					onSaved={(p) => {
						setPkg(p);
						setEditing(false);
					}}
				/>
			</SectionCard>
		);
	}
	return (
		<SectionCard
			title={heading}
			subtitle={`${optionLabel(pkg.paymentOption)}${pkg.agreedByName ? ` · set up by ${pkg.agreedByName}` : ""}`}
			headerRight={packageStatus(pkg)}
		>
			<PackageSummary
				p={pkg}
				role={role}
				onChange={(x) => setPkg(x.status === "CANCELLED" ? null : x)}
				onReload={() => void load()}
				onEdit={canEdit ? () => setEditing(true) : undefined}
			/>
		</SectionCard>
	);
}

function PackageEditor({
	businessId,
	hotelId,
	current,
	catalogue,
	onSaved,
	onCancel,
}: {
	businessId: string;
	hotelId: string;
	current: DevicePackageView | null;
	catalogue: DeviceCatalogueRow[];
	onSaved: (p: DevicePackageView) => void;
	onCancel?: () => void;
}) {
	const initial = useMemo<Row[]>(() => {
		const rows: Row[] = catalogue
			.filter((c) => c.active || current?.items.some((i) => i.catalogueId === c.id))
			.map((c) => {
				const had = current?.items.find((i) => i.catalogueId === c.id);
				return {
					catalogueId: c.id,
					name: c.name,
					kind: c.kind,
					on: !!had,
					quantity: had ? had.quantity : 1,
					unitPrice: had ? had.unitPrice : c.unitPrice,
				};
			});
		return rows;
	}, [catalogue, current]);
	const [rows, setRows] = useState<Row[]>(initial);
	useEffect(() => setRows(initial), [initial]);
	const [option, setOption] = useState<Option>((current?.paymentOption as Option) ?? "TRANSACTION");
	const [rate, setRate] = useState(String(current?.deviceRate ?? 2.5));
	const [months, setMonths] = useState(String(current?.months ?? 3));
	const [notes, setNotes] = useState(current?.notes ?? "");
	const [busy, setBusy] = useState(false);

	const picked = rows.filter((r) => r.on);
	const lineTotal = (r: Row) => (typeof r.quantity === "number" ? r.quantity : 0) * (typeof r.unitPrice === "number" ? r.unitPrice : 0);
	const oneOff = picked.filter((r) => r.kind === "ONE_OFF").reduce((a, r) => a + lineTotal(r), 0);
	const monthly = picked.filter((r) => r.kind === "MONTHLY").reduce((a, r) => a + lineTotal(r), 0);
	const own = option === "OWN_DEVICES";
	const set = (i: number, patch: Partial<Row>) => setRows((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

	const save = async () => {
		setBusy(true);
		const r = await saveDevicePackage(businessId, hotelId, {
			paymentOption: option,
			items: picked
				.filter((x) => !(own && x.kind === "ONE_OFF"))
				.map((x) => ({
					catalogueId: x.catalogueId,
					name: x.name,
					kind: x.kind,
					quantity: typeof x.quantity === "number" ? x.quantity : 0,
					unitPrice: typeof x.unitPrice === "number" ? x.unitPrice : 0,
				})),
			deviceRate: option === "TRANSACTION" ? Number(rate.replace(",", ".")) : null,
			months: option === "MONTHLY" ? Number(months) : null,
			notes: notes.trim() || null,
		});
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success("Device package saved");
		onSaved(r.data);
	};

	return (
		<div className="flex flex-col gap-4 pt-2">
			<ChoiceCards label="How the hotel pays for devices" value={option} onChange={setOption} columns={2} options={[...OPTIONS]} />
			<div className="overflow-x-auto rounded-xl border border-line">
				<table className="w-full min-w-[560px] text-[13px]">
					<thead className={tableHead}>
						<tr>
							<th className="px-3 py-2 text-left">Supply</th>
							<th className="px-3 py-2 text-left">Item</th>
							<th className="px-3 py-2 text-left">Qty</th>
							<th className="px-3 py-2 text-left">Unit price</th>
							<th className="px-3 py-2 text-right">Line</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r, i) => {
							const blocked = own && r.kind === "ONE_OFF";
							return (
								<tr key={r.catalogueId} className={tableRow}>
									<td className="px-3 py-2">
										<Checkbox
											checked={r.on && !blocked}
											disabled={blocked}
											onCheckedChange={(v) => set(i, { on: v === true })}
											aria-label={`Supply ${r.name}`}
										/>
									</td>
									<td className="px-3 py-2">
										<span className="font-medium text-ink">{r.name}</span>
										<span className="block text-[11px] text-ink-3">{r.kind === "MONTHLY" ? "Every month" : "Once"}</span>
									</td>
									<td className="w-24 px-3 py-2">
										<input
											type="number"
											min={1}
											max={1000}
											value={r.quantity}
											disabled={!r.on || blocked}
											onChange={(e) => set(i, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
											className="h-9 w-20 rounded-control border border-line bg-card px-2 disabled:opacity-50"
											aria-label={`${r.name} quantity`}
										/>
									</td>
									<td className="w-40 px-3 py-2">
										<input
											type="number"
											min={0}
											value={r.unitPrice}
											disabled={!r.on || blocked}
											onChange={(e) => set(i, { unitPrice: e.target.value === "" ? "" : Number(e.target.value) })}
											className="h-9 w-32 rounded-control border border-line bg-card px-2 disabled:opacity-50"
											aria-label={`${r.name} unit price`}
										/>
									</td>
									<td className="px-3 py-2 text-right font-medium">{r.on && !blocked ? naira(lineTotal(r)) : "—"}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{option === "TRANSACTION" && (
					<TextField label="Share of daily sales for devices (%)" value={rate} onChange={setRate} placeholder="2.5" hint="2.5 % unless agreed otherwise" />
				)}
				{option === "MONTHLY" && (
					<SelectField
						label="Pay over"
						value={months}
						onChange={setMonths}
						options={[1, 2, 3, 4, 5, 6].map((m) => ({ value: String(m), label: `${m} month${m === 1 ? "" : "s"}` }))}
						hint={oneOff > 0 ? `${naira(Math.ceil((oneOff / Number(months)) * 100) / 100)} a month` : undefined}
					/>
				)}
				<TextField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="e.g. 2 tablets for front desk and bar" />
			</div>
			<DetailList
				columns={2}
				items={[
					{ label: "Devices (one-off)", value: naira(own ? 0 : oneOff) },
					{ label: "Data plan (monthly)", value: monthly > 0 ? `${naira(monthly)} a month` : "None" },
				]}
			/>
			<Note tone="info">
				Hospio360 owns the devices until they are paid off. If the hotel leaves before then, it pays what is left or returns them.
			</Note>
			<div className="flex justify-end gap-2">
				{onCancel && (
					<button type="button" className={btn.secondary} onClick={onCancel} disabled={busy}>
						Cancel
					</button>
				)}
				<button type="button" className={btn.primary} onClick={() => void save()} disabled={busy}>
					{busy ? "Saving…" : current ? "Save changes" : "Save package"}
				</button>
			</div>
		</div>
	);
}

function PackageSummary({
	p,
	role,
	onChange,
	onReload,
	onEdit,
}: {
	p: DevicePackageView;
	role: AdminRole;
	onChange: (p: DevicePackageView) => void;
	onReload?: () => void;
	onEdit?: () => void;
}) {
	const [installing, setInstalling] = useState(false);
	const [installOn, setInstallOn] = useState(today());
	const [paying, setPaying] = useState(false);
	const [amount, setAmount] = useState<number | "">("");
	const [reference, setReference] = useState("");
	const [paidOn, setPaidOn] = useState(today());
	const [note, setNote] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [busy, setBusy] = useState(false);
	const money = can.money(role);
	const own = p.paymentOption === "OWN_DEVICES";

	const run = async (fn: () => Promise<{ ok: true; data: DevicePackageView } | { ok: false; error: string }>, done: string) => {
		setBusy(true);
		const r = await fn();
		setBusy(false);
		if (!r.ok) {
			toast.error(r.error);
			return false;
		}
		toast.success(done);
		onChange(r.data);
		return true;
	};

	return (
		<div className="flex flex-col gap-4 pt-2">
			{!own && p.total > 0 && <PackageProgress p={p} />}
			<DetailList
				columns={2}
				items={[
					{ label: "Paid by", value: optionLabel(p.paymentOption) },
					...(p.paymentOption === "TRANSACTION" ? [{ label: "Share of daily sales", value: `${p.deviceRate ?? 2.5}%` }] : []),
					...(p.paymentOption === "MONTHLY"
						? [{ label: "Instalments", value: `${p.months} × ${naira(p.monthlyInstalment ?? 0)}` }]
						: []),
					{ label: "Devices total", value: naira(p.total) },
					{ label: "Data plan", value: p.dataPlanMonthly > 0 ? `${naira(p.dataPlanMonthly)} a month` : "None" },
					{ label: "Installed", value: p.installedAt ? fmtLongDate(p.installedAt) : "Not yet" },
					...(p.paymentOption === "TRANSACTION" && p.status !== "DRAFT"
						? [
								{ label: "Collected in the last 30 days", value: naira(p.last30Days ?? 0) },
								{
									label: "Expected to finish",
									value: p.expectedFinish
										? `${fmtLongDate(p.expectedFinish)} (about ${p.daysLeft} days)`
										: p.status === "PAID_OFF"
											? "Paid off"
											: "After the first debits",
								},
							]
						: []),
					...(p.paidOffAt ? [{ label: "Paid off", value: fmtLongDate(p.paidOffAt) }] : []),
				]}
			/>
			{p.items.length > 0 && (
				<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
					{p.items.map((i) => (
						<li key={i.id} className="flex items-center justify-between px-4 py-2">
							<span>
								<span className="font-medium text-ink">{i.quantity} × {i.name}</span>
								<span className="ml-2 text-[11px] text-ink-3">{i.kind === "MONTHLY" ? "monthly" : "once"}</span>
							</span>
							<span className="text-ink-2">
								{naira(i.unitPrice)} each · <span className="font-semibold text-ink">{naira(i.lineTotal)}</span>
							</span>
						</li>
					))}
				</ul>
			)}
			{p.status === "DRAFT" && p.paymentOption === "TRANSACTION" && (
				<Note tone="info">
					Collection starts the day the devices are installed. It is taken with the Hospio fee, so the hotel's automatic debit must be on.
				</Note>
			)}
			{(p.status === "INSTALLED" || p.status === "PAID_OFF") && (
				<DataPlanControls p={p} role={role} onChange={onChange} />
			)}
			{p.status !== "DRAFT" && (p.paymentOption === "MONTHLY" || p.dataPlanMonthly > 0) && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">Monthly invoices</p>
					<PackageInvoices packageId={p.id} money={money} onPaid={onReload} />
				</div>
			)}
			{p.payments.length > 0 && (
				<div className="overflow-x-auto rounded-xl border border-line">
					<table className="w-full min-w-[520px] text-[13px]">
						<thead className={tableHead}>
							<tr>
								<th className={cell}>Date</th>
								<th className={cell}>How</th>
								<th className={cell}>Reference</th>
								<th className={`${cell} text-right`}>Amount</th>
							</tr>
						</thead>
						<tbody>
							{p.payments.map((x) => (
								<tr key={x.id} className={tableRow}>
									<td className={cell}>{fmtLongDate(x.paidOn)}</td>
									<td className={cell}>
										{sourceLabel[x.source] ?? x.source}
										{x.recordedByName && <span className="block text-[11px] text-ink-3">by {x.recordedByName}</span>}
									</td>
									<td className={cell}>{x.reference}</td>
									<td className={`${cell} text-right font-semibold`}>{naira(x.amount)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className="flex flex-wrap justify-end gap-2">
				{onEdit && (
					<button type="button" className={btn.secondary} onClick={onEdit} disabled={busy}>
						Change package
					</button>
				)}
				{p.status === "DRAFT" && p.paid === 0 && (
					<button type="button" className={btn.secondary} onClick={() => setCancelling(true)} disabled={busy}>
						Remove package
					</button>
				)}
				{p.status === "DRAFT" && !(own && p.dataPlanMonthly <= 0) && (
					<button type="button" className={btn.primary} onClick={() => setInstalling(true)} disabled={busy}>
						Mark installed
					</button>
				)}
				{p.status === "INSTALLED" && money && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							setAmount(p.paymentOption === "ONE_TIME" ? p.remaining : "");
							setPaying(true);
						}}
						disabled={busy}
					>
						Record payment
					</button>
				)}
			</div>
			<Modal
				open={installing}
				onOpenChange={setInstalling}
				title="Mark the devices installed"
				subtitle={
					p.paymentOption === "TRANSACTION"
						? `From this day, ${p.deviceRate ?? 2.5}% of each day's sales is added to the hotel's daily debit until ${naira(p.total)} is paid.`
						: p.paymentOption === "MONTHLY"
							? `The first of ${p.months} monthly instalments of ${naira(p.monthlyInstalment ?? 0)} is invoiced from this day.`
							: p.paymentOption === "ONE_TIME"
								? `Record the ${naira(p.total)} payment once it is received.`
								: "The data plan is invoiced monthly from this day."
				}
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setInstalling(false)}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={busy || !installOn}
							onClick={() => void run(() => installDevicePackage(p.id, installOn), "Devices marked installed").then((ok) => ok && setInstalling(false))}
						>
							Mark installed
						</button>
					</>
				}
			>
				<TextField label="Installed on" type="date" value={installOn} onChange={setInstallOn} />
			</Modal>
			<Modal
				open={paying}
				onOpenChange={setPaying}
				title="Record a device payment"
				subtitle={`${naira(p.remaining)} left · cash or bank transfer received for ${p.hotelName ?? "this hotel"}'s devices`}
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setPaying(false)}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={busy || amount === "" || !reference.trim()}
							onClick={() =>
								void run(
									() => recordDevicePayment(p.id, { amount: amount as number, reference: reference.trim(), paidOn, note: note.trim() || null }),
									"Payment recorded",
								).then((ok) => {
									if (ok) {
										setPaying(false);
										setReference("");
										setNote("");
									}
								})
							}
						>
							Record payment
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-3">
					<MoneyField label="Amount" value={amount} onChange={setAmount} />
					<TextField label="Reference" value={reference} onChange={setReference} placeholder="Bank reference or receipt number" />
					<TextField label="Received on" type="date" value={paidOn} onChange={setPaidOn} />
					<TextField label="Note (optional)" value={note} onChange={setNote} />
				</div>
			</Modal>
			<ConfirmModal
				open={cancelling}
				onOpenChange={setCancelling}
				tone="danger"
				title="Remove this device package?"
				subtitle="Nothing has been collected on it. You can set up a new one afterwards."
				confirmLabel="Remove package"
				pending={busy}
				onConfirm={() => void run(() => cancelDevicePackage(p.id), "Device package removed").then(() => setCancelling(false))}
			/>
		</div>
	);
}

const dayText = (d?: string | null) => (d ? fmtLongDate(d) : "—");

/**
 * The data plan after installation: running or stopped, the next invoice, the real provider subscription renewed through; Finance
 * and Super admins stop, start again or reprice it; any admin records a renewal with the provider.
 */
function DataPlanControls({
	p,
	role,
	onChange,
}: {
	p: DevicePackageView;
	role: AdminRole;
	onChange: (p: DevicePackageView) => void;
}) {
	const money = can.money(role);
	const running = p.dataPlanRunning ?? (p.dataPlanMonthly > 0 && !p.dataPlanStoppedOn);
	const hasPlan = p.dataPlanMonthly > 0;
	const [modal, setModal] = useState<"price" | "stop" | "start" | "renewed" | null>(null);
	const [price, setPrice] = useState<number | "">(p.dataPlanMonthly || "");
	const [through, setThrough] = useState(() => {
		const d = new Date();
		d.setMonth(d.getMonth() + 1);
		return d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
	});
	const [busy, setBusy] = useState(false);
	const act = async (fn: () => ReturnType<typeof setDataPlan>, done: string) => {
		setBusy(true);
		const r = await fn();
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success(done);
		onChange(r.data);
		setModal(null);
	};
	if (!hasPlan && !money) return null;
	const renewedLate = p.dataPlanRenewedThrough && p.dataPlanRenewedThrough < new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-line p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-[13px] font-semibold text-ink">Data plan</p>
				{!hasPlan ? (
					<StatusPill tone="grey">None</StatusPill>
				) : running ? (
					<StatusPill tone="success">Running</StatusPill>
				) : (
					<StatusPill tone="grey">Stopped</StatusPill>
				)}
			</div>
			{hasPlan && (
				<DetailList
					columns={2}
					items={[
						{ label: "Price", value: `${naira(p.dataPlanMonthly)} a month` },
						running
							? { label: "Next invoice", value: dayText(p.nextDataPlanDue) }
							: { label: "Stopped from", value: dayText(p.dataPlanStoppedOn) },
						{
							label: "Provider subscription",
							value: p.dataPlanRenewedThrough ? (
								<span className={renewedLate ? "font-semibold text-danger" : undefined}>
									Renewed through {dayText(p.dataPlanRenewedThrough)}
									{p.dataPlanRenewedByName ? ` · ${p.dataPlanRenewedByName}` : ""}
								</span>
							) : (
								<span className="text-warning">No renewal recorded yet</span>
							),
						},
						...(p.dataPlanChangedByName ? [{ label: "Last changed", value: `${p.dataPlanChangedByName} · ${dayText(p.dataPlanChangedAt)}` }] : []),
					]}
				/>
			)}
			<div className="flex flex-wrap justify-end gap-2">
				{hasPlan && running && (
					<button type="button" className={btn.secondary} onClick={() => setModal("renewed")} disabled={busy}>
						Mark renewed with provider
					</button>
				)}
				{money && running && (
					<>
						<button type="button" className={btn.secondary} onClick={() => setModal("price")} disabled={busy}>
							Change price
						</button>
						<button type="button" className={btn.secondary} onClick={() => setModal("stop")} disabled={busy}>
							Stop data plan
						</button>
					</>
				)}
				{money && !running && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							setPrice(p.dataPlanMonthly || "");
							setModal("start");
						}}
						disabled={busy}
					>
						{hasPlan ? "Start data plan again" : "Add a data plan"}
					</button>
				)}
			</div>
			<Modal
				open={modal === "price" || modal === "start"}
				onOpenChange={(o) => !o && setModal(null)}
				title={modal === "start" ? (hasPlan ? "Start the data plan again" : "Add a data plan") : "Change the data plan price"}
				subtitle={
					modal === "start"
						? "Billed every month from the next due day; the months it was stopped are never billed"
						: "Applies to invoices issued from now on; invoices already issued keep their amount"
				}
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setModal(null)}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={busy || price === "" || price <= 0}
							onClick={() =>
								void act(
									() => setDataPlan(p.id, modal === "start" ? "START" : "PRICE", price === "" ? null : price),
									modal === "start" ? "Data plan running" : "Data plan price changed",
								)
							}
						>
							{modal === "start" ? "Start data plan" : "Save price"}
						</button>
					</>
				}
			>
				<MoneyField label="Price a month" value={price} onChange={setPrice} />
			</Modal>
			<ConfirmModal
				open={modal === "stop"}
				onOpenChange={(o) => !o && setModal(null)}
				tone="danger"
				title="Stop the data plan?"
				subtitle={`No more data plan invoices from ${dayText(p.nextDataPlanDue)}. Invoices already issued stay owed. Remember to stop the subscription with the provider too.`}
				confirmLabel="Stop data plan"
				pending={busy}
				onConfirm={() => void act(() => setDataPlan(p.id, "STOP", null), "Data plan stopped")}
			/>
			<Modal
				open={modal === "renewed"}
				onOpenChange={(o) => !o && setModal(null)}
				title="Renewed with the provider"
				subtitle="Record that the hotel's data subscription (MTN, Airtel, Spectranet…) now runs to this day"
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setModal(null)}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={busy || !through}
							onClick={() => void act(() => markDataPlanRenewed(p.id, through), "Renewal recorded")}
						>
							Save
						</button>
					</>
				}
			>
				<TextField label="Runs to" type="date" value={through} onChange={setThrough} />
			</Modal>
		</div>
	);
}
