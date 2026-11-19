/**
 * The receipt choice a payment screen offers (the owner, 19 Nov 2026): WhatsApp to the guest's phone (the approved
 * hospio_payment_receipt_v2 template), or Don't send. Receipts are never printed, emailed or sent by SMS
 * (hospio-backend docs/whatsapp-receipts.md). Plain module so any screen can import it.
 */
export type ReceiptChoice = "WHATSAPP" | "NONE";

/** WhatsApp when the guest's phone is known, else Don't send. */
export function defaultReceipt(phone?: string | null): ReceiptChoice {
	return phone?.trim() ? "WHATSAPP" : "NONE";
}

export function receiptOptions(phone?: string | null) {
	return [
		{
			value: "WHATSAPP" as ReceiptChoice,
			label: "WhatsApp",
			hint: phone?.trim() || "No phone for this guest",
			disabled: !phone?.trim(),
		},
		{
			value: "NONE" as ReceiptChoice,
			label: "Don't send",
			hint: "No receipt",
		},
	];
}

/** Same check as the backend's (10 to 15 digits, an optional +), so the button waits for a real number. */
export function looksLikePhone(phone: string) {
	const t = phone.trim();
	const d = t.replace(/[^0-9]/g, "");
	return /^\+?[0-9 ()-]{7,24}$/.test(t) && d.length >= 10 && d.length <= 15;
}

/** What became of a WhatsApp receipt (hospio-backend docs/whatsapp-receipts.md, "What the desk is told"). */
export type ReceiptOutcomeInfo = {
	outcome?: string | null;
	reason?: string | null;
	sentTo?: string | null;
};

/** Whether the receipt really went on its way (QUEUED, or UNKNOWN: handed over, messaging couldn't be asked). */
export function receiptWentOut(outcome?: string | null) {
	return !outcome || outcome === "QUEUED" || outcome === "UNKNOWN";
}

/** The hotel's guest messages are off (or suspended): the words for it, telling a manager where to turn them on. */
export function guestMessagesOffText(canSetup: boolean, reason?: string | null) {
	if (reason && /suspended/i.test(reason)) {
		return `guest messages are on hold (${reason.replace(/^Not sent: /, "").replace(/^Guest messages are suspended: /, "")})`;
	}
	return canSetup
		? "guest messages are off for this hotel. Turn them on in Hotel setup → Guest messages."
		: "guest messages are off for this hotel. Ask your manager to turn them on.";
}

/**
 * The words staff see after a WhatsApp receipt, by its outcome: "Receipt sent on WhatsApp to …" only when it really went.
 * `canSetup`: the manager or owner (Hotel setup), else "ask your manager". Pass the result through `usePlaceText` for a lounge.
 */
export function receiptOutcomeText(r: ReceiptOutcomeInfo, canSetup: boolean): string {
	const to = r.sentTo?.trim() || "the guest";
	switch (r.outcome) {
		case "SKIPPED":
			if (r.reason && /automatic receipts are off/i.test(r.reason))
				return "Receipt not sent: automatic receipts are off (Hotel setup → Guest messaging)";
			return `Receipt not sent: ${guestMessagesOffText(canSetup, r.reason)}`;
		case "HELD_BACK":
			return `Receipt held back (test server): ${to} is not on this server's allow-list`;
		case "NOT_CONNECTED":
			return "Receipt not sent: WhatsApp is not connected";
		case "NO_PHONE":
			return "Receipt not sent: no phone number";
		default:
			return `Receipt sent on WhatsApp to ${to}`;
	}
}
