"use client";

import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { TextField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { looksLikePhone } from "@hospio/ui/shared/receipt-channels";
import { btn } from "@hospio/ui/shared/ui";
import { sendReceipt } from "@hospio/api/actions/payment";
import { useAction } from "@hospio/api/actions/use-action";
import { cn } from "@hospio/ui/utils";

/**
 * "Send receipt on WhatsApp" for one approved payment (My payments, a sale, a split bill's part, Payments): asks for the guest's
 * WhatsApp number (the payment's phone filled in) and sends the approved receipt template. Payment receipts are never printed or
 * emailed (hospio-backend docs/whatsapp-receipts.md).
 */
export function WhatsAppReceiptButton({
	paymentId,
	phone,
	guestName,
	label = "Send receipt on WhatsApp",
	className,
	onSent,
}: {
	paymentId: string;
	phone?: string | null;
	guestName?: string | null;
	label?: string;
	className?: string;
	onSent?: (sentTo: string) => void;
}) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button
				type="button"
				variant="outline"
				className={cn(btn.secondary, "flex items-center gap-2", className)}
				onClick={() => setOpen(true)}
			>
				<MessageCircleIcon className="size-4" /> {label}
			</Button>
			{open && (
				<WhatsAppReceiptModal
					paymentId={paymentId}
					phone={phone}
					guestName={guestName}
					onClose={() => setOpen(false)}
					onSent={onSent}
				/>
			)}
		</>
	);
}

export function WhatsAppReceiptModal({
	paymentId,
	phone,
	guestName,
	onClose,
	onSent,
}: {
	paymentId: string;
	phone?: string | null;
	guestName?: string | null;
	onClose: () => void;
	onSent?: (sentTo: string) => void;
}) {
	const { run, pending } = useAction();
	const [to, setTo] = useState(phone ?? "");
	// Empty: the phone the payment already has (payment-service refuses in words when there is none).
	const ok = !to.trim() || looksLikePhone(to);
	return (
		<Modal
			open
			onOpenChange={(o) => !o && onClose()}
			title="Send receipt on WhatsApp"
			subtitle={guestName ?? undefined}
			icon={MessageCircleIcon}
			size="form"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || !ok}
						onClick={() =>
							run(
								() => withDeliveries(sendReceipt({ paymentId, phone: to }), `Receipt for ${guestName ?? "the guest"}`),
								(r) => `Receipt sent on WhatsApp to ${r.sentTo}`,
								(r) => {
									onSent?.(r.sentTo);
									onClose();
								},
							)
						}
					>
						Send on WhatsApp
					</Button>
				</>
			}
		>
			<TextField
				label="Guest's WhatsApp number"
				type="tel"
				value={to}
				onChange={setTo}
				placeholder="+234 803 555 0192"
				hint="Empty: the number on the payment. The receipt goes as the approved WhatsApp receipt message; receipts are not printed or emailed."
				error={to.trim() && !ok ? "Type a real phone number, like +234 803 555 0192" : undefined}
			/>
		</Modal>
	);
}
