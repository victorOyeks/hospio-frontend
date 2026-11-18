"use client";

import {
	BanIcon,
	BedDoubleIcon,
	CreditCardIcon,
	PrinterIcon,
	ReceiptIcon,
	RotateCwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Note, Timeline, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	cancelOrder,
	chargeOrderToRoom,
	readOrder,
	readSale,
	setLinesStatus,
} from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import { lagosDate } from "@hospio/api/data/mappers/finance";
import type {
	BookingRow,
	OrderRow,
	SaleDetailView,
	SaleRow,
	SaleStatus,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	ReasonModal,
	madeElsewhere,
	roomLabel,
	stationName,
	stationStatus,
} from "./outlet-shared";
import { type Bill, readBill } from "@hospio/api/actions/bill";
import { BillSheet } from "./bill-sheet";
import { OrderPaymentPanel } from "./pos-payment";
import { BigButton } from "./tablet";

/** Where a sale stands, in words and colour. Codes never show raw. */
export const SALE_STATUS: Record<
	SaleStatus,
	{
		label: string;
		tone: "success" | "warning" | "danger" | "info" | "grey" | "brand";
	}
> = {
	PAID: { label: "Paid", tone: "success" },
	TO_PAY: { label: "To pay", tone: "warning" },
	PART_PAID: { label: "Part paid", tone: "warning" },
	ON_ROOM: { label: "On a room", tone: "brand" },
	CANCELLED: { label: "Cancelled", tone: "danger" },
	IN_PROGRESS: { label: "In progress", tone: "info" },
};

export const METHOD_LABEL: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card",
	TRANSFER: "Transfer",
	ROOM: "Room",
};
export const methodLabel = (m: string) =>
	METHOD_LABEL[m] ?? m.charAt(0) + m.slice(1).toLowerCase().replace(/_/g, " ");

/** "Table T3", "Room A107", "Takeaway", "Walk-up" */
export function saleWhere(s: Pick<SaleRow, "kind" | "tableNo" | "roomNumber">) {
	if (s.roomNumber) return `Room ${s.roomNumber}`;
	if (s.tableNo) return s.tableNo;
	if (s.kind === "TAKEAWAY") return "Takeaway";
	if (s.kind === "TAB") return "Tab";
	if (s.kind === "ROOM_SERVICE") return "Room service";
	return "Walk-up";
}

/** A sale opened on an earlier Lagos day that still owes money. */
export const fromEarlierDay = (s: Pick<SaleRow, "createdAt" | "status">) =>
	(s.status === "TO_PAY" || s.status === "PART_PAID") &&
	lagosDate(new Date(s.createdAt)) < lagosDate();

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type PayDesk = "BAR" | "KITCHEN" | "MANAGER" | "OWNER" | "WAITER" | "CASHIER";

/**
 * One sale (Sales screen, Recent sales on Bar today and Kitchen orders): who, where, every line with its
 * choices and cancellations, the money, each payment, the timeline. While it owes money the caller may
 * take payment (a part payment collects less than the balance), charge it to a guest's room or cancel it,
 * as fnb-service's `can` allows; the actions are the order routes the Tabs and Orders screens use. Only one
 * panel is open at a time: the payment and room steps replace the sale and come back to it.
 */
export function SalePanel({
	saleId,
	onClose,
	desk,
	terminals,
	inHouse,
	onChanged,
	outlets = [],
}: {
	saleId: string | null;
	/** The hotel's outlets: names the outlet that makes a line sold here (the kitchen's pepper soup at the patio). */
	outlets?: { id: string; name: string }[];
	onClose: () => void;
	/** The sale was paid, charged or cancelled here: a screen holding its own copy of the order reads it again. */
	onChanged?: (id: string) => void;
	/** The desk a payment is taken as; null when the caller takes no payments (finance). */
	desk: PayDesk | null;
	terminals: TerminalRow[];
	inHouse: BookingRow[];
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [sale, setSale] = useState<SaleDetailView | null>(null);
	/** The live order behind the sale, for lines another outlet makes: where each stands and serving it once ready. */
	const [order, setOrder] = useState<OrderRow | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [sub, setSub] = useState<null | "pay" | "room" | "cancel" | "bill">(null);
	/** The sale's bill while it is open: whether it is split, whether a tip can be added, what the caller may do on it. */
	const [bill, setBill] = useState<Bill | null>(null);
	const [roomPick, setRoomPick] = useState("");
	const [roomError, setRoomError] = useState<string | null>(null);
	const [waiting, setWaiting] = useState(false);
	const reqRef = useRef(0);

	const load = useCallback(async (id: string) => {
		const req = ++reqRef.current;
		setLoading(true);
		setError(null);
		const r = await readSale(id).catch(() => ({
			ok: false as const,
			error: "The sale could not be read",
		}));
		if (req !== reqRef.current) return null;
		setLoading(false);
		if (!r.ok) {
			setError(r.error);
			return null;
		}
		setSale(r.data);
		// Only a desk serves; a sale still open may hold lines another outlet makes (ticket there, served here once ready).
		const d = r.data;
		const open = !!d && d.sale.status !== "CANCELLED" && !d.timeline.closedAt;
		const o =
			desk && d && open
				? await readOrder(id, d.sale.outletName).catch(() => null)
				: null;
		if (req !== reqRef.current) return r.data;
		setOrder(o?.ok && o.data ? o.data : null);
		const b = desk && d && open ? await readBill(id).catch(() => null) : null;
		if (req !== reqRef.current) return r.data;
		setBill(b?.ok ? b.data : null);
		return r.data;
	}, []);

	useEffect(() => {
		setSub(null);
		setRoomError(null);
		setSale(null);
		setOrder(null);
		setBill(null);
		setWaiting(false);
		if (saleId) void load(saleId);
		else reqRef.current++;
	}, [saleId, load]);

	const s = sale?.sale;
	const guest = inHouse.find((b) => b.id === roomPick);
	const close = () => {
		setSub(null);
		onClose();
	};

	/** A payment lands on the sale when payment-service's event reaches fnb-service: read it again until it shows. */
	const afterPayment = async (before: number) => {
		if (!saleId) return;
		setWaiting(true);
		for (let i = 0; i < 8; i++) {
			const fresh = await load(saleId);
			if (fresh && fresh.paidAmount !== before) break;
			await new Promise((r) => setTimeout(r, 1000));
		}
		setWaiting(false);
		onChanged?.(saleId);
		router.refresh();
	};

	const openRoom = () => {
		const same = inHouse.find((b) => b.roomId && b.roomId === sale?.roomId);
		setRoomPick(same?.id ?? "");
		setRoomError(null);
		setSub("room");
	};

	const charge = () => {
		if (!sale || !s || !guest?.roomId) return;
		setRoomError(null);
		run(
			async () => {
				const r = await chargeOrderToRoom(s.id, guest.roomId, s.outletName);
				if (!r.ok) setRoomError(r.error);
				return r;
			},
			`${naira(sale.balance)} charged to room ${guest.roomNumber ?? ""}`,
			async () => {
				setSub(null);
				if (saleId) {
					await load(saleId);
					onChanged?.(saleId);
				}
			},
		);
	};

	const cancel = (reason: string) => {
		if (!s) return;
		run(
			() => cancelOrder(s.id, reason, s.outletName),
			`${s.number} cancelled`,
			async () => {
				setSub(null);
				if (saleId) {
					await load(saleId);
					onChanged?.(saleId);
				}
			},
		);
	};

	/** The order line behind a sale line when another outlet makes it and the order is still open. */
	const elsewhereLine = (lineId: string) => {
		if (!order || order.status === "CLOSED" || order.status === "CANCELLED")
			return null;
		const ol = order.lines.find((x) => x.id === lineId);
		return ol && madeElsewhere(ol, order.outletId) ? ol : null;
	};
	const pendingElsewhere =
		order?.lines.filter(
			(l) =>
				madeElsewhere(l, order.outletId) &&
				l.status !== "SERVED" &&
				l.status !== "CANCELLED",
		) ?? [];
	const serveLine = (lineId: string, name: string) => {
		if (!s || !order) return;
		run(
			() => setLinesStatus(order.id, [lineId], "SERVED", s.outletName),
			`${name} served`,
			async () => {
				if (saleId) {
					await load(saleId);
					onChanged?.(saleId);
				}
			},
		);
	};

	const settledLabel = (by?: string) =>
		by === "ROOM"
			? `Charged to room ${s?.roomNumber ?? ""}`.trim()
			: by === "COMPLIMENTARY"
				? "Closed as complimentary"
				: "Paid";

	const live = sale?.lines.filter((l) => l.status !== "CANCELLED") ?? [];
	/** A split stands on the bill: money is taken part by part, from the bill. */
	const splitStands = !!bill?.split && bill.split.parts.some((p) => p.status !== "PAID") && bill.balance > 0;
	const partPaid = (sale?.paidAmount ?? 0) > 0 && (sale?.balance ?? 0) > 0;
	const roomPart =
		sale && s?.status === "ON_ROOM"
			? sale.total - Math.min(sale.paidAmount, sale.total)
			: 0;

	return (
		<>
			<SidePanel
				open={!!saleId && sub === null}
				onOpenChange={(o) => !o && close()}
				title={s ? `${s.number} · ${s.outletName}` : "Sale"}
				subtitle={
					s
						? `${saleWhere(s)}${s.guestName ? ` · ${s.guestName}` : ""} · ${fmtWhen(s.createdAt)}`
						: loading
							? "Loading the sale…"
							: undefined
				}
				icon={ReceiptIcon}
				width="lg"
				footerInfo={
					sale && s
						? s.status === "CANCELLED"
							? "Cancelled · nothing to do"
							: sale.balance > 0
								? `${naira(sale.balance)} still to pay`
								: "Nothing left to pay"
						: undefined
				}
				footer={
					<>
						{sale && s && s.status !== "CANCELLED" && sale.payments.length > 0 && (
							<BigButton
								tone="secondary"
								onClick={() => window.open(`/receipt?sale=${encodeURIComponent(s.id)}`, "_blank", "noopener")}
							>
								<PrinterIcon className="size-5" /> Print receipt
							</BigButton>
						)}
						{sale?.can.cancel && (
							<BigButton tone="ghost" onClick={() => setSub("cancel")}>
								<BanIcon className="size-5" /> Cancel sale
							</BigButton>
						)}
						{sale?.can.chargeToRoom && desk && (
							<BigButton tone="secondary" onClick={openRoom}>
								<BedDoubleIcon className="size-5" /> Charge to room
							</BigButton>
						)}
						{desk && bill && sale && s && s.status !== "CANCELLED" && sale.balance > 0 &&
							(bill.can.split || bill.can.discount || bill.split) && (
								<BigButton tone="secondary" onClick={() => setSub("bill")}>
									<ReceiptIcon className="size-5" />{" "}
									{splitStands ? "Open the split bill" : bill.can.split ? "Split or discount" : "Discount or void"}
								</BigButton>
							)}
						{sale?.can.pay && desk && (
							<BigButton onClick={() => setSub(splitStands ? "bill" : "pay")}>
								<CreditCardIcon className="size-5" />{" "}
								{partPaid ? "Collect the balance" : "Take payment"}
							</BigButton>
						)}
						{!(sale?.can.pay && desk) && (
							<BigButton tone="secondary" onClick={close}>
								Close
							</BigButton>
						)}
					</>
				}
			>
				{error ? (
					<div className="flex flex-col items-start gap-3">
						<Note tone="danger">{error}</Note>
						<BigButton
							tone="secondary"
							onClick={() => saleId && void load(saleId)}
						>
							<RotateCwIcon className="size-5" /> Try again
						</BigButton>
					</div>
				) : !sale || !s ? (
					<p className="text-[13px] text-ink-3">Loading the sale…</p>
				) : (
					<div
						className={cn(
							"flex flex-col gap-5",
							s.status === "CANCELLED" && "opacity-80",
						)}
					>
						<div className="flex flex-wrap items-center gap-2">
							<StatusPill tone={SALE_STATUS[s.status].tone}>
								{s.status === "ON_ROOM" && s.roomNumber
									? `Room ${s.roomNumber}`
									: SALE_STATUS[s.status].label}
							</StatusPill>
							<span className="text-[13px] text-ink-2">
								Opened by {s.openedByName}
							</span>
							{waiting && (
								<span className="text-[13px] text-ink-3">
									Checking the payment…
								</span>
							)}
						</div>
						{fromEarlierDay(s) && (
							<Note tone="warning">
								From {fmtWhen(s.createdAt)}, an earlier shift: still owes{" "}
								{naira(sale.balance)}.
							</Note>
						)}
						{s.status === "CANCELLED" && (
							<Note tone="danger">
								Cancelled
								{sale.timeline.closedByName
									? ` by ${sale.timeline.closedByName}`
									: ""}
								{s.cancelReason ? `: ${s.cancelReason}` : ""}
							</Note>
						)}
						{sale.can.note && s.status !== "CANCELLED" && (
							<Note tone="info">{sale.can.note}</Note>
						)}
						{pendingElsewhere.length > 0 && (
							<Note tone="info">
								{capitalise(stationName(outlets, pendingElsewhere[0].preparedAt))}{" "}
								is making{" "}
								{pendingElsewhere.map((l) => l.name).join(", ")}. The sale
								closes once you serve {pendingElsewhere.length > 1 ? "them" : "it"}.
							</Note>
						)}
						{sale.notes && (
							<p className="rounded-control bg-subtle px-4 py-3 text-[13px] text-ink">
								{sale.notes}
							</p>
						)}

						<PanelSection
							title={`Items · ${plural(
								live.reduce((n, l) => n + l.quantity, 0),
								"item",
							)}`}
						>
							<ul className="divide-y divide-line rounded-xl border border-line">
								{sale.lines.map((l) => {
									const gone = l.status === "CANCELLED";
									return (
										<li key={l.id} className="flex gap-3 px-4 py-3">
											<div className="min-w-0 flex-1">
												<p
													className={cn(
														"text-[15px] font-semibold text-ink",
														gone && "text-ink-3 line-through",
													)}
												>
													{l.quantity} × {l.name}
												</p>
												{(l.choices.length > 0 || l.options) && (
													<p className="text-xs text-ink-2">
														{l.choices.length
															? l.choices
																	.map((c) =>
																		c.extra
																			? `${c.name} +${naira(c.extra)}`
																			: c.name,
																	)
																	.join(", ")
															: l.options}
													</p>
												)}
												{l.notes && (
													<p className="text-xs text-ink-3">Note: {l.notes}</p>
												)}
												{(() => {
													const ol = gone ? null : elsewhereLine(l.id);
													if (!ol || ol.status === "SERVED") return null;
													const st = stationStatus(
														ol.status,
														stationName(outlets, ol.preparedAt),
													);
													return ol.status === "READY" && desk ? (
														<span className="mt-1 flex items-center gap-2">
															<StatusPill tone={st.tone} dot={false}>
																{st.label}
															</StatusPill>
															<button
																type="button"
																disabled={pending}
																onClick={() => serveLine(l.id, l.name)}
																className="rounded-control border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-subtle"
															>
																Served
															</button>
														</span>
													) : (
														<StatusPill
															tone={st.tone}
															dot={false}
															className="mt-1"
														>
															{st.label}
														</StatusPill>
													);
												})()}
												{gone && (
													<p className="text-xs font-medium text-danger">
														Cancelled
														{l.cancelReason ? `: ${l.cancelReason}` : ""}
														{l.cancelledByName
															? ` · by ${l.cancelledByName}`
															: ""}
													</p>
												)}
											</div>
											<div className="shrink-0 text-right">
												<p
													className={cn(
														"text-[15px] font-semibold text-ink",
														gone && "text-ink-3 line-through",
													)}
												>
													{naira(l.amount)}
												</p>
												<p className="text-xs text-ink-3">
													{naira(l.unitPrice)} each
													{l.discount > 0 ? ` · −${naira(l.discount)}` : ""}
												</p>
											</div>
										</li>
									);
								})}
							</ul>
						</PanelSection>

						<TotalsList
							rows={[
								{ label: "Subtotal", value: naira(sale.subtotal) },
								...(sale.discount > 0
									? [
											{
												label: "Happy hour discount",
												value: `−${naira(sale.discount)}`,
											},
										]
									: []),
								...(sale.tax > 0
									? [{ label: "Tax", value: naira(sale.tax) }]
									: []),
								{ label: "Total", value: naira(sale.total), strong: true },
								...(s.status === "CANCELLED"
									? []
									: [
											{
												label: "Paid so far",
												value: naira(Math.min(sale.paidAmount, sale.total)),
											},
											...(roomPart > 0
												? [{ label: "On the room", value: naira(roomPart) }]
												: []),
											{
												label: "Balance",
												value: naira(sale.balance),
												strong: true,
												tone:
													sale.balance > 0
														? ("danger" as const)
														: ("success" as const),
											},
										]),
							]}
						/>

						{(sale.payments.length > 0 || s.status === "ON_ROOM") && (
							<PanelSection title="Payment">
								<ul className="flex flex-col gap-2">
									{sale.payments.map((p) => (
										<li
											key={p.paymentId}
											className="flex items-start justify-between gap-3 rounded-xl bg-subtle/70 px-4 py-3 text-[13px]"
										>
											<span className="min-w-0">
												<span className="block font-semibold text-ink">
													{methodLabel(p.method)}
												</span>
												<span className="block text-xs text-ink-3">
													{p.takenByName
														? `Taken by ${p.takenByName}`
														: "Taker not recorded"}
													{p.at ? ` · ${fmtWhen(p.at)}` : ""}
													{p.reference ? ` · Ref ${p.reference}` : ""}
												</span>
											</span>
											<span className="font-semibold text-ink">
												{naira(p.amount)}
											</span>
										</li>
									))}
									{s.status === "ON_ROOM" && (
										<li className="flex items-start justify-between gap-3 rounded-xl bg-brand-soft/50 px-4 py-3 text-[13px]">
											<span className="min-w-0">
												<span className="block font-semibold text-ink">
													Charged to room {s.roomNumber ?? "—"}
													{s.guestName ? ` · ${s.guestName}` : ""}
												</span>
												<span className="block text-xs text-ink-3">
													{sale.timeline.settledByName
														? `By ${sale.timeline.settledByName}`
														: "By —"}
													{sale.timeline.settledAt
														? ` · ${fmtWhen(sale.timeline.settledAt)}`
														: ""}{" "}
													· collected at check-out
												</span>
											</span>
											<span className="font-semibold text-ink">
												{naira(roomPart)}
											</span>
										</li>
									)}
								</ul>
							</PanelSection>
						)}

						<PanelSection title="Timeline">
							<Timeline
								items={[
									{
										text: "Opened",
										by: sale.timeline.openedByName ?? s.openedByName,
										at: fmtWhen(sale.timeline.openedAt ?? s.createdAt),
									},
									...(sale.timeline.sentAt
										? [{ text: "Sent", at: fmtWhen(sale.timeline.sentAt) }]
										: []),
									...(sale.timeline.settledAt &&
									sale.timeline.settledBy &&
									sale.timeline.settledBy !== "CANCELLED"
										? [
												{
													text: settledLabel(sale.timeline.settledBy),
													by: sale.timeline.settledByName,
													at: fmtWhen(sale.timeline.settledAt),
												},
											]
										: []),
									...(sale.timeline.closedAt
										? [
												{
													text:
														s.status === "CANCELLED" ? "Cancelled" : "Closed",
													by: sale.timeline.closedByName,
													at: fmtWhen(sale.timeline.closedAt),
												},
											]
										: []),
								]}
							/>
							<p className="text-xs text-ink-3">
								Each item shows where it stands now; items carry no times of
								their own.
							</p>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			{/* Take payment: the shared steps, for the balance or less (a part payment). */}
			{desk && (
				<OrderPaymentPanel
					open={sub === "pay" && !!sale}
					onOpenChange={(o) => !o && setSub(null)}
					desk={desk}
					terminals={terminals}
					editAmount
					payment={
						sale && s
							? {
									orderId: s.id,
									guestName: s.guestName ?? `${s.outletName} guest`,
									roomNumber: s.roomNumber,
									amount: sale.balance,
									description: `${s.number} · ${s.items}`.slice(0, 200),
									tipAllowed: !!bill?.can.tips,
									tipFor: s.openedByName ?? undefined,
								}
							: null
					}
					onDone={() => {
						if (sale) void afterPayment(sale.paidAmount);
					}}
				/>
			)}

			{/* The bill: split it and pay part by part, discounts, complimentary items, requests to a manager. */}
			<BillSheet
				orderId={sub === "bill" && s ? s.id : null}
				onClose={() => {
					setSub(null);
					if (saleId) void load(saleId);
				}}
				desk={desk}
				terminals={terminals}
				inHouse={inHouse}
				onChanged={(id) => onChanged?.(id)}
			/>

			{/* Charge to room */}
			<SidePanel
				open={sub === "room" && !!sale}
				onOpenChange={(o) => !o && setSub(null)}
				title="Charge to room"
				subtitle={
					s && sale
						? `${s.number} · ${naira(sale.balance)} to a guest's bill`
						: undefined
				}
				icon={BedDoubleIcon}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Back
						</BigButton>
						{roomError && sale?.can.pay && (
							<BigButton tone="secondary" onClick={() => setSub("pay")}>
								<CreditCardIcon className="size-5" /> Take payment instead
							</BigButton>
						)}
						<BigButton pending={pending} disabled={!guest} onClick={charge}>
							Charge to room
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<SelectField
						label="Hotel guest"
						value={roomPick}
						onChange={(v) => {
							setRoomPick(v);
							setRoomError(null);
						}}
						options={inHouse.map((b) => ({ value: b.id, label: roomLabel(b) }))}
						placeholder={inHouse.length ? "Which room" : "Nobody is checked in"}
						required
					/>
					{guest && sale && (
						<WhatHappens
							items={[
								`${naira(sale.balance)} goes on ${guest.guestName}'s folio${partPaid ? " (the part already paid stays paid)" : ""}`,
								"The room must have a guest checked in and an open bill",
								"Front office collects it at check-out",
							]}
						/>
					)}
					{roomError && (
						<Note tone="danger">
							Can't charge to room {guest?.roomNumber ?? ""}: {roomError}. Take
							payment instead.
						</Note>
					)}
				</div>
			</SidePanel>

			{s && (
				<ReasonModal
					open={sub === "cancel"}
					onOpenChange={(o) => !o && setSub(null)}
					title={`Cancel ${s.number}`}
					subtitle={`${naira(s.total)} · ${s.items}`}
					confirmLabel="Cancel sale"
					pending={pending}
					onConfirm={cancel}
				/>
			)}
		</>
	);
}
