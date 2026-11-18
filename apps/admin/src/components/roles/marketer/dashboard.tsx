"use client";

import {
	BuildingIcon,
	CalendarIcon,
	CoinsIcon,
	MegaphoneIcon,
	RotateCwIcon,
	Share2Icon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
	CommissionLine,
	MarketerBusinessItem,
	MarketerMeData,
	ReferralItem,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import {
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { AgreementCard, acceptedLine } from "./agreement";
import { BankDetailsCard } from "./bank";
import {
	byStageLine,
	earningLine,
	ReferralLinkBox,
	stageLabel,
	stageTone,
	whatsappShare,
} from "./shared";

/**
 * Marketer — F2 · My dashboard: GET /platform/marketer/me, /businesses, /commissions, /referrals. Until the Referral
 * Partner Agreement is accepted the agreement card replaces the referral link.
 */
export function MarketerDashboard({
	firstName,
	me: initialMe,
	businesses,
	ledger,
	referrals,
}: {
	firstName: string;
	me: MarketerMeData;
	businesses: MarketerBusinessItem[];
	ledger: CommissionLine[];
	referrals: ReferralItem[];
}) {
	const router = useRouter();
	const [me, setMe] = useState(initialMe);
	useEffect(() => setMe(initialMe), [initialMe]);
	const p = me.profile;
	const accepted = me.agreementAccepted;
	const stages = byStageLine(me.totals.byStage);
	const months = [...new Set(ledger.map((c) => c.month))].sort().slice(-6);
	const byMonth = months.map((m) => ({
		month: m,
		net: ledger.filter((c) => c.month === m).reduce((a, c) => a + c.net, 0),
	}));
	const max = Math.max(1, ...byMonth.map((b) => b.net));
	const inProgress = referrals.filter(
		(r) => r.stage !== "LIVE" && r.stage !== "LOST",
	).length;

	return (
		<>
			<PageHeader
				title={`Hello ${firstName}`}
				subtitle={`Marketer since ${fmtLongDate(p.joined)} · you earn ${p.sharePct}% of the Hospio360 platform fee collected from each business you refer, for ${p.months} months from its first collected fee${p.status === "PENDING" ? " · your account is waiting for approval" : ""}`}
			>
				{accepted && (
					<Link
						href="/dashboard/refer"
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<MegaphoneIcon className="size-4" /> Refer a hotel
					</Link>
				)}
			</PageHeader>

			{!accepted && (
				<AgreementCard
					me={me}
					onAccepted={(profile) => {
						setMe({ ...me, profile, agreementAccepted: true });
						router.refresh();
					}}
				/>
			)}

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Businesses referred"
					value={me.totals.businesses}
					icon={BuildingIcon}
					hint={stages || "Every business that named you, at any stage"}
				/>
				<KpiCard
					label="Next statement so far"
					value={nairaShort(me.totals.nextStatement)}
					icon={CalendarIcon}
					hint={`After ${me.whtPct}% WHT · statement on the 5th`}
				/>
				<KpiCard
					label="Due to you"
					value={nairaShort(me.totals.due)}
					icon={CoinsIcon}
					hint="Approved statements are paid by the 15th"
				/>
				<KpiCard
					label="Paid so far"
					value={nairaShort(me.totals.paid)}
					icon={WalletIcon}
					hint={`Earned ${nairaShort(me.totals.earnedTotal)} since ${fmtLongDate(p.joined)}`}
				/>
			</div>
			{me.totals.carried > 0 && (
				<p className="flex items-center gap-2 text-[13px] text-ink-2">
					<RotateCwIcon className="size-4 text-ink-3" />
					{naira(me.totals.carried)} carried over: statements under{" "}
					{naira(me.minimumPayout)} roll into your next statement.
				</p>
			)}

			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Your businesses"
					subtitle={`Each one earns you ${p.sharePct}% of the fee collected for ${p.months} months from its first collected fee`}
					action={{ label: "All", href: "/dashboard/businesses" }}
				>
					{businesses.length === 0 ? (
						<EmptyState
							title="No businesses yet"
							hint="Refer a hotel to start earning."
						/>
					) : (
						<ul>
							{businesses.map((b, i) => {
								return (
									<li
										key={b.id}
										className={cn(
											"flex items-center gap-3 py-[10px]",
											i < businesses.length - 1 && "border-b border-line",
										)}
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{b.name}
											</p>
											<p className="text-xs text-ink-3">
												{plural(b.hotels, "hotel")} · {b.city || "—"} ·{" "}
												{earningLine(b, p.months)}
											</p>
										</div>
										<span className="text-[13px] font-semibold text-ink">
											{naira(b.earnedNet)}
											<span className="text-xs font-normal text-ink-3">
												{" "}
												earned
											</span>
										</span>
										<StatusPill tone={stageTone[b.stage] ?? "grey"}>
											{stageLabel[b.stage] ?? b.stage.toLowerCase()}
										</StatusPill>
									</li>
								);
							})}
						</ul>
					)}
				</SectionCard>

				<div className="flex flex-col gap-4">
					<SectionCard
						title="Refer a new business"
						subtitle="Share your link or add their details — we contact them and set them up"
						bodyClassName="gap-3 pt-2"
					>
						{accepted ? (
							<>
								<ReferralLinkBox me={p} />
								<div className="flex flex-wrap gap-2">
									<Link
										href="/dashboard/refer"
										className={cn(btn.primary, "w-fit")}
									>
										Refer a hotel
									</Link>
									<a
										href={whatsappShare(p)}
										target="_blank"
										rel="noreferrer"
										className={cn(btn.secondary, "flex w-fit items-center gap-2")}
									>
										<Share2Icon className="size-4" /> Share on WhatsApp
									</a>
								</div>
								<p className="text-xs text-ink-3">
									Agreement {acceptedLine(p, me.currentAgreementVersion)}
								</p>
							</>
						) : (
							<p className="rounded-control bg-subtle px-3 py-[10px] text-[13px] text-ink-2">
								Accept the agreement to get your referral link.
							</p>
						)}
						<p className="text-xs text-ink-3">
							{plural(inProgress, "referral")} in progress · {referrals.length}{" "}
							sent in all
						</p>
					</SectionCard>
					<BankDetailsCard
						profile={p}
						onSaved={(profile) => setMe({ ...me, profile })}
					/>
				</div>
			</div>

			<SectionCard
				title="What you earned"
				subtitle={`Net after ${me.whtPct}% WHT, by the month it was earned`}
				action={{ label: "Commissions", href: "/dashboard/commissions" }}
				bodyClassName="pt-2"
			>
				{byMonth.length === 0 ? (
					<EmptyState
						title="Nothing earned yet"
						hint="Commission starts with the first fee Hospio360 collects from a business you referred."
					/>
				) : (
					<div className="flex h-36 items-end gap-3">
						{byMonth.map((b) => (
							<div
								key={b.month}
								className="flex flex-1 flex-col items-center gap-1"
							>
								<span className="text-[11px] font-semibold text-ink">
									{nairaShort(b.net)}
								</span>
								<div
									className="w-full rounded-t-md bg-brand/80"
									style={{ height: `${Math.max(4, (b.net / max) * 100)}px` }}
								/>
								<span className="text-[11px] text-ink-3">
									{b.month.slice(5)}/{b.month.slice(2, 4)}
								</span>
							</div>
						))}
					</div>
				)}
			</SectionCard>
		</>
	);
}
