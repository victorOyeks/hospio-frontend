"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	confirmDeviceInvoice,
	type DeviceInvoiceView,
	ownerDeviceInvoices,
	payDeviceInvoice,
} from "@hospio/api/actions/device-packages";
import { Note } from "@hospio/ui/shared/detail-list";
import { naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/**
 * Hospio fees → device invoices (hospio-backend docs/plan-device-packages.md): the monthly instalments and data plan. Each is
 * debited from the hotel's POS provider account; one that wasn't can be paid online (Paystack). Coming back from Paystack
 * (?reference=DEV-…) confirms the payment.
 */

const label = (i: DeviceInvoiceView) =>
	i.kind === "DATA_PLAN"
		? `Data plan · ${new Date(`${i.dueOn}T12:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
		: `Devices · instalment ${i.sequence}${i.ofCount ? ` of ${i.ofCount}` : ""}`;

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function status(i: DeviceInvoiceView) {
	if (i.status === "PAID") return <StatusPill tone="success">Paid</StatusPill>;
	if (i.status === "OVERDUE") return <StatusPill tone="danger">{`Overdue · ${i.daysOverdue} day${i.daysOverdue === 1 ? "" : "s"}`}</StatusPill>;
	if (i.status === "VOID") return <StatusPill tone="grey">Not needed</StatusPill>;
	return <StatusPill tone="warning">Due</StatusPill>;
}

export function OwnerDeviceInvoices({ canPay }: { canPay: boolean }) {
	const router = useRouter();
	const params = useSearchParams();
	const [rows, setRows] = useState<DeviceInvoiceView[] | null>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const confirmed = useRef(false);
	const load = useCallback(async () => {
		const r = await ownerDeviceInvoices();
		if (r.ok) setRows(r.data);
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
	// Back from Paystack: confirm once, then drop the reference from the address.
	useEffect(() => {
		const ref = params.get("reference") ?? params.get("trxref");
		if (!ref || !ref.startsWith("DEV-") || confirmed.current) return;
		confirmed.current = true;
		void confirmDeviceInvoice(ref).then((r) => {
			if (r.ok) toast.success(`${r.data.number} is paid`);
			else toast.error(r.error);
			router.replace("/dashboard/hospio-fees");
			void load();
		});
	}, [params, router, load]);

	const pay = async (i: DeviceInvoiceView) => {
		setBusy(i.id);
		const r = await payDeviceInvoice(i.id, `${window.location.origin}/dashboard/hospio-fees`);
		if (!r.ok) {
			setBusy(null);
			return toast.error(r.error);
		}
		window.location.assign(r.data.authorizationUrl);
	};

	if (!rows || rows.length === 0) return null;
	const owed = rows.filter((i) => i.status === "DUE" || i.status === "OVERDUE");
	const paused = owed.some((i) => i.posPaused);
	return (
		<SectionCard
			title="Device invoices"
			subtitle={
				owed.length
					? `${naira(owed.reduce((a, i) => a + i.amount - i.paidAmount, 0))} to pay · debited from your POS provider account, or pay online`
					: "Monthly instalments and data plan · debited from your POS provider account"
			}
			flush
		>
			{paused && (
				<Note tone="danger" className="mx-5 mb-3">
					POS payments are paused: a device invoice is more than 14 days overdue. Pay it and they start again straight away.
				</Note>
			)}
			<div className="overflow-x-auto">
				<table className="w-full min-w-[620px] text-[13px]">
					<thead className={tableHead}>
						<tr>
							<th className={cell}>Invoice</th>
							<th className={cell}>For</th>
							<th className={cell}>Due</th>
							<th className={`${cell} text-right`}>Amount</th>
							<th className={cell}>Status</th>
							<th className={cell} />
						</tr>
					</thead>
					<tbody>
						{rows.map((i) => (
							<tr key={i.id} className={tableRow}>
								<td className={`${cell} font-semibold`}>
									{i.number}
									{i.hotelName && <span className="block text-[11px] font-normal text-ink-3">{i.hotelName}</span>}
								</td>
								<td className={cell}>{label(i)}</td>
								<td className={cell}>{day(i.dueOn)}</td>
								<td className={`${cell} text-right font-semibold`}>{naira(i.amount)}</td>
								<td className={cell}>{status(i)}</td>
								<td className={`${cell} text-right`}>
									{canPay && (i.status === "DUE" || i.status === "OVERDUE") && (
										<button type="button" className={btn.primary} disabled={busy === i.id} onClick={() => void pay(i)}>
											{busy === i.id ? "Opening Paystack…" : `Pay ${naira(i.amount - i.paidAmount)}`}
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</SectionCard>
	);
}
