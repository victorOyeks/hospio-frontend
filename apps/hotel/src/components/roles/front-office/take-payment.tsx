"use client";

import {
	CheckCircle2Icon,
	PrinterIcon,
	CreditCardIcon,
	Loader2Icon,
	MailIcon,
	MessageCircleIcon,
	XCircleIcon,
	ClockIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useWhatsAppKinds } from "@/lib/use-whatsapp-kinds";
import { toast } from "sonner";
import {
	ChoiceCards,
	Field,
	MoneyField,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import { naira, nairaExact } from "@hospio/ui/shared/format";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useHotelActions } from "@hospio/api/actions/hotel-scope";
import {
	cashTill,
	paymentStatus,
	verifyPayment,
} from "@hospio/api/actions/payment";
import { openTill } from "@hospio/api/actions/finance";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import type {
	FolioSummary,
	PaymentMethod,
	PaymentStatus,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

export type PaymentTarget = {
	guestName: string;
	roomNumber?: string;
	folioId?: string;
	bookingId?: string;
	amountDue: number;
	description?: string;
	guestPhone?: string;
	guestEmail?: string;
	/** A kitchen or bar order this payment settles; the order closes itself when it is approved. */
	orderId?: string;
	/** The desk taking the payment (KITCHEN, BAR): sent to payment-service so the right POS and till are used. */
	role?: string;
	/** The selling outlet's own POS (Hotel setup → Restaurants & tables): picked first while it is online. */
	terminalId?: string;
	/** The part of a split bill this pays (docs/plan-venue-type.md, phase 4). */
	partId?: string;
	/** The location records tips: a tip can be added on top of the amount. `tipFor` is who served. */
	tipAllowed?: boolean;
	tipFor?: string;
};
export type TakenPayment = {
	id: string;
	amount: number;
	method: PaymentMethod;
	guestName: string;
	status: PaymentStatus;
	folioId?: string;
	bookingId?: string;
	/** The provider's reason for a decline or failure ("Insufficient funds"), shown on the declined screen. */
	failureReason?: string | null;
	/** The POS it was sent to, as payment-service named it. */
	terminalName?: string | null;
};

type Step =
	| "idle"
	| "who"
	| "method"
	| "card"
	| "cash"
	| "receipt"
	| "done";
type CardState =
	| "waiting"
	| "paying"
	| "sent"
	/** Sent, and the POS hasn't answered for a few minutes: polling stops, the desk can check again or move on. */
	| "stalled"
	| "approved"
	| "declined"
	| "no_response";

export type PaymentStepsView = {
	title: string;
	subtitle: string;
	body: ReactNode;
	footer: ReactNode;
	footerInfo?: ReactNode;
	step: Step;
};

export type PaymentStepsOptions = {
	/** Who is paying and how much. Without it the steps start on "who" (Take a payment from anywhere). */
	target?: PaymentTarget | null;
	folios?: FolioSummary[];
	terminals?: TerminalRow[];
	/** A payment was recorded (any status). Fires once, before the "done" step. */
	onDone?: (payment: TakenPayment) => void;
	/** The user is finished (Done, Cancel, or Minimize while the POS waits): close or move on. */
	onFinish: () => void;
	/** Back from the method step when the target came from the caller: return to the caller's view. */
	onBack?: () => void;
	/** Label of the last button; "Done" by default. */
	doneLabel?: string;
	/** Extra content under the "done" message, and a way to hold the last button while the caller works. */
	doneExtra?: ReactNode;
	doneBusy?: boolean;
	/** Let the user change the amount on the method step (a part payment); fixed otherwise. */
	editAmount?: boolean;
};

/**
 * Front office 8.1–8.12 · Taking payment as steps: who is paying and how much, the method, the
 * terminal / transfer / cash step, the receipt, done. The steps are a hook so any panel can host them:
 * the caller renders `title`, `subtitle`, `body`, `footer` in its own SidePanel and the panel never
 * stacks on another one. Card goes to payment-service as soon as the step opens and shows what the
 * service answered: approved, declined, no response, or still processing (the POS confirms later; the
 * payment sits in My payments until then). Transfer and cash are recorded when the desk confirms them.
 * `begin(target)` restarts the steps for a new target; `autoStart: false` leaves them idle until then.
 */
/**
 * The POS a payment goes to unless the desk picks another: the outlet's own terminal when the target names one and it is
 * online, else the online terminal assigned to the paying desk (the front office when the target names none), else the
 * first online one.
 */
function defaultTerminal(
	terminals: TerminalRow[],
	role?: string,
	preferred?: string,
) {
	const online = terminals.filter((t) => t.status === "ONLINE");
	const desk = role ?? "FRONT_OFFICE";
	return (
		(preferred ? online.find((t) => t.id === preferred) : undefined) ??
		online.find((t) => t.roles.includes(desk)) ??
		online[0]
	)?.id ?? "";
}

/** The desk's Till page (the dashboard routes it to the signed-in desk's own till). */
const TILL_PAGE = "/dashboard/till";

function deskLabel(role: string) {
	return role === "FRONT_OFFICE" ? "Front office" : role.charAt(0) + role.slice(1).toLowerCase();
}

export function usePaymentSteps(
	{
		target,
		folios = [],
		terminals = [],
		onDone,
		onFinish,
		onBack,
		doneLabel = "Done",
		doneExtra,
		doneBusy,
		editAmount,
	}: PaymentStepsOptions,
	autoStart = true,
) {
	const { recordPayment, emailReceipt, resendReceipt } = useHotelActions();
	const [tgt, setTgt] = useState<PaymentTarget | null>(target ?? null);
	const [step, setStep] = useState<Step>(
		autoStart ? (target ? "method" : "who") : "idle",
	);
	const [folioId, setFolioId] = useState(target?.folioId ?? "");
	const [guestName, setGuestName] = useState(target?.guestName ?? "");
	const [amount, setAmount] = useState<number | "">(target?.amountDue ?? "");
	const [description, setDescription] = useState(
		target?.description ?? "Room charges",
	);
	const [method, setMethod] = useState<PaymentMethod>("CARD");
	// Card and bank transfer both go to the POS: the guest picks card or transfer on the terminal itself. Only cash doesn't.
	const toPos = method === "CARD" || method === "TRANSFER";
	const [terminal, setTerminal] = useState(() =>
		defaultTerminal(terminals, target?.role, target?.terminalId),
	);
	const [card, setCard] = useState<CardState>("waiting");
	const [attempt, setAttempt] = useState(0);
	const [tendered, setTendered] = useState<number | "">("");
	const [tip, setTip] = useState<number | "">("");
	// By email when the guest has one; a guest with a phone and no email can get it on WhatsApp (the approved receipt
	// template, when RECEIPT is in the backend's WhatsApp list), as the automatic receipt does; else the desk prints it.
	const waKinds = useWhatsAppKinds();
	const [receipt, setReceipt] = useState<"EMAIL" | "NONE" | "WHATSAPP">(
		target?.guestEmail ? "EMAIL" : "NONE",
	);
	const waReceipt =
		waKinds.includes("RECEIPT") && !!tgt?.guestPhone && !tgt?.guestEmail;
	const [contact, setContact] = useState(target?.guestEmail ?? "");
	const [sending, setSending] = useState(false);
	const [recorded, setRecorded] = useState<TakenPayment | null>(null);
	const session = useRef(0);
	const sent = useRef<string | null>(null);
	const live = useRef<string | null>(null);
	const [cardError, setCardError] = useState<string | null>(null);
	// Cash at the front office, bar or kitchen goes into that desk's till: it must be open first (payment-service refuses otherwise).
	const [till, setTill] = useState<{
		role: string;
		needed: boolean;
		open: boolean;
		message?: string | null;
	} | null>(null);
	const [tillFloat, setTillFloat] = useState<number | "">("");
	const [openingTill, setOpeningTill] = useState(false);
	const tillBlocked = method === "CASH" && !!till?.needed && !till.open;

	/** Restart the steps for a new target (or the "who" step when there is none). */
	function begin(t?: PaymentTarget | null) {
		session.current += 1;
		setTgt(t ?? null);
		setStep(t ? "method" : "who");
		setFolioId(t?.folioId ?? "");
		setGuestName(t?.guestName ?? "");
		setAmount(t?.amountDue ?? "");
		setTip("");
		setDescription(t?.description ?? "Room charges");
		setMethod("CARD");
		setTerminal(defaultTerminal(terminals, t?.role, t?.terminalId));
		setCard("waiting");
		setAttempt(0);
		setTendered("");
		setReceipt(t?.guestEmail ? "EMAIL" : "NONE");
		setContact(t?.guestEmail ?? "");
		setRecorded(null);
		setCardError(null);
		setTill(null);
		setTillFloat("");
	}

	// Picking cash asks whether this desk's till is open; an unreadable answer lets the desk carry on (payment-service checks too).
	useEffect(() => {
		if (step !== "method" || method !== "CASH") return;
		let stale = false;
		cashTill(tgt?.role)
			.then((r) => {
				if (!stale) setTill(r.ok ? r.data : null);
			})
			.catch(() => !stale && setTill(null));
		return () => {
			stale = true;
		};
	}, [step, method, tgt?.role]);

	async function openMyTill() {
		if (!till) return;
		setOpeningTill(true);
		const r = await openTill({
			role: till.role,
			openingFloat: typeof tillFloat === "number" ? tillFloat : undefined,
		}).catch(() => null);
		setOpeningTill(false);
		if (!r?.ok) {
			const again = await cashTill(tgt?.role).catch(() => null);
			if (again?.ok && again.data.open) {
				setTill(again.data);
				return;
			}
			toast.error(r && !r.ok ? r.error : "The till could not be opened");
			return;
		}
		toast.success(`${deskLabel(till.role)} till opened`, {
			description: `Float ${naira(r.data.openingFloat)} · now take the cash`,
		});
		setTill({ ...till, open: true, message: null });
	}

	// Card: send the request to payment-service and show what the terminal answered. Each attempt is sent exactly once
	// (a re-run of this effect, e.g. React re-mounting it, never sends it again), and only the latest attempt's answer is
	// shown.
	// biome-ignore lint/correctness/useExhaustiveDependencies: a new attempt re-sends; the other values are read once per attempt
	useEffect(() => {
		if (step !== "card") return;
		const key = `${session.current}:${attempt}`;
		live.current = key;
		if (sent.current === key) return;
		sent.current = key;
		const cancelled = () => live.current !== key;
		setCard("waiting");
		setCardError(null);
		const n = typeof amount === "number" ? amount : 0;
		const t = setTimeout(() => !cancelled() && setCard("paying"), 700);
		recordPayment({
			method,
			amount: n,
			folioId: folioId || tgt?.folioId,
			bookingId: tgt?.bookingId,
			guestName,
			guestPhone: tgt?.guestPhone,
			guestEmail: tgt?.guestEmail,
			description,
			// The receipt is chosen after the terminal answers, so nothing is sent automatically here.
			receipt: "NONE",
			orderId: tgt?.orderId,
			role: tgt?.role,
			terminalId: terminal || undefined,
			partId: tgt?.partId,
			tipAmount: tipN || undefined,
		})
			.then((r) => {
				clearTimeout(t);
				if (cancelled()) return;
				if (!r.ok) {
					setCardError(r.error);
					setCard("no_response");
					return;
				}
				setRecorded({
					...r.data,
					guestName,
					folioId: folioId || tgt?.folioId,
					bookingId: tgt?.bookingId,
				});
				if (r.data.status === "APPROVED") setCard("approved");
				else if (
					r.data.status === "DECLINED" ||
					r.data.status === "FAILED" ||
					r.data.status === "TIMED_OUT"
				)
					setCard("declined");
				else if (r.data.status === "NO_RESPONSE") setCard("no_response");
				else setCard("sent");
			})
			.catch((e: unknown) => {
				// The call itself failed (network, a new deployment): say so instead of spinning forever.
				clearTimeout(t);
				if (cancelled()) return;
				setCardError(
					e instanceof Error
						? `The payment could not be sent: ${e.message}. Nothing was charged.`
						: "The payment could not be sent. Nothing was charged.",
				);
				setCard("no_response");
			});
	}, [step, attempt]);

	/**
	 * Sent to the POS: every 4 seconds ask our backend (payment-service) for the payment's status, nothing else; the browser
	 * never talks to the POS provider. The backend learns the answer from the provider's webhook, and its own pending-payment
	 * check asks the provider when a webhook is late. Approved or declined shows at once; after 3 minutes without an answer
	 * the spinner stops ("Still waiting for the POS"), and the folio still updates on its own when the POS confirms.
	 */
	const recordedId = recorded?.id;
	useEffect(() => {
		if (step !== "card" || card !== "sent" || !recordedId) return;
		let stopped = false;
		let busy = false;
		const started = Date.now();
		const timer = setInterval(async () => {
			if (stopped || busy) return;
			busy = true;
			try {
				const r = await paymentStatus(recordedId).catch(() => null);
				if (stopped) return;
				const status = r?.ok ? (r.data.status as string) : null;
				if (status === "APPROVED") {
					setRecorded((x) => (x ? { ...x, status: "APPROVED" } : x));
					setCard("approved");
				} else if (
					status === "DECLINED" ||
					status === "FAILED" ||
					status === "CANCELLED" ||
					status === "TIMED_OUT"
				) {
					const reason = r?.ok ? r.data.failureReason : null;
					setRecorded((x) => (x ? { ...x, status: status as PaymentStatus, failureReason: reason } : x));
					setCard("declined");
				} else if (Date.now() - started > 180_000) {
					setCard("stalled");
				}
			} finally {
				busy = false;
			}
		}, 4000);
		return () => {
			stopped = true;
			clearInterval(timer);
		};
	}, [step, card, recordedId]);

	/**
	 * "Try again on POS": a payment the terminal didn't answer may still be charged. Ask payment-service first: approved →
	 * done; still waiting at the terminal → don't send a second one; declined/failed (or never sent) → send a new attempt.
	 */
	async function retryCard() {
		const prev = recorded;
		if (prev?.id && !["DECLINED", "FAILED"].includes(prev.status)) {
			setCardError(null);
			setCard("waiting");
			const v = await verifyPayment(prev.id);
			if (v.ok && v.data.status === "APPROVED") {
				setRecorded({ ...prev, status: "APPROVED" });
				setCard("approved");
				return;
			}
			if (v.ok && !["DECLINED", "FAILED"].includes(v.data.status)) {
				setCardError(
					"This payment is still waiting at the terminal. Finish or cancel it on the terminal, then try again, so the guest isn't charged twice.",
				);
				setCard("no_response");
				return;
			}
		}
		setRecorded(null);
		setAttempt((a) => a + 1);
	}

	const amt = typeof amount === "number" ? amount : 0;
	const tipN = tgt?.tipAllowed && tgt.orderId && typeof tip === "number" ? tip : 0;
	const folio = folios.find((f) => f.id === folioId);
	// Which POS the payment went to: payment-service's answer, else the one picked here.
	const posName =
		recorded?.terminalName ??
		terminals.find((t) => t.id === terminal)?.name ??
		"the POS";
	const picked = terminals.find((t) => t.id === terminal);
	// The serial only when it is the same terminal payment-service named.
	const posRef =
		picked && (!recorded?.terminalName || picked.name === recorded.terminalName)
			? picked.ref
			: undefined;
	const title = {
		idle: "",
		who: "Take a payment",
		method: "How is the guest paying?",
		card:
			card === "approved"
				? "Approved on the terminal"
				: card === "declined"
					? recorded?.status === "TIMED_OUT"
						? "Timed out on the POS"
						: "Declined on the terminal"
					: card === "no_response"
						? cardError
							? "The card wasn't sent"
							: "No response from the terminal"
						: card === "sent"
							? `Sent to ${posName}`
							: card === "stalled"
								? `Still waiting for ${posName}`
								: "Waiting for the guest on the POS",
		cash: "Cash",
		receipt: "Send a receipt",
		done:
			recorded && recorded.status !== "APPROVED"
				? "Payment sent"
				: "Payment recorded",
	}[step];
	const subtitle = guestName
		? `${guestName}${folio?.roomNumber ? ` · Room ${folio.roomNumber}` : tgt?.roomNumber ? ` · Room ${tgt.roomNumber}` : ""} · ${naira(amt)}`
		: "Choose who is paying";

	async function finish(choice: "EMAIL" | "NONE" | "WHATSAPP" = receipt) {
		setSending(true);
		let payment = recorded;
		if (!payment) {
			// Transfer and cash are recorded when the desk confirms them.
			const r = await recordPayment({
				method,
				amount: amt,
				folioId: folioId || tgt?.folioId,
				bookingId: tgt?.bookingId,
				guestName,
				guestPhone: tgt?.guestPhone,
				guestEmail:
					choice === "EMAIL" && contact.trim()
						? contact.trim()
						: tgt?.guestEmail,
				description,
				// Emailed below, once, with the on-screen echo.
				receipt: "NONE",
				orderId: tgt?.orderId,
				role: tgt?.role,
				partId: tgt?.partId,
				tipAmount: tipN || undefined,
			}).catch(
				(e: unknown) =>
					({
						ok: false,
						error:
							e instanceof Error
								? `The payment could not be recorded: ${e.message}`
								: "The payment could not be recorded",
					}) as const,
			);
			if (!r.ok) {
				setSending(false);
				toast.error(r.error);
				// The till was closed meanwhile: back to the method step, which offers to open it.
				if (method === "CASH" && r.error.startsWith("Open your till first")) {
					const again = await cashTill(tgt?.role).catch(() => null);
					if (again?.ok) setTill(again.data);
					setStep("method");
				}
				return;
			}
			payment = {
				...r.data,
				guestName,
				folioId: folioId || tgt?.folioId,
				bookingId: tgt?.bookingId,
			};
			setRecorded(payment);
		}
		let receiptNote = choice === "NONE" ? "Print it from the next screen" : "";
		if (choice === "EMAIL" && payment.status === "APPROVED") {
			const sent = await withDeliveries(
				emailReceipt({ paymentId: payment.id, to: contact, text: "" }),
				`Receipt for ${guestName}`,
			).catch(() => null);
			receiptNote = sent?.ok
				? `Receipt emailed to ${sent.data.to}`
				: `The receipt wasn't emailed${sent && !sent.ok ? `: ${sent.error}` : ""} · print it or email it from the receipt page`;
		} else if (choice === "EMAIL") {
			receiptNote = "Email the receipt from My payments once it is approved";
		} else if (choice === "WHATSAPP" && payment.status === "APPROVED") {
			const sent = await withDeliveries(
				resendReceipt(payment.id),
				`Receipt for ${guestName}`,
			).catch(() => null);
			receiptNote = sent?.ok
				? `Receipt sent on WhatsApp to ${sent.data.sentTo}`
				: `The receipt wasn't sent${sent && !sent.ok ? `: ${sent.error}` : ""} · print it from the next screen`;
		} else if (choice === "WHATSAPP") {
			receiptNote = "Send the receipt from My payments once it is approved";
		}
		setSending(false);
		const label =
			method === "CARD"
				? "by card"
				: method === "TRANSFER"
					? "by transfer"
					: "in cash";
		if (payment.status === "APPROVED")
			toast.success(`${naira(amt)} ${label} recorded`, {
				description: receiptNote,
			});
		else
			toast.info(`${naira(amt)} ${label} is processing`, {
				description: "The POS confirms it; see My payments",
			});
		onDone?.(payment);
		setStep("done");
	}

	const footer = (() => {
		switch (step) {
			case "who":
				return (
					<>
						<button type="button" className={btn.secondary} onClick={onFinish}>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!guestName || amt <= 0}
							onClick={() => setStep("method")}
						>
							Continue · {naira(amt)}
						</button>
					</>
				);
			case "method":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => (tgt ? (onBack ?? onFinish)() : setStep("who"))}
						>
							Back
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={amt <= 0 || (toPos && !terminal) || tillBlocked}
							title={tillBlocked ? "Open your till first" : undefined}
							onClick={() => setStep(toPos ? "card" : "cash")}
						>
							{toPos ? "Send to POS" : "Count cash"}
						</button>
					</>
				);
			case "card":
				if (card === "stalled")
					return (
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => setCard("sent")}
							>
								Check again
							</button>
							<button
								type="button"
								className={btn.primary}
								onClick={() => setStep("receipt")}
							>
								Continue to receipt
							</button>
						</>
					);
				if (card === "approved" || card === "sent")
					return (
						<button
							type="button"
							className={btn.primary}
							onClick={() => setStep("receipt")}
						>
							Continue to receipt
						</button>
					);
				if (card === "declined" || card === "no_response")
					return (
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => {
									setRecorded(null);
									setStep("method");
								}}
							>
								Try another way
							</button>
							<button
								type="button"
								className={btn.primary}
								onClick={() => void retryCard()}
							>
								Try again on POS
							</button>
						</>
					);
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => {
								setRecorded(null);
								setStep("method");
							}}
						>
							Cancel payment
						</button>
						<button type="button" className={btn.primary} onClick={onFinish}>
							Minimize
						</button>
					</>
				);
			case "cash":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setStep("method")}
						>
							Back
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={typeof tendered !== "number" || tendered < amt + tipN}
							onClick={() => setStep("receipt")}
						>
							Cash received
						</button>
					</>
				);
			case "receipt":
				return (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => {
								setReceipt("NONE");
								void finish("NONE");
							}}
							disabled={sending}
						>
							Skip receipt
						</button>
						<button
							type="button"
							className={btn.primary}
							onClick={() => void finish()}
							disabled={
								sending ||
								(receipt === "EMAIL" && !/^\S+@\S+\.\S+$/.test(contact.trim()))
							}
						>
							{sending ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : receipt === "NONE" ? (
								"Record payment"
							) : receipt === "WHATSAPP" ? (
								"Send on WhatsApp & record"
							) : (
								"Email receipt & record"
							)}
						</button>
					</>
				);
			case "done":
				return (
					<button
						type="button"
						className={btn.primary}
						disabled={doneBusy}
						onClick={onFinish}
					>
						{doneBusy ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							doneLabel
						)}
					</button>
				);
			case "idle":
				return null;
		}
	})();

	const body = (
		<>
			{step === "who" && (
				<div className="flex flex-col gap-4">
					<SelectField
						label="Guest folio"
						value={folioId}
						onChange={(v) => {
							setFolioId(v);
							const f = folios.find((x) => x.id === v);
							if (f) {
								setGuestName(f.guestName);
								setAmount(Math.max(0, f.balance));
							}
						}}
						placeholder="Pick an open folio…"
						options={folios
							.filter(
								(f) =>
									f.status === "OPEN" || f.status === "CLOSED_WITH_BALANCE",
							)
							.map((f) => ({
								value: f.id,
								label: `${f.guestName} · Room ${f.roomNumber}`,
								hint: `${f.balance > 0 ? `${naira(f.balance)} due` : "Paid up"} · ${f.reference}`,
							}))}
					/>
					<p className="text-center text-xs text-ink-3">
						or a walk-in / someone without a folio
					</p>
					<TextField
						label="Who is paying"
						value={guestName}
						onChange={setGuestName}
						placeholder="Name on the receipt"
					/>
					<MoneyField
						label="Amount"
						value={amount}
						onChange={setAmount}
						required
					/>
					<TextField
						label="What for"
						value={description}
						onChange={setDescription}
					/>
				</div>
			)}

			{step === "method" && (
				<div className="flex flex-col gap-4">
					{editAmount ? (
						<MoneyField
							label="Amount"
							value={amount}
							onChange={setAmount}
							required
							hint={
								tgt && tgt.amountDue > 0
									? `${naira(tgt.amountDue)} outstanding`
									: undefined
							}
						/>
					) : (
						<TotalsList
							rows={[{ label: "Taking", value: nairaExact(amt), strong: true }]}
						/>
					)}
					{tgt?.tipAllowed && tgt.orderId && (
						<>
							<MoneyField
								label="Tip (optional)"
								value={tip}
								onChange={setTip}
								hint={`Not part of the sale. Recorded for ${tgt.tipFor || "whoever served"}`}
							/>
							{tipN > 0 && (
								<TotalsList
									rows={[
										{ label: "Bill", value: nairaExact(amt) },
										{ label: "Tip", value: nairaExact(tipN) },
										{ label: "The guest pays", value: nairaExact(amt + tipN), strong: true },
									]}
								/>
							)}
						</>
					)}
					<ChoiceCards
						label="Method"
						value={method}
						onChange={setMethod}
						options={[
							{
								value: "CARD",
								label: "Card on the POS",
								hint: "Sent to the POS · the guest taps or inserts a card there",
							},
							{
								value: "TRANSFER",
								label: "Bank transfer on the POS",
								hint: "Sent to the POS · the guest chooses transfer there and pays to the account it shows",
							},
							{
								value: "CASH",
								label: "Cash",
								// Only the front office, bar and kitchen desks have a till; laundry hands cash in.
								hint: tgt?.role === "LAUNDRY" ? "Count it and hand it in" : "Goes into your till",
							},
						]}
					/>
					{tillBlocked && till && (
						<Note tone="warning">
							<p className="font-semibold text-ink">Open your till first</p>
							<p className="mt-1">
								Cash taken at the {deskLabel(till.role).toLowerCase()} goes into the{" "}
								{deskLabel(till.role).toLowerCase()} till, and it isn't open. Count the float
								in the drawer and open it here, or take card or transfer instead.
							</p>
							<div className="mt-3 flex flex-wrap items-end gap-2">
								<div className="min-w-[160px] flex-1">
									<MoneyField
										label="Opening float"
										value={tillFloat}
										onChange={setTillFloat}
										hint="Leave blank for the hotel's usual float"
									/>
								</div>
								<button
									type="button"
									className={btn.primary}
									disabled={openingTill}
									onClick={() => void openMyTill()}
								>
									{openingTill ? "Opening…" : `Open the ${deskLabel(till.role).toLowerCase()} till`}
								</button>
							</div>
							<a
								href={TILL_PAGE}
								className="mt-2 inline-block text-[13px] font-semibold text-brand underline"
							>
								Go to the Till page
							</a>
						</Note>
					)}
					{toPos && (
						<SelectField
							label="Terminal"
							value={terminal}
							onChange={setTerminal}
							options={terminals.map((t) => ({
								value: t.id,
								label: `${t.name} · ${t.provider}`,
								hint:
									t.status === "ONLINE"
										? "Online"
										: "Offline · last seen yesterday",
							}))}
							setupLink="terminals"
							empty="No POS terminal at this hotel yet"
						/>
					)}
					{toPos && terminals.length === 0 && (
						<Note tone="warning">
							Card and transfer payments go to a POS terminal, and this hotel has none linked yet. Take cash for now;
							the manager links terminals in Payments → Terminals → Link terminal.
						</Note>
					)}
					{toPos &&
						terminals.find((t) => t.id === terminal)?.status === "OFFLINE" && (
							<Note tone="danger">
								That terminal is offline. Pick another or take cash.
							</Note>
						)}
				</div>
			)}

			{step === "card" && (
				<div className="flex flex-col items-center gap-4 py-6 text-center">
					{card === "approved" ? (
						<CheckCircle2Icon className="size-16 text-success" />
					) : card === "declined" || card === "no_response" ? (
						<XCircleIcon className="size-16 text-danger" />
					) : card === "stalled" ? (
						<ClockIcon className="size-16 text-warning" />
					) : (
						<span className="relative flex size-16 items-center justify-center">
							<span className="absolute inset-0 animate-ping rounded-full bg-brand-soft" />
							<Loader2Icon className="relative size-10 animate-spin text-brand" />
						</span>
					)}
					<div>
						<p className="text-lg font-bold text-ink">
							{card === "waiting"
								? `Sending to ${posName}…`
								: card === "paying"
									? "Processing on the terminal…"
									: card === "approved"
										? `${naira(amt)} approved`
										: card === "sent"
											? `${naira(amt)} sent to ${posName}`
											: card === "stalled"
												? `${posName} hasn't answered yet`
											: card === "declined"
												? recorded?.status === "TIMED_OUT"
													? `${posName} timed out`
													: recorded?.status === "FAILED"
													? "The payment didn't go through"
													: "The payment was declined"
												: cardError
													? "The card wasn't sent"
													: "The terminal didn't answer"}
						</p>
						<p className="mt-1 max-w-sm text-[13px] text-ink-3">
							{card === "approved"
								? `${recorded?.id ? `Payment ${recorded.id.slice(0, 8).toUpperCase()} · ` : ""}posted to the folio.`
								: card === "sent"
									? method === "TRANSFER"
										? "The guest chooses transfer on the POS and pays to the account it shows. Checking with the POS every few seconds: this changes to approved as soon as the transfer lands."
										: "The guest taps or inserts the card. Checking with the POS every few seconds: this changes to approved or declined as soon as it answers."
									: card === "stalled"
										? "No answer for 3 minutes. If the guest paid, it shows in My payments and on the folio as soon as the POS confirms. Check again, or continue and find it in My payments."
									: card === "declined" && recorded?.status === "TIMED_OUT"
										? "No final answer from the POS in 5 minutes. Check the terminal: if it shows Approved, this turns Approved on its own within a minute (find it in My payments). Otherwise try again or take cash."
									: card === "declined"
										? "Nothing was charged. Ask the guest to try again on the POS (another card or a transfer), or take cash."
										: card === "no_response"
											? (cardError ??
												"Check the terminal is on and connected, then try again. Nothing was charged.")
											: `Hand ${posName} to the guest. This updates when the POS answers.`}
						</p>
						{posRef && card !== "approved" && (
							<p className="mt-2 text-[12px] text-ink-3">
								POS: <span className="font-semibold text-ink-2">{posName}</span> · serial {posRef}
							</p>
						)}
						{card === "declined" && recorded?.failureReason && recorded.status !== "TIMED_OUT" && (
							<p className="mx-auto mt-3 max-w-sm rounded-lg bg-danger-soft px-3 py-2 text-[13px] font-semibold text-danger">
								Reason: {recorded.failureReason}
							</p>
						)}
					</div>
					<div className="flex gap-2">
						<StatusPill tone={card === "waiting" ? "grey" : "success"}>
							Sent to POS
						</StatusPill>
						<StatusPill
							tone={
								card === "waiting"
									? "grey"
									: card === "sent" || card === "stalled"
										? "info"
										: "warning"
							}
						>
							Guest paying
						</StatusPill>
						<StatusPill
							tone={
								card === "approved"
									? "success"
									: card === "paying" || card === "waiting" || card === "sent" || card === "stalled"
										? "grey"
										: "danger"
							}
						>
							Result
						</StatusPill>
					</div>
				</div>
			)}

			{step === "cash" && (
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[
							{
								label: tipN > 0 ? `Amount due (with the ${nairaExact(tipN)} tip)` : "Amount due",
								value: nairaExact(amt + tipN),
								strong: true,
							},
						]}
					/>
					<MoneyField
						label="Cash received"
						value={tendered}
						onChange={setTendered}
						required
					/>
					{typeof tendered === "number" && tendered >= amt + tipN && (
						<Note tone="success">Change to give: {nairaExact(tendered - amt - tipN)}</Note>
					)}
					{typeof tendered === "number" && tendered > 0 && tendered < amt + tipN && (
						<Note tone="danger">
							{nairaExact(amt + tipN - tendered)} short — take the rest another way or
							record a part payment.
						</Note>
					)}
				</div>
			)}

			{step === "receipt" && (
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[
							{ label: "Paid", value: naira(amt) },
							{
								label: "Method",
								value:
									method === "CARD"
										? "Card"
										: method === "TRANSFER"
											? "Transfer"
											: "Cash",
							},
							{ label: "Guest", value: guestName, strong: true },
						]}
					/>
					<Field label="Receipt">
						<div className="grid grid-cols-3 gap-2">
							{(
								[
									["EMAIL", "Email", MailIcon, false, undefined],
									["NONE", "Print", PrinterIcon, false, undefined],
									[
										"WHATSAPP",
										"WhatsApp",
										MessageCircleIcon,
										!waReceipt,
										waReceipt
											? `Sent to ${tgt?.guestPhone} with the receipt template`
											: tgt?.guestEmail
												? "This guest has an email: the receipt goes by email"
												: !tgt?.guestPhone
													? "Add the guest's phone to send it on WhatsApp"
													: "WhatsApp receipts can't be sent right now",
									],
								] as const
							).map(([key, label, Icon, soon, why]) => (
								<button
									key={key}
									type="button"
									disabled={soon}
									title={why}
									onClick={() => !soon && setReceipt(key)}
									className={cn(
										"flex flex-col items-center gap-2 rounded-control border px-3 py-3 text-center text-[13px] font-semibold",
										soon
											? "cursor-not-allowed border-line text-ink-3 opacity-60"
											: receipt === key
												? "border-brand bg-brand-soft/50 text-brand"
												: "border-line text-ink-2 hover:bg-subtle",
									)}
								>
									<Icon className="size-5" /> {label}
								</button>
							))}
						</div>
					</Field>
					{receipt === "EMAIL" && (
						<TextField
							label="Guest's email"
							type="email"
							value={contact}
							onChange={setContact}
							placeholder="guest@email.com"
						/>
					)}
				</div>
			)}

			{step === "done" && (
				<div className="flex flex-col items-center gap-3 py-8 text-center">
					<CheckCircle2Icon className="size-16 text-success" />
					<p className="text-lg font-bold text-ink">
						{naira(amt)}{" "}
						{recorded && recorded.status !== "APPROVED"
							? "processing"
							: "recorded"}
					</p>
					<p className="max-w-sm text-[13px] text-ink-3">
						{recorded && recorded.status !== "APPROVED"
							? `It shows in My payments as processing until it is confirmed; ${guestName}'s folio updates then.`
							: `${guestName}'s folio is updated and the payment is in My payments.`}{" "}
						{method === "CASH" ? "The cash is counted in your till." : ""}
					</p>
					{recorded?.id &&
						(recorded.status === "APPROVED" || card === "approved") && (
							<a
								href={`/receipt?payment=${encodeURIComponent(recorded.id)}`}
								target="_blank"
								rel="noopener"
								className={`${btn.secondary} flex items-center gap-2`}
							>
								<PrinterIcon className="size-4" /> Print receipt
							</a>
						)}
					{doneExtra}
				</div>
			)}
		</>
	);

	const footerInfo =
		step === "card" && card !== "approved"
			? "You can keep working · find it in My payments"
			: undefined;
	const view: PaymentStepsView = {
		title,
		subtitle,
		body,
		footer,
		footerInfo,
		step,
	};
	return { view, begin, step, recorded };
}

/** The steps as a render-prop component for hosts that mount them only while a payment is under way. */
export function PaymentSteps({
	children,
	...options
}: PaymentStepsOptions & { children: (view: PaymentStepsView) => ReactNode }) {
	const { view } = usePaymentSteps(options);
	return <>{children(view)}</>;
}

/** Standalone Record payment / Take a payment: one SidePanel around the steps. A fresh run on every open. */
export function TakePaymentPanel({
	open,
	onOpenChange,
	target,
	folios = [],
	terminals = [],
	onDone,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	target?: PaymentTarget | null;
	folios?: FolioSummary[];
	terminals?: TerminalRow[];
	onDone?: (payment: TakenPayment) => void;
}) {
	const [run, setRun] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the target is read when the panel opens
	useEffect(() => {
		if (open) setRun((n) => n + 1);
	}, [open]);
	return (
		<PaymentSteps
			key={run}
			target={target}
			folios={folios}
			terminals={terminals}
			onDone={onDone}
			onFinish={() => onOpenChange(false)}
			onBack={() => onOpenChange(false)}
			editAmount
		>
			{(v) => (
				<SidePanel
					open={open}
					onOpenChange={onOpenChange}
					title={v.title}
					subtitle={v.subtitle}
					icon={CreditCardIcon}
					footer={v.footer}
					footerInfo={v.footerInfo}
				>
					{v.body}
				</SidePanel>
			)}
		</PaymentSteps>
	);
}
