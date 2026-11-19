"use client";

import { BanIcon, Loader2Icon, LogOutIcon, MailIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	confirmInvoicePayment,
	type InvoiceRowView,
	invoiceFile,
	myInvoice,
	payInvoice,
} from "@hospio/api/actions/billing";
import { mySuspension, type SuspensionStatusView } from "@hospio/api/actions/suspension";
import { HOSPIO_MAROON } from "@hospio/api/brand";
import { DownloadButton, money } from "../shared/invoice";

/**
 * "This account is suspended" (hospio-backend docs/suspension.md): the only screen anyone at a suspended business sees. No
 * navigation. The owner sees what is owed and can pay it (Paystack) and download invoices and receipts; managers and staff are
 * told to ask the owner. It checks every 30 seconds and lets everyone back in as soon as the suspension is lifted.
 */

export const SUSPENSION_CONTACT = "hello@oyeksglobal.com";
const POLL_MS = 30_000;
const OPEN = ["DUE", "OVERDUE"];

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
const shortDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function SuspendedScreen({
	status,
	owner,
	businessName,
	invoices,
	invoicesError,
	reference,
	onDevice,
	signOut,
}: {
	status: SuspensionStatusView;
	/** The owner sees amounts and pays; everyone else is told to ask the owner. */
	owner: boolean;
	businessName: string | null;
	invoices: InvoiceRowView[];
	invoicesError: string | null;
	/** Back from Paystack (?reference=). */
	reference: string | null;
	/** A shared device: the way out is the lock screen. */
	onDevice: boolean;
	signOut: () => Promise<void> | void;
}) {
	const [paying, setPaying] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(!!reference);
	const [leaving, setLeaving] = useState(false);
	const confirmed = useRef(false);

	// Lifted (paid, or Hospio360 reactivated): straight back into the app.
	const check = useCallback(async () => {
		const s = await mySuspension().catch(() => null);
		if (s && !s.suspended) window.location.assign("/dashboard");
	}, []);
	useEffect(() => {
		const timer = setInterval(() => void check(), POLL_MS);
		const onFocus = () => document.visibilityState === "visible" && void check();
		document.addEventListener("visibilitychange", onFocus);
		return () => {
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onFocus);
		};
	}, [check]);

	// Back from Paystack: confirm once (the webhook may already have done it), then look again.
	useEffect(() => {
		if (!reference || confirmed.current) return;
		confirmed.current = true;
		void confirmInvoicePayment(reference).then(async (r) => {
			if (r.ok) toast.success(`${r.data.number} is paid · thank you`);
			else if (/already paid|is paid/i.test(r.error)) toast.success("This invoice is paid · thank you");
			else toast.error(r.error, { duration: 8000 });
			const s = await mySuspension().catch(() => null);
			window.location.assign(s && !s.suspended ? "/dashboard" : "/suspended");
		});
	}, [reference]);

	const pay = useCallback(async (id: string) => {
		setPaying(id);
		const r = await payInvoice(id, `${window.location.origin}/suspended`);
		if (!r.ok) {
			setPaying(null);
			toast.error(r.error, { duration: 8000 });
			return;
		}
		window.location.assign(r.data.authorizationUrl);
	}, []);

	const unpaid = invoices.filter((i) => OPEN.includes(i.status) && i.outstanding > 0);
	const paid = invoices.filter((i) => i.status === "PAID").slice(0, 6);
	const total = unpaid.reduce((sum, i) => sum + i.outstanding, 0);
	const forInvoices = status.reasonType === "UNPAID_INVOICE";

	return (
		<main className="flex min-h-svh flex-col bg-page" data-testid="suspended-screen" data-audience={owner ? "owner" : "staff"}>
			<div className="h-2 w-full" style={{ backgroundColor: HOSPIO_MAROON }} />
			<div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-5 py-10">
				<div className="rounded-card border border-line bg-card p-6 shadow-sm sm:p-8">
					<div className="flex size-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: HOSPIO_MAROON }}>
						<BanIcon className="size-6" aria-hidden="true" />
					</div>
					<h1 className="mt-4 text-[24px] font-semibold leading-tight text-ink">This account is suspended</h1>
					<p className="mt-2 text-[15px] text-ink-2">
						{businessName ? <span className="font-medium text-ink">{businessName}</span> : "Your business"} can't use Hospio360 for now.
						{status.since ? ` Suspended since ${longDate(status.since)}.` : ""} Nothing has been deleted: your guests, sales and records are kept.
					</p>
					{status.reason && (
						<p className="mt-4 rounded-control border border-line bg-page px-4 py-3 text-[14px] text-ink" data-testid="suspended-reason">
							<span className="font-medium">Reason: </span>
							{status.reason}
						</p>
					)}

					{confirming && reference ? (
						<output className="mt-5 flex items-center gap-2 text-[14px] text-ink-2">
							<Loader2Icon className="size-4 animate-spin" /> Confirming your payment…
						</output>
					) : owner ? (
						<section className="mt-6" aria-label="What is owed" data-testid="suspended-owed">
							{unpaid.length > 0 ? (
								<>
									<h2 className="text-[15px] font-semibold text-ink">What is owed</h2>
									<ul className="mt-3 divide-y divide-line rounded-control border border-line">
										{unpaid.map((i) => (
											<li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3" data-testid="suspended-invoice">
												<div className="min-w-0 flex-1">
													<p className="text-[14px] font-medium text-ink">
														{i.number} · {i.monthLabel ?? i.month}
													</p>
													<p className="text-[13px] text-ink-2">Due {shortDay(i.dueOn)}</p>
												</div>
												<p className="text-[15px] font-semibold tabular-nums text-ink">{money(i.outstanding)}</p>
												<div className="flex items-center gap-3">
													<DownloadButton variant="link" load={() => invoiceFile({ kind: "pdf", id: i.id })}>
														PDF
													</DownloadButton>
													<button
														type="button"
														disabled={paying !== null}
														onClick={() => void pay(i.id)}
														className="inline-flex items-center gap-2 rounded-control px-4 py-2 text-[14px] font-semibold text-white disabled:opacity-60"
														style={{ backgroundColor: HOSPIO_MAROON }}
													>
														{paying === i.id && <Loader2Icon className="size-4 animate-spin" />}
														Pay now
													</button>
												</div>
											</li>
										))}
									</ul>
									<p className="mt-3 flex items-center justify-between text-[15px] font-semibold text-ink" data-testid="suspended-total">
										<span>Total owed</span>
										<span className="tabular-nums">{money(total)}</span>
									</p>
									<p className="mt-2 text-[13px] text-ink-2">
										{forInvoices
											? `Pay ${unpaid.length === 1 ? "it" : "every overdue invoice"} in full (card, bank transfer or USSD) and the account comes back by itself within a minute.`
											: "Paying these invoices does not lift this suspension by itself. Please contact Hospio360."}
									</p>
								</>
							) : invoicesError ? (
								<p className="text-[14px] text-danger" role="alert">
									{invoicesError}
								</p>
							) : (
								<p className="text-[14px] text-ink-2">
									{forInvoices
										? "No invoice is unpaid now. The account comes back within a minute; if it doesn't, contact Hospio360."
										: "No invoice is unpaid. Only Hospio360 can lift this suspension: please contact us."}
								</p>
							)}
							{paid.length > 0 && (
								<details className="mt-5" data-testid="suspended-paid">
									<summary className="cursor-pointer text-[14px] font-medium text-ink">Paid invoices and receipts</summary>
									<ul className="mt-2 divide-y divide-line rounded-control border border-line">
										{paid.map((i) => (
											<li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
												<p className="min-w-0 flex-1 text-[13px] text-ink">
													{i.number} · {i.monthLabel ?? i.month} · {money(i.total)}
												</p>
												<DownloadButton variant="link" load={() => invoiceFile({ kind: "pdf", id: i.id })}>
													Invoice
												</DownloadButton>
												<DownloadButton
													variant="link"
													load={async () => {
														const inv = await myInvoice(i.id);
														if (!inv.ok) return { ok: false, error: inv.error };
														const last = inv.data.payments?.at(-1);
														if (!last) return { ok: false, error: "This invoice has no receipt" };
														return invoiceFile({ kind: "receipt", id: i.id, paymentId: last.id });
													}}
												>
													Receipt
												</DownloadButton>
											</li>
										))}
									</ul>
								</details>
							)}
						</section>
					) : (
						<p className="mt-6 rounded-control bg-page px-4 py-3 text-[15px] font-medium text-ink" data-testid="suspended-ask-owner">
							Please ask the owner to contact Hospio360.
						</p>
					)}

					<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
						<a href={`mailto:${SUSPENSION_CONTACT}`} className="inline-flex items-center gap-2 text-[14px] font-medium" style={{ color: HOSPIO_MAROON }}>
							<MailIcon className="size-4" aria-hidden="true" />
							{SUSPENSION_CONTACT}
						</a>
						<button
							type="button"
							disabled={leaving}
							onClick={() => {
								setLeaving(true);
								setConfirming(false);
								void signOut();
							}}
							className="inline-flex items-center gap-2 rounded-control border border-line px-4 py-2 text-[14px] font-medium text-ink hover:bg-page disabled:opacity-60"
							data-testid="suspended-sign-out"
						>
							<LogOutIcon className="size-4" aria-hidden="true" />
							{onDevice ? "Lock" : "Sign out"}
						</button>
					</div>
				</div>
				<p className="text-center text-[12px] text-ink-2">Hospio360 · Oyeks Global Ltd</p>
			</div>
		</main>
	);
}

/**
 * In the app shell: someone already signed in is taken to the suspended screen within a minute of the suspension (the services
 * refuse their calls at once; this is what moves the page).
 */
export function SuspensionWatch() {
	useEffect(() => {
		const read = () =>
			void mySuspension()
				.then((s) => {
					if (s.suspended) window.location.assign("/suspended");
				})
				.catch(() => {});
		const timer = setInterval(read, 60_000);
		const onFocus = () => document.visibilityState === "visible" && read();
		document.addEventListener("visibilitychange", onFocus);
		return () => {
			clearInterval(timer);
			document.removeEventListener("visibilitychange", onFocus);
		};
	}, []);
	return null;
}
