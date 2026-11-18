"use client";

import {
	BanIcon,
	BedDoubleIcon,
	CheckIcon,
	CreditCardIcon,
	GiftIcon,
	KeyRoundIcon,
	PercentIcon,
	PrinterIcon,
	ReceiptIcon,
	RotateCwIcon,
	SplitIcon,
	Undo2Icon,
	XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	approversHere,
	type Bill,
	chargePartToRoom,
	decideOnDevice,
	giveDiscount,
	readBill,
	removeDiscount,
	requestVoid,
	type SaleRequestView,
	saleReasons,
	splitBill,
	undoSplit,
} from "@hospio/api/actions/bill";
import { useAction } from "@hospio/api/actions/use-action";
import type { BookingRow, TerminalRow } from "@hospio/api/data/types";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { MoneyField, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, nairaExact, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cn } from "@hospio/ui/utils";
import { OrderPaymentPanel } from "./pos-payment";
import { BigButton, Stepper } from "./tablet";

type PayDesk = "BAR" | "KITCHEN" | "MANAGER" | "OWNER" | "WAITER" | "CASHIER";
type Part = NonNullable<Bill["split"]>["parts"][number];
type Line = NonNullable<Bill["order"]["lines"]>[number];

const METHOD: Record<string, string> = {
	CASH: "Cash",
	CARD: "Card",
	TRANSFER: "Transfer",
	ROOM: "On a room",
};
const SPLIT_MODE: Record<string, string> = {
	EQUAL: "Split equally",
	ITEM: "Split by item",
	AMOUNT: "Split by amount",
};
const REQUEST_STATUS: Record<
	string,
	{ label: string; tone: "warning" | "success" | "danger" | "grey" }
> = {
	PENDING: { label: "Waiting for a manager", tone: "warning" },
	APPROVED: { label: "Approved", tone: "success" },
	DECLINED: { label: "Declined", tone: "danger" },
	NOT_APPLIED: { label: "Approved, not done", tone: "grey" },
};

/** What the guest pays for a line: price times quantity less everything taken off it. */
const lineAmount = (l: Line) =>
	Math.max(0, l.unitPrice * l.quantity - (l.discount ?? 0));

/** "10 % off · Regular guest · by Chika, approved by Ada" for a line discounted by hand. */
function lineDiscountNote(l: Line) {
	const manual = l.manualDiscount ?? 0;
	if (manual <= 0) return null;
	const who = [
		l.discountByName ? `by ${l.discountByName}` : null,
		l.discountApprovedByName ? `approved by ${l.discountApprovedByName}` : null,
	]
		.filter(Boolean)
		.join(", ");
	const what = l.complimentary
		? "Complimentary"
		: `${nairaExact(manual)} off`;
	return [what, l.discountReason, who].filter(Boolean).join(" · ");
}

/**
 * The bill of one sale (hospio-backend docs/plan-venue-type.md, phase 4). What is still to pay is always on screen. From here
 * whoever takes the payment splits the bill (equally, by item, by amount), pays each part its own way (cash, card or transfer on
 * the POS, a room where the location has rooms) and undoes the split while nothing is paid; gives a discount or a complimentary
 * item with a reason; and asks a manager for what they may not do alone (a bigger discount, a free item, a void of something
 * already sent). A manager standing there approves on this screen with their own PIN. fnb-service decides who may do what
 * (`bill.can`); the screen only hides what it refuses.
 */
export function BillSheet({
	orderId,
	onClose,
	desk,
	terminals,
	inHouse,
	onChanged,
	start,
}: {
	orderId: string | null;
	onClose: () => void;
	/** The desk payments are taken as; null for someone who only looks. */
	desk: PayDesk | null;
	terminals: TerminalRow[];
	/** Guests in house, for charging a part to a room; empty at a lounge, bar or restaurant. */
	inHouse: BookingRow[];
	/** Something changed on the sale: the screen behind reads it again. */
	onChanged?: (id: string) => void;
	/** Open straight on a step. */
	start?: "split" | "discount";
}) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [bill, setBill] = useState<Bill | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [reasons, setReasons] = useState<{ discount: string[]; void: string[] }>({
		discount: [],
		void: [],
	});
	const [waiting, setWaiting] = useState(false);
	const [pay, setPay] = useState<{ part?: Part; amount: number } | null>(null);
	const [splitOpen, setSplitOpen] = useState(false);
	const [discount, setDiscount] = useState<{ line?: Line; complimentary?: boolean } | null>(null);
	const [voidAsk, setVoidAsk] = useState<{ line?: Line } | null>(null);
	const [roomPart, setRoomPart] = useState<Part | null>(null);
	const [approve, setApprove] = useState<SaleRequestView | null>(null);
	const reqRef = useRef(0);
	const started = useRef<string | null>(null);

	const load = useCallback(async (id: string) => {
		const req = ++reqRef.current;
		setError(null);
		const r = await readBill(id).catch(() => ({ ok: false as const, error: "The bill could not be read" }));
		if (req !== reqRef.current) return null;
		if (!r.ok) {
			setError(r.error);
			return null;
		}
		setBill(r.data);
		return r.data;
	}, []);

	useEffect(() => {
		setBill(null);
		setPay(null);
		setSplitOpen(false);
		setDiscount(null);
		setVoidAsk(null);
		setRoomPart(null);
		setApprove(null);
		setWaiting(false);
		if (!orderId) {
			reqRef.current++;
			started.current = null;
			return;
		}
		void load(orderId).then((b) => {
			if (!b || started.current === orderId) return;
			started.current = orderId;
			if (start === "split" && b.can.split) setSplitOpen(true);
			if (start === "discount" && b.can.discount) setDiscount({});
		});
		void saleReasons().then(setReasons).catch(() => undefined);
	}, [orderId, load, start]);

	const changed = (b?: Bill | null) => {
		if (b) setBill(b);
		if (orderId) onChanged?.(orderId);
		router.refresh();
	};

	/** A payment reaches the bill when payment-service's event lands in fnb-service: read again until it shows. */
	const afterPayment = async (before: number) => {
		if (!orderId) return;
		setWaiting(true);
		for (let i = 0; i < 10; i++) {
			const fresh = await load(orderId);
			if (fresh && fresh.payments.length !== before) break;
			await new Promise((r) => setTimeout(r, 1000));
		}
		setWaiting(false);
		changed();
	};

	/** A manager decided on this screen: the bill changes when the decision reaches fnb-service. */
	const afterDecision = async (requestId: string) => {
		if (!orderId) return;
		setWaiting(true);
		for (let i = 0; i < 10; i++) {
			const fresh = await load(orderId);
			if (fresh?.requests.find((r) => r.id === requestId)?.status !== "PENDING") break;
			await new Promise((r) => setTimeout(r, 1000));
		}
		setWaiting(false);
		changed();
	};

	const o = bill?.order;
	const can = bill?.can;
	const lines = o?.lines ?? [];
	const live = lines.filter((l) => l.status !== "CANCELLED");
	const split = bill?.split ?? null;
	const splitActive = !!split && split.parts.some((p) => p.status !== "PAID") && (bill?.balance ?? 0) > 0;
	const settled = !!o && (o.status === "CLOSED" || o.status === "CANCELLED" || !!o.paid || !!o.chargedToRoom);
	const limit = can?.discountLimitPct ?? 0;
	const sub = !!pay || splitOpen || !!discount || !!voidAsk || !!roomPart || !!approve;
	const paidSoFar = o?.paidAmount ?? 0;
	const onRooms = o?.roomAmount ?? 0;
	const where = o
		? [o.tableNo ? `Table ${o.tableNo}` : null, o.roomNumber ? `Room ${o.roomNumber}` : null, o.guestName]
				.filter(Boolean)
				.join(" · ")
		: "";
	const billDiscount =
		o && ((o.billDiscountPct ?? 0) > 0 || (o.billDiscountAmount ?? 0) > 0)
			? live.reduce((n, l) => n + (l.billDiscount ?? 0), 0)
			: 0;
	const pendingFor = (lineId?: string | null) =>
		bill?.requests.find((r) => r.status === "PENDING" && (r.lineId ?? null) === (lineId ?? null));

	const doUndo = () =>
		orderId &&
		run(() => undoSplit(orderId), "Split undone. The bill is whole again", (b) => changed(b));

	const doRemoveDiscount = (lineId?: string) =>
		orderId &&
		run(() => removeDiscount(orderId, lineId), "Discount removed", (b) => changed(b));

	return (
		<>
			<SidePanel
				open={!!orderId && !sub}
				onOpenChange={(open) => !open && onClose()}
				title={o ? `Bill · ${o.number}` : "Bill"}
				subtitle={o ? where || fmtWhen(o.createdAt ?? "") : error ? undefined : "Loading the bill…"}
				icon={ReceiptIcon}
				width="lg"
				footerInfo={
					bill && o
						? o.status === "CANCELLED"
							? "Cancelled · nothing to pay"
							: bill.balance > 0
								? `${nairaExact(bill.balance)} still to pay`
								: "Paid in full"
						: undefined
				}
				footer={
					<>
						{bill && bill.payments.length > 0 && o && (
							<BigButton
								tone="secondary"
								onClick={() => window.open(`/receipt?sale=${encodeURIComponent(o.id)}`, "_blank", "noopener")}
							>
								<PrinterIcon className="size-5" /> Receipts
							</BigButton>
						)}
						{can?.split && desk && (
							<BigButton tone="secondary" onClick={() => setSplitOpen(true)}>
								<SplitIcon className="size-5" /> Split the bill
							</BigButton>
						)}
						{can?.pay && desk && !splitActive && bill && (
							<BigButton onClick={() => setPay({ amount: bill.balance })}>
								<CreditCardIcon className="size-5" /> Take {nairaExact(bill.balance)}
							</BigButton>
						)}
						{!(can?.pay && desk && !splitActive) && (
							<BigButton tone="secondary" onClick={onClose}>
								Close
							</BigButton>
						)}
					</>
				}
			>
				{error ? (
					<div className="flex flex-col items-start gap-3">
						<Note tone="danger">{error}</Note>
						<BigButton tone="secondary" onClick={() => orderId && void load(orderId)}>
							<RotateCwIcon className="size-5" /> Try again
						</BigButton>
					</div>
				) : !bill || !o ? (
					<p className="text-[13px] text-ink-3">Loading the bill…</p>
				) : (
					<div className="flex flex-col gap-5">
						{waiting && <Note tone="info">Checking with the till and the POS…</Note>}
						{can?.note && <Note tone="info">{can.note}</Note>}

						<TotalsList
							rows={[
								{ label: "Items", value: nairaExact(o.subtotal ?? o.total) },
								...((o.discount ?? 0) > 0
									? [{ label: "Discounts", value: `- ${nairaExact(o.discount)}`, tone: "success" as const }]
									: []),
								...((o.serviceCharge ?? 0) > 0
									? [{ label: "Service charge", value: nairaExact(o.serviceCharge) }]
									: []),
								{ label: (o.tax ?? 0) > 0 ? `Total (VAT ${nairaExact(o.tax)})` : "Total", value: nairaExact(o.total) },
								...(paidSoFar > 0 ? [{ label: "Paid so far", value: nairaExact(paidSoFar) }] : []),
								...(onRooms > 0 ? [{ label: "On rooms", value: nairaExact(onRooms) }] : []),
								...(bill.tipsTotal > 0
									? [{ label: "Tips (not part of the bill)", value: nairaExact(bill.tipsTotal) }]
									: []),
								{
									label: "Still to pay",
									value: nairaExact(bill.balance),
									strong: true,
									tone: bill.balance > 0 ? ("danger" as const) : ("success" as const),
								},
							]}
						/>

						{split && (
							<PanelSection
								title={`${SPLIT_MODE[split.mode] ?? "Split"} · ${plural(split.parts.length, "part")}`}
							>
								<p className="mb-2 text-[13px] text-ink-2">
									{nairaExact(split.amount)} split by {split.createdByName ?? "the cashier"}.{" "}
									{nairaExact(split.paid)} paid, {nairaExact(split.remaining)} to go. Each part has its own receipt.
								</p>
								<ul className="divide-y divide-line rounded-xl border border-line">
									{split.parts.map((p) => (
										<li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
											<div className="min-w-0 flex-1">
												<p className="text-[15px] font-semibold text-ink">
													{p.label} · {nairaExact(p.amount)}
												</p>
												{p.items && p.items.length > 0 && (
													<p className="text-[13px] text-ink-2">
														{p.items.map((i) => (i.share ? `${i.name} (${i.share})` : i.name)).join(", ")}
													</p>
												)}
												{p.status === "PAID" ? (
													<p className="text-[13px] text-ink-3">
														{p.method === "ROOM" ? `Charged to room ${p.roomNumber ?? ""}` : (METHOD[p.method ?? ""] ?? "Paid")}
														{p.paidByName ? ` · ${p.paidByName}` : ""}
													</p>
												) : p.paidAmount > 0 ? (
													<p className="text-[13px] text-warning">
														{nairaExact(p.paidAmount)} paid, {nairaExact(p.due)} to go
													</p>
												) : null}
											</div>
											{p.status === "PAID" ? (
												<StatusPill tone="success">Paid</StatusPill>
											) : (
												desk &&
												!settled && (
													<span className="flex flex-wrap gap-2">
														{can?.chargeToRoom && inHouse.length > 0 && (
															<BigButton tone="secondary" onClick={() => setRoomPart(p)}>
																<BedDoubleIcon className="size-5" /> Room
															</BigButton>
														)}
														{can?.pay && (
															<BigButton onClick={() => setPay({ part: p, amount: p.due })}>
																Pay {nairaExact(p.due)}
															</BigButton>
														)}
													</span>
												)
											)}
										</li>
									))}
								</ul>
								{can?.undoSplit && desk && (
									<BigButton tone="ghost" className="mt-2" pending={pending} onClick={doUndo}>
										<Undo2Icon className="size-5" /> Undo the split
									</BigButton>
								)}
								{splitActive && !split.canUndo && (
									<p className="mt-2 text-[13px] text-ink-3">
										A part is paid, so the split stays. Collect the other parts.
									</p>
								)}
							</PanelSection>
						)}

						<PanelSection title={`Items · ${plural(live.reduce((n, l) => n + l.quantity, 0), "item")}`}>
							<ul className="divide-y divide-line rounded-xl border border-line">
								{lines.map((l) => {
									const gone = l.status === "CANCELLED";
									const note = lineDiscountNote(l);
									const asked = pendingFor(l.id);
									return (
										<li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
											<div className="min-w-0 flex-1">
												<p className={cn("text-[15px] font-semibold text-ink", gone && "text-ink-3 line-through")}>
													{l.quantity} × {l.name}
												</p>
												{gone && l.cancelReason && (
													<p className="text-[13px] text-ink-3">
														Voided: {l.cancelReason}
														{l.cancelledByName ? ` · ${l.cancelledByName}` : ""}
													</p>
												)}
												{!gone && note && <p className="text-[13px] text-success">{note}</p>}
												{!gone && asked && (
													<p className="text-[13px] text-warning">Waiting for a manager: {asked.summary}</p>
												)}
											</div>
											<span className={cn("text-[15px] font-semibold text-ink", gone && "text-ink-3 line-through")}>
												{nairaExact(gone ? l.unitPrice * l.quantity : lineAmount(l))}
											</span>
											{!gone && can?.discount && desk && !asked && (
												<span className="flex w-full flex-wrap gap-2 sm:w-auto">
													{(l.manualDiscount ?? 0) > 0 ? (
														<BigButton tone="ghost" pending={pending} onClick={() => doRemoveDiscount(l.id)}>
															<XIcon className="size-5" /> Remove discount
														</BigButton>
													) : (
														<>
															<BigButton tone="ghost" onClick={() => setDiscount({ line: l })}>
																<PercentIcon className="size-5" /> Discount
															</BigButton>
															<BigButton tone="ghost" onClick={() => setDiscount({ line: l, complimentary: true })}>
																<GiftIcon className="size-5" /> Free
															</BigButton>
														</>
													)}
													{can.voidAsks && l.status !== "NEW" && (
														<BigButton tone="ghost" onClick={() => setVoidAsk({ line: l })}>
															<BanIcon className="size-5" /> Ask to void
														</BigButton>
													)}
												</span>
											)}
										</li>
									);
								})}
							</ul>
							{billDiscount > 0 && (
								<div className="mt-2 flex flex-wrap items-center gap-3">
									<p className="min-w-0 flex-1 text-[13px] text-success">
										{(o.billDiscountPct ?? 0) > 0 ? `${o.billDiscountPct} % off the bill` : "Discount on the bill"}:{" "}
										{nairaExact(billDiscount)}
										{o.discountReason ? ` · ${o.discountReason}` : ""}
										{o.discountByName ? ` · by ${o.discountByName}` : ""}
									</p>
									{can?.discount && desk && (
										<BigButton tone="ghost" pending={pending} onClick={() => doRemoveDiscount()}>
											<XIcon className="size-5" /> Remove
										</BigButton>
									)}
								</div>
							)}
							{splitActive && !settled && (
								<p className="mt-2 text-[13px] text-ink-3">
									The bill is split, so its items and discounts stay as they are. Undo the split to change them.
								</p>
							)}
							{can?.discount && desk && live.length > 0 && (
								<div className="mt-3 flex flex-wrap gap-2">
									{billDiscount <= 0 && !pendingFor(null) && (
										<>
											<BigButton tone="secondary" onClick={() => setDiscount({})}>
												<PercentIcon className="size-5" /> Discount the bill
											</BigButton>
											<BigButton tone="secondary" onClick={() => setDiscount({ complimentary: true })}>
												<GiftIcon className="size-5" /> Whole bill free
											</BigButton>
										</>
									)}
									{can.voidAsks && !pendingFor(null) && paidSoFar <= 0 && onRooms <= 0 && (
										<BigButton tone="ghost" onClick={() => setVoidAsk({})}>
											<BanIcon className="size-5" /> Ask to void the sale
										</BigButton>
									)}
								</div>
							)}
							{can?.discount && desk && (
								<p className="mt-2 text-[13px] text-ink-3">
									{limit >= 100
										? "You can give any discount. A reason is always kept."
										: limit > 0
											? `You can give up to ${limit} % yourself. More than that, or a free item, goes to a manager.`
											: "A discount or a free item from you goes to a manager to approve."}
								</p>
							)}
						</PanelSection>

						{bill.requests.length > 0 && (
							<PanelSection title="Requests to a manager">
								<ul className="divide-y divide-line rounded-xl border border-line">
									{bill.requests.map((r) => {
										const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.PENDING;
										return (
											<li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
												<div className="min-w-0 flex-1">
													<p className="text-[15px] font-semibold text-ink">{r.summary}</p>
													<p className="text-[13px] text-ink-2">
														{r.reason} · asked by {r.requestedByName ?? "staff"}
														{r.requestedAt ? ` · ${fmtWhen(r.requestedAt)}` : ""}
													</p>
													{r.status !== "PENDING" && (
														<p className="text-[13px] text-ink-3">
															{r.decidedByName ?? "A manager"}
															{r.decisionNote ? `: ${r.decisionNote}` : ""}
														</p>
													)}
												</div>
												<StatusPill tone={st.tone}>{st.label}</StatusPill>
												{r.status === "PENDING" && (
													<BigButton tone="secondary" onClick={() => setApprove(r)}>
														<KeyRoundIcon className="size-5" /> Manager is here
													</BigButton>
												)}
											</li>
										);
									})}
								</ul>
							</PanelSection>
						)}

						{bill.payments.length > 0 && (
							<PanelSection title="Payments">
								<ul className="divide-y divide-line rounded-xl border border-line">
									{bill.payments.map((p) => {
										const part = split?.parts.find((x) => x.id === p.partId);
										return (
											<li key={p.paymentId} className="flex flex-wrap items-center gap-3 px-4 py-3">
												<div className="min-w-0 flex-1">
													<p className="text-[15px] font-semibold text-ink">
														{METHOD[p.method] ?? p.method} · {nairaExact(p.amount)}
														{part ? ` · ${part.label}` : ""}
													</p>
													<p className="text-[13px] text-ink-2">
														{p.at ? fmtWhen(p.at) : ""}
														{p.takenByName ? ` · ${p.takenByName}` : ""}
														{p.reference ? ` · ref ${p.reference}` : ""}
														{(p.tip ?? 0) > 0 ? ` · plus a ${nairaExact(p.tip)} tip` : ""}
													</p>
												</div>
												<BigButton
													tone="ghost"
													onClick={() =>
														window.open(`/receipt?payment=${encodeURIComponent(p.paymentId)}`, "_blank", "noopener")
													}
												>
													<PrinterIcon className="size-5" /> Receipt
												</BigButton>
											</li>
										);
									})}
								</ul>
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			{o && desk && (
				<OrderPaymentPanel
					open={!!pay}
					onOpenChange={(open) => {
						if (!open) setPay(null);
					}}
					payment={
						pay
							? {
									orderId: o.id,
									guestName: o.guestName || (o.tableNo ? `Table ${o.tableNo}` : "Guest"),
									amount: pay.amount,
									description: `${o.number}`,
									roomNumber: o.roomNumber ?? undefined,
									partId: pay.part?.id,
									tipAllowed: !!can?.tips,
									tipFor: o.openedByName ?? undefined,
								}
							: null
					}
					desk={desk}
					terminals={terminals}
					doneLabel="Back to the bill"
					onDone={() => void afterPayment(bill?.payments.length ?? 0)}
					onFinish={() => orderId && void load(orderId)}
				/>
			)}

			{o && (
				<SplitModal
					open={splitOpen}
					onOpenChange={setSplitOpen}
					number={o.number}
					balance={bill?.balance ?? 0}
					total={o.total}
					nothingTaken={paidSoFar <= 0 && onRooms <= 0}
					lines={live}
					pending={pending}
					onSplit={(input, done) =>
						run(
							() => splitBill(o.id, input),
							(b) => `${o.number} split into ${plural(b.split?.parts.length ?? 0, "part")}`,
							(b) => {
								changed(b);
								setSplitOpen(false);
								done();
							},
						)
					}
				/>
			)}

			{o && (
				<DiscountModal
					target={discount}
					onClose={() => setDiscount(null)}
					number={o.number}
					limit={limit}
					reasons={reasons.discount}
					billWorth={live.reduce((n, l) => n + Math.max(0, lineAmount(l) + (l.billDiscount ?? 0)), 0)}
					pending={pending}
					onGive={(input) =>
						run(
							() => giveDiscount(o.id, input),
							(r) => (r.request ? "Sent to a manager to approve" : r.message),
							(r) => {
								changed(r.bill);
								setDiscount(null);
								if (r.request) setApprove(null);
							},
						)
					}
				/>
			)}

			{o && (
				<ReasonPick
					open={!!voidAsk}
					onOpenChange={(open) => !open && setVoidAsk(null)}
					title={voidAsk?.line ? `Ask to void ${voidAsk.line.name}?` : `Ask to void ${o.number}?`}
					subtitle="A manager approves it from their dashboard, or here with their PIN. Nothing changes until they do"
					confirmLabel="Send to a manager"
					reasons={reasons.void}
					pending={pending}
					onConfirm={(reason) =>
						run(
							() => requestVoid(o.id, reason, voidAsk?.line?.id),
							"Sent to a manager to approve",
							(r) => {
								changed(r.bill);
								setVoidAsk(null);
							},
						)
					}
				/>
			)}

			{o && (
				<RoomModal
					part={roomPart}
					onClose={() => setRoomPart(null)}
					inHouse={inHouse}
					pending={pending}
					onCharge={(roomId, roomNumber) =>
						roomPart &&
						run(
							() => chargePartToRoom(o.id, roomPart.id, roomId),
							`${roomPart.label} (${nairaExact(roomPart.due)}) charged to room ${roomNumber}`,
							(b) => {
								changed(b);
								setRoomPart(null);
							},
						)
					}
				/>
			)}

			<ApproveHereModal
				request={approve}
				onClose={() => setApprove(null)}
				onDecided={(id) => {
					setApprove(null);
					void afterDecision(id);
				}}
			/>
		</>
	);
}

// ---- split ---------------------------------------------------------------------------------------------

function SplitModal({
	open,
	onOpenChange,
	number,
	balance,
	total,
	nothingTaken,
	lines,
	pending,
	onSplit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	number: string;
	balance: number;
	total: number;
	nothingTaken: boolean;
	lines: Line[];
	pending: boolean;
	onSplit: (
		input:
			| { mode: "EQUAL"; people: number }
			| { mode: "AMOUNT"; amounts: number[] }
			| { mode: "ITEM"; parts: { label?: string; lines: { lineId: string; shares?: number }[] }[] },
		done: () => void,
	) => void;
}) {
	const [mode, setMode] = useState<"EQUAL" | "ITEM" | "AMOUNT">("EQUAL");
	const [people, setPeople] = useState(2);
	const [amounts, setAmounts] = useState<(number | "")[]>([""]);
	const [guests, setGuests] = useState(2);
	/** lineId → guest index → shares (units of the line, or 1 for "shares it"). */
	const [on, setOn] = useState<Record<string, Record<number, number>>>({});

	useEffect(() => {
		if (!open) return;
		setMode("EQUAL");
		setPeople(2);
		setAmounts([""]);
		setGuests(2);
		setOn({});
	}, [open]);

	// The same sum the server does: everyone but the last pays the share rounded down to the kobo, the last the rest.
	const equal = useMemo(() => {
		const kobo = Math.round(balance * 100);
		const each = Math.floor(kobo / people);
		return { each: each / 100, last: (kobo - each * (people - 1)) / 100 };
	}, [balance, people]);

	const entered = amounts.filter((a): a is number => typeof a === "number" && a > 0);
	const sum = entered.reduce((n, a) => n + a, 0);
	const rest = Math.round((balance - sum) * 100) / 100;

	const toggle = (lineId: string, g: number) =>
		setOn((cur) => {
			const row = { ...(cur[lineId] ?? {}) };
			if (row[g]) delete row[g];
			else row[g] = 1;
			return { ...cur, [lineId]: row };
		});
	const setUnits = (lineId: string, g: number, n: number) =>
		setOn((cur) => {
			const row = { ...(cur[lineId] ?? {}) };
			if (n <= 0) delete row[g];
			else row[g] = n;
			return { ...cur, [lineId]: row };
		});
	const guestIdx = Array.from({ length: guests }, (_, i) => i);
	const unassigned = lines.filter((l) => !Object.keys(on[l.id] ?? {}).some((g) => Number(g) < guests));
	const emptyGuests = guestIdx.filter((g) => !lines.some((l) => on[l.id]?.[g]));
	/** What a guest's items come to before the service charge is shared (the server works the final figure out to the kobo). */
	const guestWorth = (g: number) =>
		lines.reduce((n, l) => {
			const row = on[l.id] ?? {};
			const all = guestIdx.reduce((x, i) => x + (row[i] ?? 0), 0);
			return all > 0 && row[g] ? n + (lineAmount(l) * row[g]) / all : n;
		}, 0);
	const itemsWorth = lines.reduce((n, l) => n + lineAmount(l), 0);

	const ready =
		mode === "EQUAL"
			? people >= 2
			: mode === "AMOUNT"
				? entered.length > 0 && rest >= 0 && (rest > 0 || entered.length > 1)
				: unassigned.length === 0 && emptyGuests.length === 0;

	const submit = () => {
		const done = () => undefined;
		if (mode === "EQUAL") return onSplit({ mode, people }, done);
		if (mode === "AMOUNT") return onSplit({ mode, amounts: entered }, done);
		onSplit(
			{
				mode,
				parts: guestIdx.map((g) => ({
					label: `Guest ${g + 1}`,
					lines: lines
						.filter((l) => on[l.id]?.[g])
						.map((l) => ({ lineId: l.id, shares: on[l.id]?.[g] })),
				})),
			},
			done,
		);
	};

	const tab = (m: typeof mode, label: string, disabled?: boolean) => (
		<button
			type="button"
			disabled={disabled}
			onClick={() => setMode(m)}
			className={cn(
				"min-h-12 flex-1 rounded-control border px-3 text-[14px] font-semibold",
				mode === m ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink",
				disabled && "opacity-50",
			)}
		>
			{label}
		</button>
	);

	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={`Split ${number}`}
			subtitle={`${nairaExact(balance)} to pay. The parts always add up to it exactly`}
			size="large"
			footer={
				<>
					<BigButton tone="secondary" onClick={() => onOpenChange(false)}>
						Not now
					</BigButton>
					<BigButton pending={pending} disabled={!ready} onClick={submit}>
						<SplitIcon className="size-5" /> Split the bill
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap gap-2">
					{tab("EQUAL", "Equally")}
					{tab("ITEM", "By item", !nothingTaken)}
					{tab("AMOUNT", "By amount")}
				</div>
				{!nothingTaken && (
					<p className="text-[13px] text-ink-3">
						Part of this bill is already paid, so what is left can be split equally or by amount.
					</p>
				)}

				{mode === "EQUAL" && (
					<>
						<div className="flex items-center justify-between gap-3">
							<span className="text-[15px] font-semibold text-ink">How many people?</span>
							<Stepper value={people} onChange={setPeople} min={2} max={20} />
						</div>
						<TotalsList
							rows={[
								...(equal.last !== equal.each
									? [
											{ label: `${people - 1} × pay`, value: nairaExact(equal.each) },
											{ label: "The last person pays", value: nairaExact(equal.last) },
										]
									: [{ label: "Each pays", value: nairaExact(equal.each) }]),
								{ label: "Adds up to", value: nairaExact(balance), strong: true },
							]}
						/>
					</>
				)}

				{mode === "AMOUNT" && (
					<>
						{amounts.map((a, i) => (
							<div key={`amount-${i}`} className="flex items-end gap-2">
								<MoneyField
									label={`Part ${i + 1} pays`}
									value={a}
									onChange={(v) => setAmounts((cur) => cur.map((x, j) => (j === i ? v : x)))}
									className="flex-1"
								/>
								{amounts.length > 1 && (
									<BigButton
										tone="ghost"
										aria-label={`Remove part ${i + 1}`}
										onClick={() => setAmounts((cur) => cur.filter((_, j) => j !== i))}
									>
										<XIcon className="size-5" />
									</BigButton>
								)}
							</div>
						))}
						{amounts.length < 10 && (
							<BigButton tone="ghost" className="self-start" onClick={() => setAmounts((cur) => [...cur, ""])}>
								Add another part
							</BigButton>
						)}
						{rest < 0 ? (
							<Note tone="danger">
								That is {nairaExact(-rest)} more than the {nairaExact(balance)} to pay.
							</Note>
						) : (
							<TotalsList
								rows={[
									{ label: "Entered", value: nairaExact(sum) },
									{ label: "Rest of the bill (the last part)", value: nairaExact(rest), strong: true },
								]}
							/>
						)}
					</>
				)}

				{mode === "ITEM" && (
					<>
						<div className="flex items-center justify-between gap-3">
							<span className="text-[15px] font-semibold text-ink">How many bills?</span>
							<Stepper value={guests} onChange={setGuests} min={2} max={8} />
						</div>
						<p className="text-[13px] text-ink-2">
							Tap who is paying for each item. An item tapped for more than one guest is shared between them.
						</p>
						<ul className="divide-y divide-line rounded-xl border border-line">
							{lines.map((l) => {
								const row = on[l.id] ?? {};
								const missing = unassigned.includes(l);
								return (
									<li key={l.id} className="flex flex-col gap-2 px-3 py-3">
										<div className="flex items-baseline justify-between gap-3">
											<span className={cn("text-[15px] font-semibold text-ink", missing && "text-warning")}>
												{l.quantity} × {l.name}
											</span>
											<span className="text-[13px] text-ink-2">{nairaExact(lineAmount(l))}</span>
										</div>
										<div className="flex flex-wrap gap-2">
											{guestIdx.map((g) =>
												l.quantity > 1 ? (
													<span key={g} className="inline-flex items-center gap-1 text-[13px] text-ink-2">
														G{g + 1}
														<Stepper value={row[g] ?? 0} onChange={(n) => setUnits(l.id, g, n)} min={0} max={l.quantity} />
													</span>
												) : (
													<button
														key={g}
														type="button"
														onClick={() => toggle(l.id, g)}
														className={cn(
															"inline-flex min-h-11 items-center gap-1 rounded-control border px-3 text-[13px] font-semibold",
															row[g] ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink",
														)}
													>
														{row[g] ? <CheckIcon className="size-4" /> : null} Guest {g + 1}
													</button>
												),
											)}
										</div>
									</li>
								);
							})}
						</ul>
						<TotalsList
							rows={[
								...guestIdx.map((g) => ({
									label: `Guest ${g + 1}`,
									value: itemsWorth > 0 ? `about ${nairaExact(Math.round(((guestWorth(g) * total) / itemsWorth) * 100) / 100)}` : "₦0",
								})),
								{ label: "Adds up to", value: nairaExact(balance), strong: true },
							]}
						/>
						{unassigned.length > 0 && (
							<Note tone="warning">
								Not on anyone's bill yet: {unassigned.map((l) => l.name).join(", ")}.
							</Note>
						)}
						{unassigned.length === 0 && emptyGuests.length > 0 && (
							<Note tone="warning">
								{emptyGuests.map((g) => `Guest ${g + 1}`).join(", ")} has nothing to pay. Give them an item or use fewer bills.
							</Note>
						)}
					</>
				)}
			</div>
		</Modal>
	);
}

// ---- discount, reason, room, approve -----------------------------------------------------------------

function ReasonField({
	reasons,
	value,
	onChange,
}: {
	reasons: string[];
	value: string;
	onChange: (v: string) => void;
}) {
	const [other, setOther] = useState(false);
	if (reasons.length === 0 || other)
		return (
			<TextField
				label="Reason"
				value={value}
				onChange={onChange}
				placeholder="Why?"
				required
				hint={reasons.length === 0 ? "Reasons to pick from are kept in Hotel setup → Reasons & lists" : undefined}
			/>
		);
	return (
		<SelectField
			label="Reason"
			value={value}
			onChange={(v) => {
				if (v === "__other") {
					setOther(true);
					onChange("");
				} else onChange(v);
			}}
			options={[...reasons.map((r) => ({ value: r, label: r })), { value: "__other", label: "Another reason…" }]}
			placeholder="Choose the reason"
			required
		/>
	);
}

function DiscountModal({
	target,
	onClose,
	number,
	limit,
	reasons,
	billWorth,
	pending,
	onGive,
}: {
	target: { line?: Line; complimentary?: boolean } | null;
	onClose: () => void;
	number: string;
	limit: number;
	reasons: string[];
	/** What the bill's items come to before a discount on the whole bill. */
	billWorth: number;
	pending: boolean;
	onGive: (input: { lineId?: string; pct?: number; amount?: number; complimentary?: boolean; reason: string }) => void;
}) {
	const [kind, setKind] = useState<"PCT" | "AMOUNT">("PCT");
	const [pct, setPct] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	useEffect(() => {
		if (target) {
			setKind("PCT");
			setPct("");
			setAmount("");
			setReason("");
		}
	}, [target]);
	const line = target?.line;
	const comp = !!target?.complimentary;
	// A line's price before a discount by hand (happy hour and the bill's share already off).
	const base = line ? lineAmount(line) + (line.manualDiscount ?? 0) : billWorth;
	const pctN = Number(pct.replace(",", "."));
	const worth = comp
		? base
		: kind === "PCT"
			? Number.isFinite(pctN) && pctN > 0
				? Math.round(base * Math.min(pctN, 100)) / 100
				: 0
			: typeof amount === "number"
				? Math.min(amount, base)
				: 0;
	const asPct = base > 0 ? (worth / base) * 100 : 0;
	const asks = comp ? limit < 100 : worth > 0 && asPct > limit + 0.05;
	const valid = reason.trim().length > 0 && worth > 0 && (kind !== "PCT" || comp || pctN <= 100);
	const what = line ? `${line.quantity} × ${line.name}` : `the bill ${number}`;

	return (
		<Modal
			open={!!target}
			onOpenChange={(open) => !open && onClose()}
			title={comp ? `Make ${what} free?` : `Discount ${what}`}
			subtitle={
				comp
					? `Worth ${nairaExact(base)}. It stays on the bill at ₦0, with the reason`
					: `${nairaExact(base)} before the discount`
			}
			size="form"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Not now
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!valid}
						onClick={() =>
							onGive({
								lineId: line?.id,
								complimentary: comp || undefined,
								pct: !comp && kind === "PCT" ? pctN : undefined,
								amount: !comp && kind === "AMOUNT" && typeof amount === "number" ? amount : undefined,
								reason: reason.trim(),
							})
						}
					>
						{asks ? "Send to a manager" : comp ? "Make it free" : "Give the discount"}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{!comp && (
					<>
						<div className="flex gap-2">
							{(["PCT", "AMOUNT"] as const).map((k) => (
								<button
									key={k}
									type="button"
									onClick={() => setKind(k)}
									className={cn(
										"min-h-12 flex-1 rounded-control border px-3 text-[14px] font-semibold",
										kind === k ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink",
									)}
								>
									{k === "PCT" ? "Percentage" : "Amount"}
								</button>
							))}
						</div>
						{kind === "PCT" ? (
							<TextField
								label="Discount (%)"
								value={pct}
								onChange={(v) => setPct(v.replace(/[^\d.,]/g, "").slice(0, 5))}
								placeholder="10"
								required
							/>
						) : (
							<MoneyField label="Discount" value={amount} onChange={setAmount} required />
						)}
					</>
				)}
				<ReasonField reasons={reasons} value={reason} onChange={setReason} />
				{worth > 0 && (
					<TotalsList
						rows={[
							{ label: comp ? "Given free" : "Comes off", value: `- ${nairaExact(worth)}`, tone: "success" },
							{ label: "New price", value: nairaExact(Math.max(0, base - worth)), strong: true },
						]}
					/>
				)}
				{asks && (
					<Note tone="warning">
						{comp
							? "A free item needs a manager."
							: limit > 0
								? `That is over your ${limit} % limit.`
								: "A discount from you needs a manager."}{" "}
						It goes to a manager to approve: from their dashboard, or here with their PIN. Nothing changes until they do.
					</Note>
				)}
			</div>
		</Modal>
	);
}

function ReasonPick({
	open,
	onOpenChange,
	title,
	subtitle,
	confirmLabel,
	reasons,
	pending,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	subtitle: string;
	confirmLabel: string;
	reasons: string[];
	pending: boolean;
	onConfirm: (reason: string) => void;
}) {
	const [reason, setReason] = useState("");
	useEffect(() => {
		if (open) setReason("");
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			subtitle={subtitle}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={() => onOpenChange(false)}>
						Keep it
					</BigButton>
					<BigButton pending={pending} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
						{confirmLabel}
					</BigButton>
				</>
			}
		>
			<ReasonField reasons={reasons} value={reason} onChange={setReason} />
		</Modal>
	);
}

function RoomModal({
	part,
	onClose,
	inHouse,
	pending,
	onCharge,
}: {
	part: Part | null;
	onClose: () => void;
	inHouse: BookingRow[];
	pending: boolean;
	onCharge: (roomId: string, roomNumber: string) => void;
}) {
	const [pick, setPick] = useState("");
	useEffect(() => {
		if (part) setPick("");
	}, [part]);
	const guest = inHouse.find((b) => b.id === pick);
	return (
		<Modal
			open={!!part}
			onOpenChange={(open) => !open && onClose()}
			title={part ? `Charge ${part.label.toLowerCase()} to a room` : "Charge to a room"}
			subtitle={part ? `${nairaExact(part.due)} goes on the guest's room bill. The other parts are paid here` : undefined}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Not now
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!guest?.roomId}
						onClick={() => guest?.roomId && onCharge(guest.roomId, guest.roomNumber ?? "")}
					>
						<BedDoubleIcon className="size-5" /> Charge the room
					</BigButton>
				</>
			}
		>
			<SelectField
				label="Guest in house"
				value={pick}
				onChange={setPick}
				options={inHouse
					.filter((b) => b.roomId)
					.map((b) => ({ value: b.id, label: `Room ${b.roomNumber ?? "?"} · ${b.guestName}` }))}
				placeholder="Choose the room"
				required
			/>
		</Modal>
	);
}

/**
 * The manager is standing there: they are picked by name and type their own PIN (the owner, who has no PIN, their password).
 * platform-service checks it and records the decision in their name; nobody is signed in on this screen.
 */
export function ApproveHereModal({
	request,
	onClose,
	onDecided,
}: {
	request: SaleRequestView | null;
	onClose: () => void;
	onDecided: (requestId: string, decision: "APPROVED" | "DECLINED") => void;
}) {
	const [people, setPeople] = useState<{ id: string; name: string; owner: boolean }[] | null>(null);
	const [who, setWho] = useState("");
	const [secret, setSecret] = useState("");
	const [note, setNote] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState<null | "APPROVED" | "DECLINED">(null);
	useEffect(() => {
		if (!request) return;
		setWho("");
		setSecret("");
		setNote("");
		setError(null);
		setBusy(null);
		void approversHere()
			.then(setPeople)
			.catch(() => setPeople([]));
	}, [request]);
	const person = people?.find((p) => p.id === who);
	const decide = async (decision: "APPROVED" | "DECLINED") => {
		if (!request || !who || !secret) return;
		setBusy(decision);
		setError(null);
		const r = await decideOnDevice({ approvalId: request.approvalId, approver: who, secret, decision, note }).catch(() => ({
			ok: false as const,
			error: "The decision could not be saved",
		}));
		setBusy(null);
		setSecret("");
		if (!r.ok) {
			setError(r.error);
			return;
		}
		onDecided(request.id, decision);
	};
	return (
		<Modal
			open={!!request}
			onOpenChange={(open) => !open && onClose()}
			title="Manager approval"
			subtitle={request ? `${request.requestedByName ?? "Staff"} asks: ${request.summary}. Reason: ${request.reason}` : undefined}
			size="form"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Not now
					</BigButton>
					<BigButton tone="danger" pending={busy === "DECLINED"} disabled={!who || !secret || !!busy} onClick={() => void decide("DECLINED")}>
						Decline
					</BigButton>
					<BigButton pending={busy === "APPROVED"} disabled={!who || !secret || !!busy} onClick={() => void decide("APPROVED")}>
						<CheckIcon className="size-5" /> Approve
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<p className="text-[13px] text-ink-2">
					Hand the screen to the manager. They choose their name and type their own PIN. It is recorded as their decision.
				</p>
				<SelectField
					label="Who is approving?"
					value={who}
					onChange={(v) => {
						setWho(v);
						setSecret("");
						setError(null);
					}}
					options={(people ?? []).map((p) => ({ value: p.id, label: p.owner ? `${p.name} (owner)` : p.name }))}
					placeholder={people === null ? "Loading…" : "Choose the manager"}
					empty="No manager found at this location"
					required
				/>
				<TextField
					label={person?.owner ? "Owner's password" : "Manager's PIN"}
					type="password"
					value={secret}
					onChange={(v) => setSecret(person?.owner ? v : v.replace(/\D/g, "").slice(0, 6))}
					placeholder={person?.owner ? "Password" : "6 digits"}
					hint={person?.owner ? "The owner has no PIN, so their password approves" : undefined}
					required
				/>
				<TextField label="Note (optional)" value={note} onChange={setNote} placeholder="Anything to say to the requester" />
				{error && <Note tone="danger">{error}</Note>}
			</div>
		</Modal>
	);
}
