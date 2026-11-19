import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { mySuspension } from "@hospio/api/actions/suspension";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { buildReceipt } from "@hospio/api/data/receipt-doc";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt · Hospio360" };

/**
 * A receipt as a document to keep (Save as PDF, A4), outside the dashboard shell so only the receipt is saved: `?payment=<paymentId>`,
 * `?sale=<orderId>` or `?folio=<folioId or bookingId>`. Reached from Manager · Payments (Receipt PDF) and the folio's Copy / PDF; guests
 * get their receipts on WhatsApp, never printed or emailed (hospio-backend docs/whatsapp-receipts.md). An old `&paper=80mm` is ignored.
 */
export default async function ReceiptPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const sp = await searchParams;
	// A suspended business has the one screen (hospio-backend docs/suspension.md).
	if ((await mySuspension()).suspended) redirect("/suspended");
	const one = (k: string) =>
		typeof sp[k] === "string" ? (sp[k] as string) : undefined;
	const doc = await buildReceipt({
		payment: one("payment"),
		sale: one("sale"),
		folio: one("folio"),
	});
	return (
		<ReceiptView
			doc={"error" in doc ? null : doc}
			error={"error" in doc ? doc.error : undefined}
		/>
	);
}
