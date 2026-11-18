"use client";

import {
	AlertTriangleIcon,
	BanIcon,
	ClockIcon,
	CreditCardIcon,
	FlagIcon,
	ReceiptIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TillRow } from "@hospio/api/data/types";
import type {
	OnShiftRow,
	TerminalTotal,
	VenueToday,
} from "@hospio/api/data/venue";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtDate, fmtTime, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";

/**
 * Today at a lounge, bar or restaurant (hospio-backend docs/plan-venue-type.md phase 2), for the owner (one venue or all of them)
 * and the manager. Every figure is read from the outlets, tills and clock; a missing comparison or an empty list says so plainly.
 */

export type VenueLocationToday = {
	hotelId: string;
	name: string;
	today: VenueToday | null;
	tills: TillRow[] | null;
	onShift: OnShiftRow[] | null;
	/** People on today's rota (not cancelled). */
	rota: number | null;
	/** Card payments by POS today (null when payment-service can't be read). */
	terminals: TerminalTotal[] | null;
};

export type AttentionItem = {
	key: string;
	title: string;
	detail: string;
	tone: "danger" | "warning" | "info";
	cta: string;
	href: string;
};

const METHOD_LABEL: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card (POS)",
	TRANSFER: "Transfer",
	ROOM: "On rooms",
};

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** Several venues as one: sums, merged outlets, items by name, the latest voids. The comparison only when every venue has one. */
function combine(rows: VenueLocationToday[]): VenueLocationToday {
	const days = rows.map((r) => r.today).filter((t): t is VenueToday => !!t);
	const all = days.length === rows.length ? days : [];
	const merged: VenueToday | null =
		days.length === 0
			? null
			: {
					date: days[0].date,
					at: days[0].at,
					today: {
						sales: sum(days.map((d) => d.today.sales)),
						sold: sum(days.map((d) => d.today.sold)),
						paid: sum(days.map((d) => d.today.paid)),
						unpaid: sum(days.map((d) => d.today.unpaid)),
						cancelled: sum(days.map((d) => d.today.cancelled)),
						itemsSold: sum(days.map((d) => d.today.itemsSold)),
					},
					lastWeek:
						all.length > 0 && all.every((d) => d.lastWeek)
							? {
									date: all[0].lastWeek?.date ?? "",
									soFarSales: sum(all.map((d) => d.lastWeek?.soFarSales ?? 0)),
									soFar: sum(all.map((d) => d.lastWeek?.soFar ?? 0)),
									daySales: sum(all.map((d) => d.lastWeek?.daySales ?? 0)),
									day: sum(all.map((d) => d.lastWeek?.day ?? 0)),
								}
							: null,
					takenByMethod: Object.values(
						days
							.flatMap((d) => d.takenByMethod)
							.reduce<Record<string, VenueToday["takenByMethod"][number]>>(
								(acc, m) => {
									const p = acc[m.method] ?? { method: m.method, count: 0, amount: 0 };
									acc[m.method] = { method: m.method, count: p.count + m.count, amount: p.amount + m.amount };
									return acc;
								},
								{},
							),
					).sort((a, b) => b.amount - a.amount),
					byOutlet: rows
						.flatMap((r) =>
							(r.today?.byOutlet ?? []).map((o) => ({
								...o,
								name: rows.length > 1 ? `${o.name ?? "Outlet"} · ${r.name}` : o.name,
							})),
						)
						.sort((a, b) => b.sold - a.sold),
					topItems: Object.values(
						days
							.flatMap((d) => d.topItems)
							.reduce<Record<string, VenueToday["topItems"][number]>>((acc, i) => {
								const p = acc[i.name];
								acc[i.name] = p
									? { ...p, quantity: p.quantity + i.quantity, revenue: p.revenue + i.revenue }
									: { ...i };
								return acc;
							}, {}),
					)
						.sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
						.slice(0, 5),
					openTabs: {
						count: sum(days.map((d) => d.openTabs.count)),
						value: sum(days.map((d) => d.openTabs.value)),
						oldestAt:
							days
								.map((d) => d.openTabs.oldestAt)
								.filter((x): x is string => !!x)
								.sort()[0] ?? null,
						staleHours: days[0].openTabs.staleHours,
						staleCount: sum(days.map((d) => d.openTabs.staleCount)),
						stale: days.flatMap((d) => d.openTabs.stale),
					},
					unpaid: {
						count: sum(days.map((d) => d.unpaid.count)),
						amount: sum(days.map((d) => d.unpaid.amount)),
					},
					voids: {
						count: sum(days.map((d) => d.voids.count)),
						amount: sum(days.map((d) => d.voids.amount)),
						latest: days
							.flatMap((d) => d.voids.latest)
							.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
							.slice(0, 10),
					},
					priceChangesWaiting: sum(days.map((d) => d.priceChangesWaiting)),
				};
	const some = <T,>(xs: (T[] | null)[]) =>
		xs.every((x) => x === null) ? null : xs.flatMap((x) => x ?? []);
	return {
		hotelId: "all",
		name: "All venues",
		today: merged,
		tills: some(
			rows.map((r) =>
				r.tills
					? r.tills.map((t) => ({ ...t, openedBy: rows.length > 1 ? `${t.openedBy} (${r.name})` : t.openedBy }))
					: null,
			),
		),
		onShift: some(rows.map((r) => r.onShift)),
		rota: rows.every((r) => r.rota === null) ? null : sum(rows.map((r) => r.rota ?? 0)),
		terminals: some(rows.map((r) => r.terminals)),
	};
}

function pct(now: number, then: number): number | null {
	if (then <= 0) return null;
	return Math.round(((now - then) / then) * 1000) / 10;
}

/**
 * The venue section: a location picker when there are several venues (owner), the KPI row, then money, outlets, top items, tills,
 * staff, voids and (manager) what needs attention.
 */
export function VenueTodaySection({
	locations,
	initial,
	attention,
	reportsHref = "/dashboard/reports",
}: {
	locations: VenueLocationToday[];
	/** The hotelId shown first ("all" for every venue). */
	initial?: string;
	/** The manager's "Needs attention" items (absent for the owner). */
	attention?: AttentionItem[];
	reportsHref?: string;
}) {
	const [pick, setPick] = useState(
		initial && (initial === "all" || locations.some((l) => l.hotelId === initial))
			? initial
			: locations.length > 1
				? "all"
				: (locations[0]?.hotelId ?? "all"),
	);
	if (locations.length === 0) return null;
	const shown =
		pick === "all" ? combine(locations) : (locations.find((l) => l.hotelId === pick) ?? locations[0]);
	const t = shown.today;
	const taken = t ? sum(t.takenByMethod.map((m) => m.amount)) : 0;
	const lw = t?.lastWeek ?? null;
	const change = t && lw ? pct(t.today.sold, lw.soFar) : null;
	const cards = (shown.terminals ?? []).filter((x) => x.method === "CARD");

	return (
		<div className="flex flex-col gap-4">
			{locations.length > 1 && (
				<div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Venue">
					{[{ hotelId: "all", name: "All venues" }, ...locations].map((l) => (
						<button
							key={l.hotelId}
							type="button"
							role="tab"
							aria-selected={pick === l.hotelId}
							onClick={() => setPick(l.hotelId)}
							className={`rounded-pill border px-3 py-[6px] text-[13px] font-semibold ${
								pick === l.hotelId
									? "border-brand bg-brand text-white"
									: "border-line bg-card text-ink-2 hover:bg-subtle"
							}`}
						>
							{l.name}
						</button>
					))}
				</div>
			)}

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<KpiCard
					label="Sales today"
					value={t ? nairaShort(t.today.sold) : "—"}
					icon={change !== null && change < 0 ? TrendingDownIcon : TrendingUpIcon}
					pill={
						change !== null ? (
							<StatusPill tone={change >= 0 ? "success" : "danger"} dot={false}>
								{change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
							</StatusPill>
						) : undefined
					}
					hint={
						!t
							? "Sales could not be read right now"
							: lw
								? `${nairaShort(lw.soFar)} by this time last ${fmtDate(lw.date, "EEEE")} · ${plural(t.today.sales, "sale")}`
								: t.today.sales === 0
									? "No sales yet today"
									: `${plural(t.today.sales, "sale")} · no sales the same day last week to compare`
					}
				/>
				<KpiCard
					label="Money taken today"
					value={t ? nairaShort(taken) : "—"}
					icon={WalletIcon}
					hint={
						t
							? taken > 0
								? `${plural(sum(t.takenByMethod.map((m) => m.count)), "payment")} at the outlets`
								: "Nothing taken yet today"
							: "Payments could not be read right now"
					}
				/>
				<KpiCard
					label="Open tabs"
					value={t ? t.openTabs.count : "—"}
					icon={ReceiptIcon}
					pill={
						t && t.openTabs.staleCount > 0 ? (
							<StatusPill tone="warning" dot={false}>
								{t.openTabs.staleCount} over {t.openTabs.staleHours}h
							</StatusPill>
						) : undefined
					}
					hint={
						t
							? t.openTabs.count > 0
								? `${naira(t.openTabs.value)} still to pay`
								: "No tabs open"
							: "Tabs could not be read right now"
					}
				/>
				<KpiCard
					label="Voids today"
					value={t ? t.voids.count : "—"}
					icon={BanIcon}
					hint={
						t
							? t.voids.count > 0
								? `${naira(t.voids.amount)} taken off`
								: "Nothing voided today"
							: "Voids could not be read right now"
					}
				/>
			</div>

			{attention && (
				<SectionCard
					title="Needs attention"
					subtitle="Old tabs, unpaid sales, price changes, stock counts and low stock"
					count={attention.length}
				>
					{attention.length === 0 ? (
						<EmptyState title="Nothing needs attention" hint="Old tabs, unpaid sales and stock waiting on you show here." />
					) : (
						<ul>
							{attention.map((a, i) => (
								<li
									key={a.key}
									className={`flex items-center gap-3 py-[10px] ${i < attention.length - 1 ? "border-b border-line" : ""}`}
								>
									<span
										className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] ${
											a.tone === "danger"
												? "bg-danger-soft text-danger"
												: a.tone === "warning"
													? "bg-warning-soft text-warning"
													: "bg-info-soft text-info"
										}`}
									>
										{a.tone === "danger" ? <AlertTriangleIcon className="size-4" /> : <FlagIcon className="size-4" />}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
										<p className="truncate text-xs text-ink-3">{a.detail}</p>
									</div>
									<Link
										href={a.href}
										className="shrink-0 rounded-pill bg-subtle px-3 py-1 text-[12px] font-semibold text-ink-2 hover:bg-brand-soft hover:text-brand"
									>
										{a.cta}
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			)}

			<div className="grid gap-4 lg:grid-cols-3">
				<SectionCard
					title="Money taken by method"
					subtitle="Paid at the outlets today"
					action={{ label: "Reports", href: reportsHref }}
					bodyClassName="gap-2 pt-2"
				>
					{!t ? (
						<p className="text-[13px] text-ink-3">Payments could not be read right now.</p>
					) : t.takenByMethod.length === 0 ? (
						<p className="text-[13px] text-ink-3">No money taken yet today.</p>
					) : (
						<ul className="divide-y divide-line">
							{t.takenByMethod.map((m) => (
								<li key={m.method} className="flex flex-col py-2 text-[13px]">
									<span className="flex items-center gap-2">
										<span className="flex-1 font-semibold text-ink">{METHOD_LABEL[m.method] ?? m.method}</span>
										<span className="text-xs text-ink-3">{m.count}×</span>
										<span className="font-bold text-ink">{naira(m.amount)}</span>
									</span>
									{m.method === "CARD" &&
										cards.map((c) => (
											<span key={c.terminalId ?? "none"} className="flex items-center gap-2 pl-3 text-xs text-ink-3">
												<CreditCardIcon className="size-3" />
												<span className="flex-1 truncate">{c.terminal ?? "Card without a POS"}</span>
												<span>{naira(c.amount)}</span>
											</span>
										))}
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Sales by outlet" subtitle="Today · open tabs count once settled" bodyClassName="gap-2 pt-2">
					{!t ? (
						<p className="text-[13px] text-ink-3">Sales could not be read right now.</p>
					) : t.byOutlet.filter((o) => o.sales > 0 || o.cancelled > 0).length === 0 ? (
						<p className="text-[13px] text-ink-3">No sales yet today.</p>
					) : (
						<ul className="divide-y divide-line">
							{t.byOutlet
								.filter((o) => o.sales > 0 || o.cancelled > 0)
								.map((o) => (
									<li key={`${o.outletId}-${o.name}`} className="flex items-center gap-3 py-2 text-[13px]">
										<span className="min-w-0 flex-1">
											<span className="block truncate font-semibold text-ink">{o.name}</span>
											<span className="block text-xs text-ink-3">
												{plural(o.sales, "sale")} · {nairaShort(o.paid)} paid
												{o.unpaid > 0 ? ` · ${nairaShort(o.unpaid)} to pay` : ""}
												{o.cancelled ? ` · ${o.cancelled} cancelled` : ""}
											</span>
										</span>
										<span className="font-bold text-ink">{naira(o.sold)}</span>
									</li>
								))}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Top 5 items today" subtitle="Most sold" bodyClassName="gap-2 pt-2">
					{!t ? (
						<p className="text-[13px] text-ink-3">Items could not be read right now.</p>
					) : t.topItems.length === 0 ? (
						<p className="text-[13px] text-ink-3">No sales yet today.</p>
					) : (
						<ol className="divide-y divide-line">
							{t.topItems.map((i, n) => (
								<li key={`${i.menuItemId}-${i.name}`} className="flex items-center gap-3 py-2 text-[13px]">
									<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
										{n + 1}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold text-ink">{i.name}</span>
										<span className="block text-xs text-ink-3">{i.category}</span>
									</span>
									<span className="text-xs text-ink-3">×{i.quantity}</span>
									<span className="font-bold text-ink">{nairaShort(i.revenue)}</span>
								</li>
							))}
						</ol>
					)}
				</SectionCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<SectionCard
					title="Tills"
					subtitle={
						shown.tills
							? `${shown.tills.filter((x) => x.status === "OPEN").length} open · ${shown.tills.filter((x) => x.status === "CLOSED").length} closed today`
							: "Tills could not be read right now"
					}
					bodyClassName="gap-2 pt-2"
				>
					{!shown.tills ? null : shown.tills.length === 0 ? (
						<p className="text-[13px] text-ink-3">No till opened today.</p>
					) : (
						<ul className="divide-y divide-line">
							{shown.tills.map((x) => (
								<li key={x.id} className="flex items-center gap-3 py-2 text-[13px]">
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold text-ink">
											{x.openedBy} · {x.role.toLowerCase().replace(/_/g, " ")}
										</span>
										<span className="block text-xs text-ink-3">
											{x.status === "OPEN"
												? `Open since ${fmtTime(x.openedAt)} · expected ${naira(x.expected)}`
												: `Closed ${fmtTime(x.closedAt)} · counted ${naira(x.counted ?? 0)}${
														x.variance ? ` · ${x.variance > 0 ? "over" : "short"} ${naira(Math.abs(x.variance))}` : " · balanced"
													}`}
										</span>
									</span>
									<StatusPill tone={x.status === "OPEN" ? "success" : "grey"}>
										{x.status === "OPEN" ? "Open" : "Closed"}
									</StatusPill>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Staff on shift now"
					subtitle={
						shown.onShift
							? `${plural(shown.onShift.length, "person", "people")} clocked in${
									shown.rota !== null ? ` · ${shown.rota} on today's rota` : ""
								}`
							: "The clock could not be read right now"
					}
					bodyClassName="gap-2 pt-2"
				>
					{!shown.onShift ? null : shown.onShift.length === 0 ? (
						<p className="text-[13px] text-ink-3">Nobody is clocked in right now.</p>
					) : (
						<ul className="divide-y divide-line">
							{shown.onShift.map((p) => (
								<li key={p.userId} className="flex items-center gap-3 py-2 text-[13px]">
									<UsersIcon className="size-4 shrink-0 text-ink-3" />
									<span className="min-w-0 flex-1 truncate font-semibold text-ink">{p.name}</span>
									<span className="flex items-center gap-1 text-xs text-ink-3">
										<ClockIcon className="size-3" /> since {fmtTime(p.since)}
									</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard title="Voids & cancellations today" subtitle="Who took what off, and why" bodyClassName="gap-2 pt-2">
					{!t ? (
						<p className="text-[13px] text-ink-3">Voids could not be read right now.</p>
					) : t.voids.latest.length === 0 ? (
						<p className="text-[13px] text-ink-3">Nothing voided or cancelled today.</p>
					) : (
						<ul className="divide-y divide-line">
							{t.voids.latest.map((v) => (
								<li key={`${v.orderId}-${v.kind}-${v.item ?? ""}-${v.at}`} className="flex items-center gap-3 py-2 text-[13px]">
									<span className="min-w-0 flex-1">
										<span className="block truncate font-semibold text-ink">
											{v.kind === "ORDER" ? `Sale ${v.number} cancelled` : `${v.quantity}× ${v.item} off ${v.number}`}
										</span>
										<span className="block truncate text-xs text-ink-3">
											{v.by ?? "Not recorded"} · {fmtTime(v.at)}
											{v.reason ? ` · ${v.reason}` : ""}
										</span>
									</span>
									<span className="font-bold text-ink">{naira(v.amount)}</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>
		</div>
	);
}
