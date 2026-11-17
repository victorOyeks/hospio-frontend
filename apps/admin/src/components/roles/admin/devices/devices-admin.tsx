"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	allDevicePackages,
	type DeviceCatalogueRow,
	type DevicePackageView,
	deviceCatalogue,
	saveDeviceCatalogueItem,
} from "@hospio/api/actions/device-packages";
import { Note } from "@hospio/ui/shared/detail-list";
import { MoneyField, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate, naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { BanknoteIcon, MonitorSmartphoneIcon, WalletIcon } from "lucide-react";
import { optionLabel, PackageProgress, packageStatus } from "./device-package";

/** Settings · Device catalogue: the standard items and prices a package starts from (a Super admin edits them). */
export function DeviceCatalogueSettings({ editable }: { editable: boolean }) {
	const [items, setItems] = useState<DeviceCatalogueRow[] | null>(null);
	const [editing, setEditing] = useState<DeviceCatalogueRow | "new" | null>(null);
	const [name, setName] = useState("");
	const [kind, setKind] = useState("ONE_OFF");
	const [price, setPrice] = useState<number | "">("");
	const [busy, setBusy] = useState(false);
	const load = useCallback(async () => {
		const r = await deviceCatalogue();
		if (r.ok) setItems(r.data);
		else toast.error(r.error);
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
	const open = (i: DeviceCatalogueRow | "new") => {
		setEditing(i);
		setName(i === "new" ? "" : i.name);
		setKind(i === "new" ? "ONE_OFF" : i.kind);
		setPrice(i === "new" ? "" : i.unitPrice);
	};
	const save = async (active?: boolean, row?: DeviceCatalogueRow) => {
		const target = row ?? (editing === "new" ? null : editing);
		setBusy(true);
		const r = await saveDeviceCatalogueItem(target?.id ?? null, {
			name: row ? row.name : name.trim(),
			kind: row ? row.kind : kind,
			unitPrice: row ? row.unitPrice : typeof price === "number" ? price : -1,
			...(active === undefined ? {} : { active }),
		});
		setBusy(false);
		if (!r.ok) return toast.error(r.error);
		toast.success("Catalogue saved");
		setEditing(null);
		void load();
	};
	return (
		<SectionCard
			title="Device catalogue"
			subtitle="Standard items and prices a hotel's devices & internet package starts from; prices can be changed per hotel"
			headerRight={
				editable ? (
					<button type="button" className={btn.secondary} onClick={() => open("new")}>
						Add item
					</button>
				) : undefined
			}
			flush
		>
			{!items ? (
				<div className="mx-5 mb-5 h-20 animate-pulse rounded-xl bg-subtle" />
			) : (
				<table className="w-full text-[13px]">
					<thead className={tableHead}>
						<tr>
							<th className="px-5 py-2 text-left">Item</th>
							<th className="px-3 py-2 text-left">Charged</th>
							<th className="px-3 py-2 text-right">Price</th>
							<th className="px-3 py-2 text-left">Status</th>
							<th className="px-5 py-2" />
						</tr>
					</thead>
					<tbody>
						{items.map((i) => (
							<tr key={i.id} className={tableRow}>
								<td className="px-5 py-2 font-medium text-ink">{i.name}</td>
								<td className="px-3 py-2">{i.kind === "MONTHLY" ? "Every month" : "Once"}</td>
								<td className="px-3 py-2 text-right font-semibold">{naira(i.unitPrice)}</td>
								<td className="px-3 py-2">{i.active ? <StatusPill tone="success">Offered</StatusPill> : <StatusPill tone="grey">Hidden</StatusPill>}</td>
								<td className="whitespace-nowrap px-5 py-2 text-right">
									{editable && (
										<>
											<button type="button" className="text-[13px] font-semibold text-brand hover:underline" onClick={() => open(i)}>
												Change
											</button>
											<span className="text-ink-3"> · </span>
											<button
												type="button"
												className="text-[13px] font-semibold text-brand hover:underline"
												onClick={() => void save(!i.active, i)}
												disabled={busy}
											>
												{i.active ? "Hide" : "Offer again"}
											</button>
										</>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
			<Modal
				open={!!editing}
				onOpenChange={(o) => !o && setEditing(null)}
				title={editing === "new" ? "Add a catalogue item" : "Change catalogue item"}
				subtitle="Packages already put together keep the prices they were agreed at"
				footer={
					<>
						<button type="button" className={btn.secondary} onClick={() => setEditing(null)}>
							Cancel
						</button>
						<button type="button" className={btn.primary} disabled={busy || !name.trim() || price === ""} onClick={() => void save()}>
							Save item
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-3">
					<TextField label="Name" value={name} onChange={setName} placeholder="e.g. Tablet (10-inch, with case)" />
					<SelectField
						label="Charged"
						value={kind}
						onChange={setKind}
						options={[
							{ value: "ONE_OFF", label: "Once (a device)" },
							{ value: "MONTHLY", label: "Every month (a data plan)" },
						]}
					/>
					<MoneyField label="Price" value={price} onChange={setPrice} />
				</div>
			</Modal>
		</SectionCard>
	);
}

/** Fees & billing → Devices: every hotel's package, what has been collected and what is left. */
export function DevicesTab() {
	const [rows, setRows] = useState<DevicePackageView[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState("");
	useEffect(() => {
		void allDevicePackages().then((r) => (r.ok ? setRows(r.data) : setError(r.error)));
	}, []);
	const shown = useMemo(() => (rows ?? []).filter((p) => !status || p.status === status || (status === "OWN" && p.paymentOption === "OWN_DEVICES")), [rows, status]);
	const supplied = (rows ?? []).filter((p) => p.paymentOption !== "OWN_DEVICES");
	const total = supplied.reduce((a, p) => a + p.total, 0);
	const paid = supplied.reduce((a, p) => a + p.paid, 0);
	return (
		<div className="flex flex-col gap-4">
			{error && <Note tone="danger">{error}</Note>}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<KpiCard label="Devices supplied" value={nairaShort(total)} icon={MonitorSmartphoneIcon} hint={`${supplied.length} hotel package${supplied.length === 1 ? "" : "s"}`} />
				<KpiCard label="Collected" value={nairaShort(paid)} icon={WalletIcon} />
				<KpiCard label="Left to collect" value={nairaShort(total - paid)} icon={BanknoteIcon} />
			</div>
			<SectionCard
				title="Device packages"
				subtitle="Open one to install it, record a payment or follow its collection"
				headerRight={
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						className="h-9 rounded-control border border-line bg-card px-3 text-[13px]"
						aria-label="Status"
					>
						<option value="">All</option>
						<option value="DRAFT">Agreed · not installed</option>
						<option value="INSTALLED">Paying off</option>
						<option value="PAID_OFF">Paid off</option>
						<option value="OWN">Own devices</option>
					</select>
				}
				flush
			>
				{!rows ? (
					<div className="mx-5 mb-5 h-24 animate-pulse rounded-xl bg-subtle" />
				) : shown.length === 0 ? (
					<p className="px-5 pb-5 text-[13px] text-ink-3">No device packages{status ? " with that status" : " yet"}. They are set up in onboarding (Connections) or a hotel's Devices tab.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[860px] text-[13px]">
							<thead className={tableHead}>
								<tr>
									<th className={cell}>Hotel</th>
									<th className={cell}>Paid by</th>
									<th className={cell}>Progress</th>
									<th className={cell}>Installed</th>
									<th className={cell}>Expected to finish</th>
									<th className={cell}>Status</th>
								</tr>
							</thead>
							<tbody>
								{shown.map((p) => (
									<tr key={p.id} className={tableRow}>
										<td className={cell}>
											<Link href={`/dashboard/hotels?hotel=${p.hotelId}&htab=devices`} className="font-semibold text-brand hover:underline">
												{p.hotelName ?? "Hotel"}
											</Link>
										</td>
										<td className={cell}>
											{optionLabel(p.paymentOption)}
											{p.paymentOption === "TRANSACTION" && <span className="block text-[11px] text-ink-3">{p.deviceRate}% of daily sales</span>}
											{p.paymentOption === "MONTHLY" && (
												<span className="block text-[11px] text-ink-3">
													{p.months} × {naira(p.monthlyInstalment ?? 0)}
												</span>
											)}
										</td>
										<td className={`${cell} w-64`}>{p.total > 0 ? <PackageProgress p={p} /> : <span className="text-ink-3">—</span>}</td>
										<td className={cell}>{p.installedAt ? fmtLongDate(p.installedAt) : "—"}</td>
										<td className={cell}>{p.expectedFinish ? fmtLongDate(p.expectedFinish) : "—"}</td>
										<td className={cell}>{packageStatus(p)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</SectionCard>
		</div>
	);
}
