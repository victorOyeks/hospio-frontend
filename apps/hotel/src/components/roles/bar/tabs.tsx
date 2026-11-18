"use client";

import {
	ArrowRightLeftIcon,
	CreditCardIcon,
	PlusIcon,
	ReceiptIcon,
	XIcon,
	ReceiptTextIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtTime, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { OutletMark } from "@hospio/ui/shared/outlet-mark";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	addOrderLines,
	cancelOrderLine,
	chargeOrderToRoom,
	moveTab,
	readOrder,
	sendOrder,
	setLinesStatus,
	startOrder,
} from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BookingRow,
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OrderRow,
	OutletRow,
	OutletSettingsRow,
	TerminalRow,
} from "@hospio/api/data/types";
import {
	type CartLine,
	MenuPicker,
	cartTotal,
} from "../shared-staff/menu-picker";
import {
	ReasonModal,
	activeHappyHour,
	liveLines,
	madeElsewhere,
	roomLabel,
	stationName,
	stationStatus,
	sitsAt,
	toLineInputs,
	useOrderRows,
} from "../shared-staff/outlet-shared";
import { BillSheet } from "../shared-staff/bill-sheet";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";
import {
	BigButton,
	BoardCard,
	ShiftPill,
	minutesSince,
} from "../shared-staff/tablet";

type Sub = "add" | "move" | "pay" | "room" | "new" | "bill" | null;

/**
 * Who is at the screen. "bar": the bar's tabs, as before. "waiter" (hospio-backend docs/plan-venue-type.md, phase 3): the tabs
 * and orders the waiter opened at the outlet, with New tab, Add items (sent to the bar or kitchen at once), Served and Move;
 * payment only where Hotel setup lets waiters take it. "cashier": every open tab and sale that owes money, to take payment.
 */
export type TabsMode = "bar" | "waiter" | "cashier";

/** Menu, categories and happy hours of one outlet: what "Add drinks" offers on a tab of that outlet. */
export type OutletKit = {
	menu: MenuItemRow[];
	categories: CategoryRow[];
	happyHours: HappyHourRow[];
};

/**
 * Bar · Tabs (3262:12915), titled with the outlet ("Patio Lounge · tabs"), tab details (3262:13019), move tab
 * (3262:13168), settle by payment or by room. With `all` (a manager or lead picked "All outlets") the tabs of every bar
 * outlet show together, each marked with its outlet, with a filter by outlet; a tab opened there works with its own
 * outlet's menu, seats and POS terminal.
 */
export function BarTabsScreen({
	outlet: home,
	orders,
	closedTabs,
	menu: homeMenu,
	categories: homeCategories,
	happyHours: homeHappyHours,
	inHouse,
	settings,
	terminals,
	outlets = [],
	deskOutlets = [],
	all = false,
	kits = {},
	mode = "bar",
}: {
	mode?: TabsMode;
	/** The hotel's outlets: names the outlet that makes a line (the kitchen's pepper soup). */
	outlets?: { id: string; name: string }[];
	/** The bar's outlets (BAR kind); with more than one, each gets its colour and icon. */
	deskOutlets?: OutletRow[];
	/** Every bar outlet's tabs at once ("All outlets"). */
	all?: boolean;
	/** Per outlet id, for a tab of another outlet in the all-outlets view. */
	kits?: Record<string, OutletKit>;
	outlet: OutletRow | null;
	orders: OrderRow[];
	closedTabs: number;
	menu: MenuItemRow[];
	categories: CategoryRow[];
	happyHours: HappyHourRow[];
	inHouse: BookingRow[];
	settings: OutletSettingsRow;
	terminals: TerminalRow[];
}) {
	const { rows, put, apply } = useOrderRows(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [orderParam, setOrderParam] = useQueryState("order", parseAsString);
	const [sub, setSub] = useState<Sub>(null);
	const [lines, setLines] = useState<CartLine[]>([]);
	const [to, setTo] = useState("");
	const [roomId, setRoomId] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [newTable, setNewTable] = useState("");
	const [newName, setNewName] = useState("");
	const waiter = mode === "waiter";
	const cashier = mode === "cashier";
	const floor = waiter || cashier;
	/** A waiter collects only where Hotel setup allows it; the bar and the cashier always do. */
	const canPay = !waiter || settings.waitersTakePayment;
	const [cancel, setCancel] = useState<{ lineId: string; name: string } | null>(
		null,
	);
	const { run, pending } = useAction();
	const [only, setOnly] = useQueryState("outlet", parseAsString);
	const peers = deskOutlets.map((o) => o.id);
	const LIMIT = settings.tabLimit;

	const allTabs = rows.filter(
		(o) =>
			(floor ? !o.ticketFrom : o.kind === "TAB") &&
			o.status !== "CLOSED" &&
			o.status !== "CANCELLED" &&
			// The cashier's list is what still owes money.
			(!cashier || !(o.paid || o.chargedToRoom)),
	);
	const tabs =
		all && only ? allTabs.filter((o) => o.outletId === only) : allTabs;
	const openId = open ?? orderParam;
	const current = rows.find((o) => o.id === openId) ?? null;
	// A tab works with its own outlet (all-outlets view); otherwise the outlet picked in "Serving at".
	const outlet =
		(current?.outletId &&
			deskOutlets.find((o) => o.id === current.outletId)) ||
		home;
	const kit = (outlet && outlet.id !== home?.id && kits[outlet.id]) || {
		menu: homeMenu,
		categories: homeCategories,
		happyHours: homeHappyHours,
	};
	const { menu, categories, happyHours } = kit;
	const outletName = outlet?.name ?? "Bar";
	const markKind = (id: string | undefined) =>
		deskOutlets.find((o) => o.id === id)?.kind === "BAR" || !floor
			? "BAR"
			: "KITCHEN";
	const mark = (id: string | undefined, name?: string) => (
		<OutletMark id={id} peers={peers} kind={markKind(id)} title={name} />
	);
	const what = cashier ? "sale" : "tab";
	const close = () => {
		void setOpen(null);
		void setOrderParam(null);
		setSub(null);
		setMessage(null);
	};
	const guest = inHouse.find((b) => b.id === roomId);
	const tables = (outlet?.tables ?? []).filter((t) => t.active);
	const free = tables.filter((t) => !tabs.some((o) => sitsAt(o, t)));
	const discount = activeHappyHour(happyHours)?.discountPct ?? 0;
	const atLimit = (o: OrderRow) => o.total >= LIMIT;
	/** Paid or on a room, kept open only while another outlet (the kitchen) finishes its part: nothing left to collect. */
	const settled = (o: OrderRow) => o.paid || o.chargedToRoom;
	const unpaid = tabs.filter((o) => !settled(o));
	const elsewhere = (l: { preparedAt?: string }) =>
		madeElsewhere(l, outlet?.id);
	/**
	 * A waiter serves what is ready; at a bar the drinks made there are served as soon as they are sent (the bar pours, nobody
	 * marks them ready). The bar's own screen serves only what another outlet made, as before.
	 */
	const canServe = (l: { preparedAt?: string; status?: string }) =>
		waiter
			? l.status === "READY" ||
				(l.status === "SENT" && !elsewhere(l) && outlet?.kind === "BAR")
			: elsewhere(l) && l.status === "READY";
	const tracked = (l: { preparedAt?: string }) => floor || elsewhere(l);
	const lineStatus = (l: { preparedAt?: string; status?: string }) =>
		elsewhere(l)
			? stationStatus(l.status ?? "NEW", station(l))
			: {
					label:
						l.status === "SENT"
							? outlet?.kind === "BAR"
								? "Sent to the bar"
								: "Sent to the kitchen"
							: l.status === "READY"
								? "Ready · collect"
								: l.status === "SERVED"
									? "Served"
									: "Not sent",
					tone:
						l.status === "READY" || l.status === "SERVED"
							? ("success" as const)
							: l.status === "SENT"
								? ("info" as const)
								: ("grey" as const),
				};
	const station = (l: { preparedAt?: string }) =>
		stationName(outlets, l.preparedAt);
	const serveLine = (o: OrderRow, lineId: string, name: string) =>
		run(
			() => setLinesStatus(o.id, [lineId], "SERVED", outletName),
			`${name} served`,
			(a) =>
				apply(o.id, a, (x) => ({
					...x,
					lines: x.lines.map((l) =>
						l.id === lineId ? { ...l, status: "SERVED" } : l,
					),
				})),
		);

	return (
		<>
			<PageHeader
				title={
					cashier
						? all
							? "All outlets · to pay"
							: `${home?.name ?? "Outlet"} · to pay`
						: waiter
							? `${home?.name ?? "Outlet"} · my tabs`
							: all
								? "All outlets · tabs"
								: `${home?.name ?? "Bar"} · tabs`
				}
				mark={
					all ? undefined : (
						<OutletMark
							id={home?.id}
							peers={peers}
							kind={markKind(home?.id)}
							size="lg"
							title={home?.name}
						/>
					)
				}
				subtitle={
					cashier
						? `${plural(tabs.length, "sale")} to collect · ${naira(unpaid.reduce((s, o) => s + o.total - (o.paidAmount ?? 0), 0))} still to pay`
						: `${plural(tabs.length, "tab")} open · ${naira(unpaid.reduce((s, o) => s + o.total, 0))} unpaid · limit ${naira(LIMIT)} per tab`
				}
			>
				{waiter && home && settings.tabs && (
					<BigButton
						onClick={() => {
							setLines([]);
							setNewTable("");
							setNewName("");
							setMessage(null);
							setSub("new");
						}}
					>
						<PlusIcon className="size-5" /> New tab
					</BigButton>
				)}
				<ShiftPill until="1am" />
			</PageHeader>
			{!settings.tabs && (
				<Note tone="warning">
					Tabs are switched off in Hotel setup → Restaurant & bar. Existing tabs
					can still be settled.
				</Note>
			)}
			{all && (
				<PillTabs
					value={only ?? "all"}
					onChange={(k) => void setOnly(k === "all" ? null : k)}
					tabs={[
						{ key: "all", label: "All outlets", count: allTabs.length },
						...deskOutlets.map((o) => ({
							key: o.id,
							label: o.name,
							count: allTabs.filter((t) => t.outletId === o.id).length,
						})),
					]}
				/>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label={cashier ? "To collect" : waiter ? "My open tabs" : "Open tabs"}
					value={tabs.length}
					icon={ReceiptIcon}
				/>
				<KpiCard
					label={cashier ? "Still to pay" : "Unpaid"}
					value={naira(
						unpaid.reduce(
							(s, o) => s + o.total - (cashier ? (o.paidAmount ?? 0) : 0),
							0,
						),
					)}
					icon={ReceiptIcon}
				/>
				<KpiCard
					label="At the limit"
					value={tabs.filter(atLimit).length}
					icon={ReceiptIcon}
					hint="Must pay before adding"
				/>
				<KpiCard label="Closed tonight" value={closedTabs} icon={ReceiptIcon} />
			</div>
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
				{tabs.length === 0 && (
					<Note tone="success" className="col-span-full">
						{cashier
							? "Nothing to collect right now."
							: waiter
								? "You have no open tabs. Tap New tab to start one."
								: "No open tabs."}
					</Note>
				)}
				{tabs.map((o) => (
					<BoardCard
						key={o.id}
						label={`Open the ${what} at ${o.tableNo ?? "the bar"}`}
						onClick={() => void setOpen(o.id)}
						accent={atLimit(o) ? "warning" : "brand"}
					>
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-2 text-[15px] font-bold text-ink">
								{mark(o.outletId, o.outlet)}
								{o.tableNo ?? "Walk-up"}
							</span>
							{/* The clock moves between the server render and hydration. */}
							<span className="text-xs text-ink-3" suppressHydrationWarning>
								{minutesSince(o.openedAt)} min
							</span>
						</div>
						{all && (
							<p className="text-xs font-semibold text-ink-3">{o.outlet}</p>
						)}
						<p className="text-[13px] text-ink-2">
							{cashier ? `${o.number} · ${o.openedBy} · ` : ""}
							{o.guestName ?? "No name"}
							{o.roomNumber ? ` · room ${o.roomNumber}` : ""}
						</p>
						<ul className="text-[15px] text-ink">
							{liveLines(o).map((l, i) => (
								<li key={l.id ?? i}>
									{l.qty} {l.name}
									{tracked(l) && !cashier && l.status !== "SERVED" ? (
										<StatusPill
											tone={lineStatus(l).tone}
											dot={false}
											className="ml-1"
										>
											{lineStatus(l).label}
										</StatusPill>
									) : null}
								</li>
							))}
						</ul>
						<div className="flex items-center justify-between">
							<span className="text-[17px] font-bold text-ink">
								{naira(o.total)}
							</span>
							{settled(o) ? (
								<StatusPill tone="success">
									{o.chargedToRoom ? "On the room" : "Paid"}
								</StatusPill>
							) : atLimit(o) ? (
								<StatusPill tone="danger">At limit</StatusPill>
							) : (
								<StatusPill tone="brand">Open</StatusPill>
							)}
						</div>
					</BoardCard>
				))}
			</div>

			<SidePanel
				open={!!current && !sub}
				onOpenChange={(o) => !o && close()}
				title={
					current
						? `${current.tableNo ?? "Walk-up"} · ${current.guestName ?? "tab"}`
						: ""
				}
				subtitle={
					current
						? `${all ? `${current.outlet} · ` : ""}${current.number} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}`
						: undefined
				}
				icon={ReceiptIcon}
				footer={
					current &&
					current.status !== "CLOSED" &&
					current.status !== "CANCELLED" &&
					!settled(current) ? (
						<>
							{!cashier && (
								<BigButton
									tone="ghost"
									onClick={() => {
										setTo("");
										setSub("move");
									}}
								>
									<ArrowRightLeftIcon className="size-5" /> Move
								</BigButton>
							)}
							{!cashier && (
								<BigButton
									tone="secondary"
									onClick={() => {
										setLines([]);
										setMessage(null);
										setSub("add");
									}}
								>
									<PlusIcon className="size-5" />{" "}
									{waiter ? "Add items" : "Add drinks"}
								</BigButton>
							)}
							<BigButton tone="secondary" onClick={() => setSub("bill")}>
								<ReceiptTextIcon className="size-5" />{" "}
								{(current.splitParts ?? 0) > 0
									? "Open the split bill"
									: canPay
										? "Split or discount"
										: "Discount or void"}
							</BigButton>
							{canPay && (
								<BigButton onClick={() => setSub((current.splitParts ?? 0) > 0 ? "bill" : "pay")}>
									<CreditCardIcon className="size-5" />{" "}
									{cashier ? "Take payment" : "Close & pay"}
								</BigButton>
							)}
						</>
					) : (
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{message && <Note tone="danger">{message}</Note>}
						{waiter && !canPay && !settled(current) && (
							<Note tone="info">
								The cashier takes the payment for this tab: tell them the table
								or the number {current.number}.
							</Note>
						)}
						{settled(current) &&
							current.status !== "CLOSED" &&
							current.status !== "CANCELLED" && (
								<Note tone="info">
									{current.chargedToRoom ? "Charged to the room" : "Paid"}
									{(() => {
										const away = current.lines.find(
											(l) =>
												elsewhere(l) &&
												l.status !== "SERVED" &&
												l.status !== "CANCELLED",
										);
										return away
											? `. ${station(away)} is still making part of it: serve it when it is ready and the tab closes.`
											: ". Serve what is left and the tab closes.";
									})()}
								</Note>
							)}
						{!cashier && !settled(current) && atLimit(current) && (
							<Note tone="danger">
								This tab has reached the {naira(LIMIT)} limit. Take a payment or
								settle it before adding more; a manager can allow more.
							</Note>
						)}
						<DetailList
							columns={2}
							items={[
								{ label: "Seat", value: current.tableNo ?? "Walk-up" },
								{ label: "Guest", value: current.guestName ?? "—" },
								{ label: "Opened", value: fmtTime(current.openedAt) },
								{
									label: "Status",
									value: (
										<StatusPill
											tone={
												current.status === "CLOSED"
													? "success"
													: current.status === "CANCELLED"
														? "danger"
														: "brand"
											}
										>
											{current.status === "CLOSED"
												? "Closed"
												: current.status === "CANCELLED"
													? "Cancelled"
													: "Open"}
										</StatusPill>
									),
								},
							]}
						/>
						<PanelSection
							title={
								current.lines.some((l) => l.preparedAt) ? "Items" : "Drinks"
							}
						>
							<ul className="divide-y divide-line rounded-control border border-line">
								{current.lines.map((l, i) => (
									<li
										key={l.id ?? i}
										className="flex items-center gap-3 px-4 py-2"
									>
										<span
											className={`min-w-0 flex-1 text-[15px] text-ink ${l.status === "CANCELLED" ? "line-through opacity-60" : ""}`}
										>
											{l.qty} × {l.name}
											{l.options ? (
												<span className="block text-xs text-ink-3">
													{l.options}
												</span>
											) : null}
											{(l.discount ?? 0) > 0 ? (
												<span className="block text-xs text-success">
													Happy hour −{naira(l.discount ?? 0)}
												</span>
											) : null}
											{elsewhere(l) && l.status === "READY" ? (
												<span className="block text-xs text-success">
													Ready in {station(l)} · collect it
												</span>
											) : null}
										</span>
										<span className="text-[13px] text-ink-2">
											{naira(l.price * l.qty)}
										</span>
										{tracked(l) &&
											!cashier &&
											l.status !== "CANCELLED" &&
											(canServe(l) && l.id ? (
												<button
													type="button"
													disabled={pending}
													onClick={() =>
														serveLine(current, l.id ?? "", l.name)
													}
													className="rounded-control border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-subtle"
												>
													Served
												</button>
											) : (
												<StatusPill tone={lineStatus(l).tone} dot={false}>
													{lineStatus(l).label}
												</StatusPill>
											))}
										{l.status !== "CANCELLED" &&
											l.id &&
											!cashier &&
											// A waiter takes off only what was not sent yet; after that it is a manager's void.
											(!waiter || l.status === "NEW") &&
											!current.paid &&
											!current.chargedToRoom && (
												<button
													type="button"
													aria-label={`Remove ${l.name}`}
													onClick={() =>
														setCancel({ lineId: l.id ?? "", name: l.name })
													}
													className="rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
												>
													<XIcon className="size-4" />
												</button>
											)}
									</li>
								))}
							</ul>
							<TotalsList
								rows={[
									{ label: "Subtotal", value: naira(current.subtotal) },
									...((current.discount ?? 0) > 0
										? [
												{
													label: "Happy hour discount",
													value: `−${naira(current.discount ?? 0)}`,
												},
											]
										: []),
									{
										label: `VAT ${settings.vatPct}%${settings.pricesIncludeTax ? " (included)" : ""}`,
										value: naira(current.tax),
									},
									...((current.serviceCharge ?? 0) > 0
										? [{ label: "Service charge", value: naira(current.serviceCharge ?? 0) }]
										: []),
									{ label: "Total", value: naira(current.total), strong: true },
								]}
							/>
						</PanelSection>
						{inHouse.length > 0 &&
							settings.roomCharge &&
							!settled(current) &&
							current.status !== "CLOSED" &&
							current.status !== "CANCELLED" && (
								<BigButton
									tone="secondary"
									onClick={() => {
										setRoomId("");
										setMessage(null);
										setSub("room");
									}}
								>
									Charge the tab to a room instead
								</BigButton>
							)}
					</div>
				)}
			</SidePanel>

			<SidePanel
				open={sub === "add" && !!current}
				onOpenChange={(o) => !o && setSub(null)}
				title={waiter ? "Add items" : "Add drinks"}
				subtitle={
					current
						? `${current.tableNo ?? "Walk-up"} · ${naira(current.total)} so far`
						: undefined
				}
				icon={PlusIcon}
				width="lg"
				footerInfo={
					lines.length ? `+${naira(cartTotal(lines, discount))}` : undefined
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							disabled={lines.length === 0}
							onClick={() =>
								current &&
								run(
									async () => {
										const r = await addOrderLines(
											current.id,
											toLineInputs(lines, discount),
											outletName,
										);
										// A tab over its limit is refused with the service's own sentence; keep it on the details panel.
										if (!r.ok) setMessage(r.error);
										// Something another outlet makes (the kitchen's pepper soup) goes there as a ticket now.
										// A waiter's items always go to whoever makes them (the bar or the kitchen) at once.
										if (r.ok && (waiter || lines.some((l) => elsewhere(l.item)))) {
											const sent = await sendOrder(current.id, outletName);
											if (!sent.ok) return sent;
											return { ok: true as const, data: sent.data ?? r.data };
										}
										return r;
									},
									waiter && !lines.some((l) => elsewhere(l.item))
										? `Added to the tab · sent to the ${outlet?.kind === "BAR" ? "bar" : "kitchen"}`
										: lines.some((l) => elsewhere(l.item))
										? `Added to the tab · sent to ${Array.from(new Set(lines.filter((l) => elsewhere(l.item)).map((l) => station(l.item)))).join(", ")}`
										: "Added to the tab",
									(a) => {
										apply(current.id, a, (x) => {
											const add = cartTotal(lines, discount);
											return {
												...x,
												lines: [
													...x.lines,
													...lines.map((l) => ({
														name: l.item.name,
														qty: l.qty,
														price: l.item.price,
														options: l.option,
														preparedAt: l.item.preparedAt,
														status: waiter || elsewhere(l.item) ? "SENT" : "NEW",
													})),
												],
												subtotal: x.subtotal + add,
												total: x.total + add,
											};
										});
										setSub(null);
									},
								)
							}
						>
							Add to tab
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{message && <Note tone="danger">{message}</Note>}
					<MenuPicker
						menu={menu}
						categories={categories}
						lines={lines}
						onChange={setLines}
						discountPct={discount}
					/>
				</div>
			</SidePanel>

			<SidePanel
				open={sub === "new"}
				onOpenChange={(o) => !o && setSub(null)}
				title="New tab"
				subtitle={outletName}
				icon={PlusIcon}
				width="lg"
				footerInfo={
					lines.length ? naira(cartTotal(lines, discount)) : undefined
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={lines.length === 0}
							onClick={() => {
								if (!outlet) return;
								if (settings.tabNameRequired && !newTable && !newName.trim()) {
									setMessage("Pick the table or put the guest's name on the tab");
									return;
								}
								const seat = free.find((t) => t.id === newTable);
								run(
									async () => {
										const r = await startOrder({
											outletId: outlet.id,
											outletName,
											kind: "TAB",
											tableId: seat?.id,
											tableNo: seat?.number,
											guestName: newName.trim() || undefined,
											lines: toLineInputs(lines, discount),
											send: true,
											vatPct: settings.vatPct,
											pricesIncludeTax: settings.pricesIncludeTax,
										});
										if (!r.ok) setMessage(r.error);
										return r;
									},
									`Tab opened${seat ? ` at ${seat.number}` : ""} · sent to the ${outlet.kind === "BAR" ? "bar" : "kitchen"}`,
									(a) => {
										if (a) {
											put(a);
											void setOpen(a.id);
										}
										setMessage(null);
										setSub(null);
									},
								);
							}}
						>
							Open tab & send
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{message && <Note tone="danger">{message}</Note>}
					<div className="grid gap-3 sm:grid-cols-2">
						<SelectField
							label="Table"
							value={newTable}
							onChange={setNewTable}
							options={free.map((t) => ({ value: t.id, label: t.number }))}
							placeholder={free.length ? "Pick a free table" : "No free table"}
						/>
						<TextField
							label={
								settings.tabNameRequired
									? "Guest's name (or pick a table)"
									: "Guest's name (optional)"
							}
							value={newName}
							onChange={setNewName}
							placeholder="Mr Ade"
						/>
					</div>
					<MenuPicker
						menu={menu}
						categories={categories}
						lines={lines}
						onChange={setLines}
						discountPct={discount}
					/>
				</div>
			</SidePanel>

			<Modal
				open={sub === "move"}
				onOpenChange={(o) => !o && setSub(null)}
				title="Move tab"
				subtitle="To another seat or table"
				icon={ArrowRightLeftIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!to}
							onClick={() =>
								current &&
								run(
									() => moveTab(current.id, to, outletName),
									`Tab moved to ${free.find((t) => t.id === to)?.number ?? "the new seat"}`,
									(a) => {
										apply(current.id, a, (x) => ({
											...x,
											tableId: to,
											tableNo: free.find((t) => t.id === to)?.number,
										}));
										setSub(null);
									},
								)
							}
						>
							Move
						</BigButton>
					</>
				}
			>
				<SelectField
					label="New seat"
					value={to}
					onChange={setTo}
					options={free
						.filter((t) => t.id !== current?.tableId)
						.map((t) => ({ value: t.id, label: t.number }))}
					placeholder="Pick a free seat"
				/>
			</Modal>

			<Modal
				open={sub === "room"}
				onOpenChange={(o) => !o && setSub(null)}
				title="Charge to a room"
				subtitle={current ? naira(current.total) : undefined}
				icon={ReceiptIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!guest}
							onClick={() =>
								current &&
								guest &&
								run(
									async () => {
										const r = await chargeOrderToRoom(
											current.id,
											guest.roomId,
											outletName,
										);
										if (!r.ok)
											setMessage(
												`Can't charge to room ${guest.roomNumber ?? ""}: ${r.error}`,
											);
										return r;
									},
									`${naira(current.total)} charged to room ${guest.roomNumber}`,
									(a) => {
										apply(current.id, a, (x) => ({
											...x,
											status: "CLOSED",
											chargedToRoom: true,
											roomNumber: guest.roomNumber,
											guestName: guest.guestName,
										}));
										close();
									},
								)
							}
						>
							Charge to room
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{message && <Note tone="danger">{message}</Note>}
					<SelectField
						label="Hotel guest"
						value={roomId}
						onChange={(v) => {
							setRoomId(v);
							setMessage(null);
						}}
						options={inHouse.map((b) => ({ value: b.id, label: roomLabel(b) }))}
						placeholder="Which room"
					/>
					{guest && (
						<WhatHappens
							items={[
								`The tab goes on ${guest.guestName}'s folio`,
								"It is refused if nobody is checked in to the room or its bill is closed",
								"The tab closes here",
							]}
						/>
					)}
				</div>
			</Modal>

			{/* The bill: split it and pay part by part, discounts, complimentary items, requests to a manager (phase 4). */}
			<BillSheet
				orderId={sub === "bill" && current ? current.id : null}
				onClose={() => {
					setSub(null);
					if (current)
						void readOrder(current.id, outletName).then((r) => {
							if (r.ok && r.data) put(r.data);
						});
				}}
				desk={waiter ? "WAITER" : cashier ? "CASHIER" : "BAR"}
				terminals={terminals}
				inHouse={inHouse}
				onChanged={(id) =>
					void readOrder(id, outletName).then((r) => {
						if (r.ok && r.data) put(r.data);
					})
				}
			/>

			<OrderPaymentPanel
				open={sub === "pay" && !!current}
				onOpenChange={(o) => !o && setSub(null)}
				desk={waiter ? "WAITER" : cashier ? "CASHIER" : "BAR"}
				terminals={terminals}
				payment={
					current
						? {
								orderId: current.id,
								guestName: current.guestName ?? "Bar guest",
								amount: current.balance ?? Math.max(current.total - (current.paidAmount ?? 0), 0),
								description: `Tab ${current.number}`,
								roomNumber: current.roomNumber,
								terminalId: outlet?.terminalId,
								tipAllowed: settings.recordTips,
								tipFor: current.openedBy,
							}
						: null
				}
				onDone={(p) => {
					if (!current) return;
					void readOrder(current.id, outletName).then((r) => {
						if (r.ok && r.data) put(r.data);
						else if (p.status === "APPROVED")
							apply(current.id, null, (x) => ({
								...x,
								status: "CLOSED",
								paid: true,
							}));
					});
				}}
				onFinish={close}
			/>

			<ReasonModal
				open={!!cancel}
				onOpenChange={(o) => !o && setCancel(null)}
				title={`Remove ${cancel?.name ?? "the drink"}?`}
				subtitle="It comes off the tab and the total is worked out again"
				confirmLabel="Remove"
				pending={pending}
				onConfirm={(reason) =>
					current &&
					cancel &&
					run(
						() =>
							cancelOrderLine(current.id, cancel.lineId, reason, outletName),
						(a) =>
							a?.status === "CANCELLED"
								? `${cancel.name} removed · nothing is left, so ${current.number} is cancelled`
								: "Removed from the tab",
						(a) => {
							if (a?.status === "CANCELLED") {
								// The last drink of a sale that is not a tab: fnb-service cancelled the sale with it (DEF-085).
								put(a);
								setCancel(null);
								close();
								return;
							}
							apply(current.id, a, (x) => ({
								...x,
								lines: x.lines.map((l) =>
									l.id === cancel.lineId ? { ...l, status: "CANCELLED" } : l,
								),
							}));
							setCancel(null);
						},
					)
				}
			/>
		</>
	);
}
