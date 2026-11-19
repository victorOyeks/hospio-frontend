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
