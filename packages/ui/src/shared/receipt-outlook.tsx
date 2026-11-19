"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCanSetup } from "./field";
import { guestMessagesOffText, receiptOutcomeText, receiptWentOut, type ReceiptOutcomeInfo } from "./receipt-channels";
import { usePlaceText } from "./wording";

/** The part of payment-service's receipt outlook the screens read (hospio-backend docs/whatsapp-receipts.md). */
export type GuestMessagesOutlook = { outcome: string; reason?: string | null; guestMessagesOn?: boolean | null };

/**
 * Asks once, when `enabled`, whether a WhatsApp receipt would go at this hotel (guest messages on and not suspended). `load` is
 * the scoped `receiptOutlook` action (an owner's booking may be at another branch). Null until known, or when it can't be told.
 */
export function useGuestMessagesOutlook(load: () => Promise<GuestMessagesOutlook | null>, enabled: boolean) {
	const [outlook, setOutlook] = useState<GuestMessagesOutlook | null>(null);
	useEffect(() => {
		if (!enabled) return;
		let stale = false;
		load()
			.then((o) => !stale && setOutlook(o))
			.catch(() => !stale && setOutlook(null));
		return () => {
			stale = true;
		};
	}, [enabled]);
	return outlook;
}

/**
 * The note under the receipt step's WhatsApp choice when the hotel's guest messages are off: staff know before paying that the
 * receipt won't go. Nothing while they are on or unknown.
 */
export function GuestMessagesOffNote({ outlook, className }: { outlook: GuestMessagesOutlook | null; className?: string }) {
	const canSetup = useCanSetup();
	const t = usePlaceText();
	if (!outlook || outlook.guestMessagesOn !== false) return null;
	const words = guestMessagesOffText(canSetup, outlook.reason);
	return (
		<p
			role="note"
			className={`flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 ${className ?? ""}`}
		>
			<InfoIcon className="mt-0.5 size-3.5 shrink-0" />
			<span>{t(`WhatsApp receipts won't go: ${words}`)}</span>
		</p>
	);
}

/** The words for a receipt's outcome in the place's wording, and whether it went (for success vs warning toasts). */
export function useReceiptOutcomeText() {
	const canSetup = useCanSetup();
	const t = usePlaceText();
	return (r: ReceiptOutcomeInfo) => ({ text: t(receiptOutcomeText(r, canSetup)), sent: receiptWentOut(r.outcome) });
}

/** A toast for a receipt sent on its own (Send receipt on WhatsApp, Send receipt again): success only when it really went. */
export function useReceiptToast() {
	const say = useReceiptOutcomeText();
	return (r: ReceiptOutcomeInfo) => {
		const { text, sent } = say(r);
		if (sent) toast.success(text);
		else toast.warning(text, { duration: 10000 });
	};
}

/**
 * The toast of a payment recorded with the automatic WhatsApp receipt (manager's Record a payment, a folio's Record payment):
 * `base` ("₦5,000 recorded") plus what became of the receipt, as a warning when it won't go. No outlook: just `base`.
 */
export function useRecordedWords() {
	const say = useReceiptOutcomeText();
	return (base: string, receipt?: ReceiptOutcomeInfo | null): string | { warning: string } => {
		if (!receipt) return base;
		const { text, sent } = say(receipt);
		return sent ? `${base} · ${text}` : { warning: `${base} · ${text}` };
	};
}
