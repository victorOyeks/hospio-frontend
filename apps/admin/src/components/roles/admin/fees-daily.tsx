"use client";

import { CreditCardIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	adminDailyFees,
	type DailyFeeRow,
	redoFeeDay,
	refundFeeDay,
	runFeeDay,
	runFeeDebit,
} from "@hospio/api/actions/daily-fees";
import type { BusinessRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { naira } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { FeeDayModal, FeeTable } from "./hotel-fees";
import { Loading } from "./live";

/**
 * Fees & billing → Daily fees: every hotel's daily Hospio fee in one list (GET /platform/admin/fees/daily with no filters),
 * narrowed here by business, status or hotel. A day opens its breakdown; a Super admin can work out yesterday and run the
 * debit from the top.
 */
export function DailyFeesTab({
	role,
	businesses,
}: {
	role: AdminRole;
	businesses: BusinessRow[];
}) {
	const superAdmin = role === "SUPER_ADMIN";
	const money = role === "SUPER_ADMIN" || role === "FINANCE_ADMIN";
	const opts = parseAsString.withDefault("").withOptions({ scroll: false });
	const [biz, setBiz] = useQueryState("dbiz", opts);
	const [status, setStatus] = useQueryState("dstatus", opts);
	const [q, setQ] = useState("");
	const [days, setDays] = useState<DailyFeeRow[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState<DailyFeeRow | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		const r = await adminDailyFees({});
		if (r.ok) {
			setDays(r.data);
			setError(null);
		} else setError(r.error);
	}, []);
	useEffect(() => {
		void load();
	}, [load]);

	const rows = useMemo(() => {
		const term = q.trim().toLowerCase();
		return (days ?? [])
			.filter(
				(d) =>
					(!biz || d.businessId === biz) &&
					(!status || d.status === status) &&
					(!term || (d.hotelName ?? "").toLowerCase().includes(term)),
			)
			.sort((a, b) => b.date.localeCompare(a.date));
	}, [days, biz, status, q]);
	const due = rows.reduce((a, d) => a + d.due - (d.collected ?? 0), 0);

	return (
		<>
			<Toolbar
				left={
					<SearchBox
						value={q}
						onChange={setQ}
						placeholder="Search a hotel…"
					/>
				}
				right={
					<>
						<FilterSelect
							value={biz}
							onChange={(v) => void setBiz(v || null)}
							all="All businesses"
							options={businesses.map((b) => ({ value: b.id, label: b.name }))}
						/>
						<FilterSelect
							value={status}
							onChange={(v) => void setStatus(v || null)}
							all="All statuses"
							options={[
								{ value: "PAID", label: "Debited" },
								{ value: "SHADOW", label: "Statement only" },
								{ value: "SCHEDULED", label: "Debit at 6am" },
								{ value: "PENDING", label: "Waiting on provider" },
								{ value: "PART_PAID", label: "Part debited" },
								{ value: "UNPAID", label: "Not debited" },
								{ value: "NO_FEE", label: "No fee" },
							]}
						/>
					</>
				}
			/>
			<SectionCard
				title="Daily fees"
				subtitle={
					days
						? `${rows.length} ${rows.length === 1 ? "day" : "days"} · ${naira(Math.max(0, due))} still to debit`
						: "Each hotel's sales, fee and debit, newest first"
				}
				headerRight={
					<div className="flex flex-wrap gap-2">
						{superAdmin && (
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								disabled={busy}
								onClick={async () => {
									setBusy(true);
									const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
									const r = await runFeeDay(y);
									setBusy(false);
									if (r.ok) {
										toast.success(`${r.data.date}: ${r.data.worked} worked out, ${r.data.statements} statements${r.data.notes.length ? ` · ${r.data.notes.join("; ")}` : ""}`);
										void load();
									} else toast.error(r.error);
								}}
							>
								<PlayIcon className="mr-1 inline size-4" /> Work out yesterday
							</button>
						)}
						{superAdmin && (
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								disabled={busy}
								onClick={async () => {
									setBusy(true);
									const r = await runFeeDebit();
									setBusy(false);
									if (r.ok) {
										toast.success(`Debit run: ${r.data.tried} tried, ${r.data.paid} paid, ${r.data.pending} pending, ${r.data.unpaid} unpaid`);
										void load();
									} else toast.error(r.error);
								}}
							>
								<CreditCardIcon className="mr-1 inline size-4" /> Run debit now
							</button>
						)}
						<button
							type="button"
							className={`${btn.secondary} ${btn.small}`}
							onClick={() => void load()}
						>
							<RefreshCwIcon className="mr-1 inline size-4" /> Refresh
						</button>
					</div>
				}
			>
				{error ? (
					<Note tone="danger">{error}</Note>
				) : !days ? (
					<Loading label="Loading daily fees…" />
				) : rows.length === 0 ? (
					<EmptyState
						title={days.length ? "No days match" : "No days worked out yet"}
						hint={
							days.length
								? "Clear the filters to see every hotel."
								: "The first day appears after midnight, once a hotel is on a % of daily sales fee. A Super admin can also use “Work out yesterday”."
						}
					/>
				) : (
					<FeeTable days={rows} onOpen={setOpen} showHotel />
				)}
			</SectionCard>
			{open && (
				<FeeDayModal
					day={open}
					onClose={() => setOpen(null)}
					onRedo={
						superAdmin && (open.status === "SHADOW" || open.status === "NO_FEE")
							? async () => {
									const r = await redoFeeDay(open.id);
									if (r.ok) {
										toast.success("Worked out again");
										setOpen(r.data);
										void load();
									} else toast.error(r.error);
								}
							: undefined
					}
					onRefund={
						money
							? async (amount, reason) => {
									const r = await refundFeeDay(open.id, amount, reason);
									if (!r.ok) {
										toast.error(r.error, { duration: 8000 });
										return false;
									}
									toast.success(
										`${naira(amount)} refund recorded${r.data.clawback ? " · the marketer's commission is clawed back on their next statement" : ""}`,
									);
									setOpen({ ...open, refunded: r.data.refunded ?? (open.refunded ?? 0) + amount, refundNote: reason });
									void load();
									return true;
								}
							: undefined
					}
				/>
			)}
		</>
	);
}
