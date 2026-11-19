"use client";

import { FileDownIcon } from "lucide-react";
import { Button } from "@hospio/ui/primitives/button";
import { DeliveryNotice } from "@hospio/ui/shared/delivery-notice";
import { btn } from "@hospio/ui/shared/ui";
import { WhatsAppReceiptButton } from "./whatsapp-receipt";
import {
	methodLabel,
	type ReceiptDoc,
	shownSubtotal,
	taxIncluded,
} from "@hospio/api/data/receipt-types";
import { cn } from "@hospio/ui/utils";

const money = (n: number) =>
	`₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso?: string) =>
	iso
		? new Date(iso).toLocaleString("en-GB", {
				timeZone: "Africa/Lagos",
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: "";

/**
 * The receipt page, for managers, finance and the owner: the receipt as a document to keep, and above it Save as PDF (the browser's
 * "Save as PDF", A4) and, for one payment, Send on WhatsApp. Guests get their receipt on WhatsApp only: receipts are not printed for
 * them or emailed (hospio-backend docs/whatsapp-receipts.md), so there is no paper size or Email here. The toolbar is never saved.
 */
export function ReceiptView({
	doc,
	error,
}: {
	doc: ReceiptDoc | null;
	error?: string;
	/** Old links may still carry `paper=80mm`; the receipt is always A4 now. */
	paper?: "a4" | "80mm";
}) {
	const paper = "a4" as "a4" | "80mm";
	const narrow = paper === "80mm";

	return (
		<div className="min-h-screen bg-subtle/60 py-6 print:bg-white print:py-0">
			<style>{"@page { size: A4; margin: 14mm; }"}</style>
			<style>
				{
					"@media print { body { background: #fff !important; } .no-print, body .fixed, [data-sonner-toaster] { display: none !important; } }"
				}
			</style>

			<div className="no-print mx-auto mb-4 flex max-w-[720px] flex-wrap items-end gap-3 px-4">
				<Button
					className={btn.primary}
					disabled={!doc || !!doc.empty}
					onClick={() => window.print()}
				>
					<FileDownIcon className="size-4" /> Save as PDF
				</Button>
				{doc && !doc.empty && doc.ref.paymentId && (
					<WhatsAppReceiptButton
						paymentId={doc.ref.paymentId}
						phone={doc.guestPhone}
						guestName={doc.guest}
						label="Send on WhatsApp"
					/>
				)}
				<p className="w-full text-[12px] text-ink-3">
					In the save window pick "Save as PDF" as the destination. Guests get their receipt on WhatsApp.
				</p>
			</div>

			{!doc ? (
				<p className="mx-auto max-w-[720px] rounded-card border border-line bg-card p-6 text-[14px] text-ink">
					{error ?? "This receipt could not be read."}
				</p>
			) : (
				<article
					data-paper={paper}
					className={cn(
						"mx-auto bg-white text-[#111] shadow-sm print:shadow-none",
						narrow
							? "w-[80mm] max-w-full px-[4mm] py-[5mm] font-mono text-[11px] leading-snug print:w-full print:p-0"
							: "max-w-[720px] rounded-card border border-line px-10 py-9 text-[13px] print:max-w-none print:rounded-none print:border-0 print:p-0",
					)}
				>
					<header
						className={cn(
							"flex flex-col",
							narrow
								? "items-center text-center"
								: "flex-row items-start justify-between gap-6",
						)}
					>
						<div className={narrow ? "" : "max-w-[60%]"}>
							<h1
								className={cn(
									"font-bold",
									narrow ? "text-[14px]" : "text-[22px]",
								)}
							>
								{doc.hotel.name}
							</h1>
							{doc.hotel.address && <p>{doc.hotel.address}</p>}
							{doc.hotel.phone && <p>Tel {doc.hotel.phone}</p>}
							{doc.hotel.email && !narrow && <p>{doc.hotel.email}</p>}
						</div>
						<div className={narrow ? "mt-2" : "text-right"}>
							<p
								className={cn(
									"font-bold uppercase tracking-wide",
									narrow ? "text-[12px]" : "text-[15px]",
								)}
							>
								{doc.title}
							</p>
							{doc.numbers.length > 0 && (
								<p data-testid="receipt-number">No. {doc.numbers.join(", ")}</p>
							)}
							{doc.reference && <p>Ref {doc.reference}</p>}
							<p>{when(doc.issuedAt)}</p>
						</div>
					</header>

					{(doc.guest || doc.room || doc.servedBy) && (
						<section
							className={cn(
								"mt-4 grid gap-x-6",
								narrow
									? "border-y border-dashed border-[#999] py-2"
									: "grid-cols-3 rounded-lg bg-[#f6f6f6] px-4 py-3",
							)}
						>
							{doc.guest && (
								<p>
									<span className="text-[#666]">Guest</span> {doc.guest}
								</p>
							)}
							{doc.room && (
								<p>
									<span className="text-[#666]">Room</span> {doc.room}
								</p>
							)}
							{doc.servedBy && (
								<p>
									<span className="text-[#666]">Served by</span> {doc.servedBy}
								</p>
							)}
						</section>
					)}

					{doc.empty ? (
						<p className="mt-6">{doc.empty}</p>
					) : (
						<>
							<table className="mt-4 w-full border-collapse">
								<thead>
									<tr
										className={cn(
											"text-left",
											narrow
												? "border-b border-dashed border-[#999]"
												: "border-b border-[#ddd] text-[11px] uppercase tracking-wide text-[#666]",
										)}
									>
										<th className="py-1 font-semibold">Item</th>
										{!narrow && (
											<th className="py-1 text-right font-semibold">Qty</th>
										)}
										{!narrow && (
											<th className="py-1 text-right font-semibold">Price</th>
										)}
										<th className="py-1 text-right font-semibold">Amount</th>
									</tr>
								</thead>
								<tbody>
									{doc.lines.map((l, i) => (
										<tr
											key={`${i}-${l.label}`}
											className={narrow ? "" : "border-b border-[#eee]"}
										>
											<td className="py-1 pr-2 align-top">
												{narrow && l.qty ? `${l.qty} × ` : ""}
												{l.label}
												{l.note && (
													<span className="block text-[#666]">{l.note}</span>
												)}
											</td>
											{!narrow && (
												<td className="py-1 text-right align-top">
													{l.qty ?? ""}
												</td>
											)}
											{!narrow && (
												<td className="py-1 text-right align-top">
													{l.unit !== undefined ? money(l.unit) : ""}
												</td>
											)}
											<td className="py-1 text-right align-top whitespace-nowrap">
												{money(l.amount)}
											</td>
										</tr>
									))}
								</tbody>
							</table>

							<dl
								className={cn(
									"mt-3 ml-auto grid grid-cols-[1fr_auto] gap-x-4 gap-y-[2px]",
									narrow
										? "w-full border-t border-dashed border-[#999] pt-2"
										: "w-[300px]",
								)}
							>
								<dt>Subtotal</dt>
								<dd className="text-right">{money(shownSubtotal(doc))}</dd>
								{doc.discount > 0 && (
									<>
										<dt>Discount</dt>
										<dd className="text-right">−{money(doc.discount)}</dd>
									</>
								)}
								{doc.tax > 0 && (
									<>
										<dt>{taxIncluded(doc) ? "Tax included" : "Tax"}</dt>
										<dd className="text-right">{money(doc.tax)}</dd>
									</>
								)}
								<dt className="font-bold">Total</dt>
								<dd
									className="text-right font-bold"
									data-testid="receipt-total"
								>
									{money(doc.total)}
								</dd>
							</dl>

							<section
								className={cn(
									"mt-4",
									narrow ? "border-t border-dashed border-[#999] pt-2" : "",
								)}
							>
								<h2
									className={cn(
										"font-semibold",
										narrow
											? ""
											: "text-[11px] uppercase tracking-wide text-[#666]",
									)}
								>
									Payment
								</h2>
								<ul className="mt-1 flex flex-col gap-[2px]">
									{doc.payments.map((p, i) => (
										<li
											key={`${i}-${p.number ?? p.method}`}
											className="flex justify-between gap-3"
										>
											<span>
												{methodLabel(p.method)}
												{p.reference ? ` · ref ${p.reference}` : ""}
												{p.number ? ` · ${p.number}` : ""}
												{p.takenBy ? (
													<span className="text-[#666]">
														{" "}
														· taken by {p.takenBy}
													</span>
												) : null}
											</span>
											<span className="whitespace-nowrap">
												{money(p.amount)}
											</span>
										</li>
									))}
								</ul>
								<dl
									className={cn(
										"mt-2 ml-auto grid grid-cols-[1fr_auto] gap-x-4",
										narrow ? "w-full" : "w-[300px]",
									)}
								>
									<dt>Paid</dt>
									<dd className="text-right" data-testid="receipt-paid">
										{money(doc.paid)}
									</dd>
									{doc.balance > 0.004 && (
										<>
											<dt className="font-bold">Balance due</dt>
											<dd className="text-right font-bold">
												{money(doc.balance)}
											</dd>
										</>
									)}
								</dl>
							</section>
						</>
					)}

					<footer
						className={cn(
							"mt-6 text-center",
							narrow
								? "border-t border-dashed border-[#999] pt-2"
								: "text-[#666]",
						)}
					>
						<p>{doc.footer ?? "Thank you"}</p>
					</footer>
				</article>
			)}
			<DeliveryNotice />
		</div>
	);
}
