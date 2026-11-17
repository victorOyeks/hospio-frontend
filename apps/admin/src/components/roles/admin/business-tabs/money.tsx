"use client";

import {
	BanknoteIcon,
	CoinsIcon,
	CreditCardIcon,
	ReceiptIcon,
} from "lucide-react";
import Link from "next/link";
import type { DailyFeeRow } from "@hospio/api/actions/daily-fees";
import type { DevicePackageView } from "@hospio/api/actions/device-packages";
import type {
	FeeStatementItem,
	PaymentSummaryData,
	SettlementItem,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	fmtDay,
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cn } from "@hospio/ui/utils";
import { optionLabel, PackageProgress, packageStatus } from "../devices/device-package";
import { howPaidLabel, throughPos } from "../shared";
import { BusinessTabHeader } from "./nav";

const feeTone = {
	DUE: "warning",
	PART_PAID: "info",
	PAID: "success",
	OVERDUE: "danger",
} as const;
const settlementTone = {
	SETTLED: "success",
	PENDING: "warning",
	FAILED: "danger",
} as const;

const dailyTone: Record<string, "success" | "info" | "grey" | "brand" | "warning" | "danger"> = {
	PAID: "success",
	SHADOW: "info",
	NO_FEE: "grey",
	SCHEDULED: "brand",
	PENDING: "warning",
	PART_PAID: "warning",
	UNPAID: "danger",
	CARRIED: "grey",
};
const dailyLabel: Record<string, string> = {
	PAID: "debited",
	SHADOW: "statement only",
	NO_FEE: "no fee",
	SCHEDULED: "debit at 6am",
	PENDING: "being debited",
	PART_PAID: "part debited",
	UNPAID: "not debited",
	CARRIED: "moved on",
};

/**
 * Business · Money tab: what it pays Hospio360, settlements and the payment summary. A business on monthly fees shows its fee
 * statements; a daily-fee business (a % of each day's sales, debited from its POS provider account) shows this month's days.
 */
export function MoneyTab({
	businessId,
	businessName,
	statements,
	settlements,
	summary,
	dailyFees = null,
	dailyFeesError = null,
	feeRate,
	devicePackages = [],
}: {
	businessId: string;
	businessName: string;
	statements: FeeStatementItem[];
	settlements: SettlementItem[];
	summary: PaymentSummaryData;
	/** This month's daily fees, for a daily-fee business; null for one on monthly statements. */
	dailyFees?: DailyFeeRow[] | null;
	dailyFeesError?: string | null;
	feeRate?: number;
	/** The business's devices & internet packages, one per hotel. */
	devicePackages?: DevicePackageView[];
}) {
	const outstanding = statements.reduce((a, s) => a + s.outstanding, 0);
	const daily = dailyFees !== null;
	const dayFees = (dailyFees ?? []).reduce((a, d) => a + d.fee, 0);
	const dayCollected = (dailyFees ?? []).reduce((a, d) => a + (d.collected ?? 0), 0);
	const unpaidDays = (dailyFees ?? []).filter((d) => d.status === "UNPAID" || d.status === "PART_PAID").length;
	const shadow = (dailyFees ?? []).some((d) => d.status === "SHADOW");
	const paidBy = (keys: (k: string) => boolean) =>
		summary.byProvider.filter((p) => keys(p.provider)).reduce((a, p) => a + p.gross, 0);
	const cash = paidBy((k) => k === "cash");
	const deskTransfers = paidBy((k) => k === "desk-transfer");
	const pos = paidBy(throughPos);
	const posProviders = summary.byProvider.filter((p) => throughPos(p.provider));
	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="money"
				subtitle="What the business pays Hospio360, what its guests paid on POS, and what was settled back to it"
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{daily ? (
					<KpiCard
						label="Hospio fees this month"
						value={nairaShort(dayFees)}
						icon={CoinsIcon}
						pill={unpaidDays > 0 ? <StatusPill tone="danger">{plural(unpaidDays, "unpaid day")}</StatusPill> : undefined}
						hint={shadow ? `${feeRate ?? ""}% of sales · statement only, not debited yet` : `${nairaShort(dayCollected)} debited`}
					/>
				) : (
				<KpiCard
					label="Fees outstanding"
					value={nairaShort(outstanding)}
					icon={CoinsIcon}
					pill={
						statements.some((s) => s.status === "OVERDUE") ? (
							<StatusPill tone="danger">overdue</StatusPill>
						) : undefined
					}
					hint={plural(statements.length, "statement")}
				/>
				)}
				<KpiCard
					label="Payments received this month"
					value={nairaShort(summary.gross)}
					icon={CreditCardIcon}
					hint={`${plural(summary.count, "payment")} · cash ${nairaShort(cash)} · desk transfer ${nairaShort(deskTransfers)} · POS ${nairaShort(pos)}`}
				/>
				{daily ? (
					<>
						<KpiCard
							label="Into the hotel's POS accounts"
							value={nairaShort(pos)}
							icon={BanknoteIcon}
							hint="Card and transfer on Moniepoint or OPay · straight to the hotel"
						/>
						<KpiCard
							label="Hospio fees debited"
							value={nairaShort(dayCollected)}
							icon={ReceiptIcon}
							hint={shadow ? "Automatic debit isn't on yet" : `of ${nairaShort(dayFees)} this month`}
						/>
					</>
				) : (
					<>
				<KpiCard
					label="Settled to the hotel"
					value={nairaShort(
						settlements
							.filter((s) => s.status === "SETTLED")
							.reduce((a, s) => a + s.net, 0),
					)}
					icon={BanknoteIcon}
					hint={`${settlements.filter((s) => s.status === "PENDING").length} pending`}
				/>
				<KpiCard
					label="Hospio360 share"
					value={nairaShort(settlements.reduce((a, s) => a + s.hmsShare, 0))}
					icon={ReceiptIcon}
					hint="From the settlements shown"
				/>
					</>
				)}
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				{daily ? (
					<SectionCard
						title="Daily fees · this month"
						subtitle={`${feeRate ?? ""}% of each day's sales, debited at 6am from the hotel's POS provider account`}
						action={{ label: "Daily fees", href: `/dashboard/fees?view=daily&dbiz=${businessId}` }}
						flush
					>
						{dailyFeesError ? (
							<p className="mx-5 mb-5 text-[13px] text-danger">{dailyFeesError}</p>
						) : (dailyFees ?? []).length === 0 ? (
							<EmptyState title="No days yet this month" hint="Each day is worked out at 00:05." className="mx-5 mb-5" />
						) : (
							<ul className="divide-y divide-line">
								{(dailyFees ?? []).slice(0, 10).map((d) => (
									<li key={d.id}>
										<Link
											href={`/dashboard/fees?view=daily&dbiz=${businessId}`}
											className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60"
										>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">
													{fmtDay(d.date)} · {d.hotelName ?? "Hotel"}
												</p>
												<p className="text-xs text-ink-3">
													sales {naira(d.sales)} · debited {naira(d.collected ?? 0)}
												</p>
											</div>
											<span className="text-[13px] font-semibold text-ink">{naira(d.fee)}</span>
											<StatusPill tone={dailyTone[d.status] ?? "grey"}>{dailyLabel[d.status] ?? d.status.toLowerCase()}</StatusPill>
										</Link>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				) : (
				<SectionCard
					title="Fee statements"
					subtitle="Monthly, from the fee model"
					action={{
						label: "Fees & billing",
						href: `/dashboard/fees?view=statements&businessId=${businessId}`,
					}}
					flush
				>
					{statements.length === 0 ? (
						<EmptyState title="No statements yet" className="mx-5 mb-5" />
					) : (
						<ul className="divide-y divide-line">
							{statements.map((s) => (
								<li key={s.id}>
									<Link
										href={`/dashboard/fees?view=statements&businessId=${businessId}&open=${s.id}`}
										className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{s.month}
											</p>
											<p className="text-xs text-ink-3">
												fee {naira(s.feeAmount)} · paid {naira(s.paidAmount)}
												{s.dueOn ? ` · due ${fmtLongDate(s.dueOn)}` : ""}
											</p>
										</div>
										<span
											className={cn(
												"text-[13px] font-semibold",
												s.outstanding > 0 ? "text-danger" : "text-ink",
											)}
										>
											{naira(s.outstanding)}
										</span>
										<StatusPill tone={feeTone[s.status]}>
											{s.status.toLowerCase().replace("_", " ")}
										</StatusPill>
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
				)}
				{daily ? (
					<SectionCard
						title="Where the money goes"
						subtitle="This month · POS payments go straight to the hotel's own accounts"
						action={{ label: "Payments", href: `/dashboard/payments?businessId=${businessId}` }}
						bodyClassName="pt-2"
					>
						<p className="mb-3 text-[13px] text-ink-2">
							Card and transfer payments on the hotel's Moniepoint or OPay terminals land in the hotel's own account. Hospio360
							doesn't hold or settle them; its {feeRate ?? ""}% fee is debited from that account each morning.
						</p>
						{posProviders.length === 0 ? (
							<p className="text-[13px] text-ink-3">No approved POS payments this month yet.</p>
						) : (
							<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
								{posProviders.map((p) => (
									<li key={p.provider} className="flex items-center justify-between px-4 py-2">
										<span className="font-medium text-ink">{howPaidLabel(p.provider)}</span>
										<span className="text-ink-2">
											{plural(p.count, "payment")} · <span className="font-semibold text-ink">{naira(p.gross)}</span>
										</span>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				) : (
				<SectionCard
					title="Settlements"
					subtitle="Per provider and day"
					action={{
						label: "Payments",
						href: `/dashboard/payments?businessId=${businessId}`,
					}}
					flush
				>
					{settlements.length === 0 ? (
						<EmptyState
							title="No settlements yet"
							hint="They are built nightly from approved card and transfer payments."
							className="mx-5 mb-5"
						/>
					) : (
						<ul className="divide-y divide-line">
							{settlements.map((s) => (
								<li key={s.id}>
									<Link
										href={`/dashboard/payments?businessId=${businessId}&open=${s.id}`}
										className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{s.provider} · {fmtDay(s.periodDate)}
											</p>
											<p className="text-xs text-ink-3">
												gross {naira(s.gross)} · Hospio360 {naira(s.hmsShare)}
											</p>
										</div>
										<span className="text-[13px] font-semibold text-ink">
											{naira(s.net)}
										</span>
										<StatusPill tone={settlementTone[s.status]}>
											{s.status.toLowerCase()}
										</StatusPill>
									</Link>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
				)}
			</div>
			{devicePackages.length > 0 && (
				<SectionCard title="Devices & internet" subtitle="What Hospio360 supplied to each hotel and how it is being paid for" flush>
					<ul className="divide-y divide-line">
						{devicePackages.map((p) => (
							<li key={p.id}>
								<Link href={`/dashboard/hotels?hotel=${p.hotelId}&htab=devices`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle/60">
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{p.hotelName ?? "Hotel"} · {optionLabel(p.paymentOption)}
										</p>
										{p.total > 0 ? (
											<PackageProgress p={p} />
										) : (
											<p className="text-xs text-ink-3">{p.dataPlanMonthly > 0 ? `Data plan ${naira(p.dataPlanMonthly)} a month` : "Nothing supplied"}</p>
										)}
									</div>
									{packageStatus(p)}
								</Link>
							</li>
						))}
					</ul>
				</SectionCard>
			)}
			{summary.byProvider.length > 0 && (
				<SectionCard
					title="Payments received by how they were paid"
					subtitle="Approved payments this month: cash, transfers recorded at the desk, and POS"
					bodyClassName="pt-2"
				>
					<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
						{summary.byProvider.map((p) => (
							<li
								key={p.provider}
								className="flex items-center justify-between px-4 py-2"
							>
								<span className="font-medium text-ink">{howPaidLabel(p.provider)}</span>
								<span className="text-ink-2">
									{plural(p.count, "payment")} ·{" "}
									<span className="font-semibold text-ink">
										{naira(p.gross)}
									</span>
								</span>
							</li>
						))}
					</ul>
				</SectionCard>
			)}
		</>
	);
}
