"use client";

import { BuildingIcon, CoinsIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import type { BusinessRow, HotelSummary } from "@hospio/api/data/types";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { fmtAgo, naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { HealthBar } from "../shared";

/** "% of daily sales · 1.5%" or "Per room night · ₦500": the fee as one line. */
export function feeLineOf(business: BusinessRow) {
	return business.feeValue
		? `${business.feeModel} · ${business.feeModel.includes("%") ? `${business.feeValue}%` : naira(business.feeValue)}`
		: business.feeModel;
}

/** Business · Overview: the headline numbers, the account and the registered business. */
export function OverviewTab({
	business,
	hotels,
}: {
	business: BusinessRow;
	hotels: HotelSummary[];
}) {
	const feeLine = feeLineOf(business);
	return (
		<>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Hotels · rooms"
					value={`${business.hotels} · ${business.rooms}`}
					icon={BuildingIcon}
					hint={
						hotels.length
							? hotels
									.map((h) => h.name)
									.slice(0, 2)
									.join(", ") +
								(hotels.length > 2 ? ` +${hotels.length - 2}` : "")
							: "No hotels yet"
					}
				/>
				<KpiCard
					label="Fee"
					value={
						business.feeValue
							? business.feeModel.includes("%")
								? `${business.feeValue}%`
								: naira(business.feeValue)
							: "—"
					}
					icon={CoinsIcon}
					hint={business.feeModel}
				/>
				<KpiCard
					label="Monthly fee"
					value={business.mrr ? nairaShort(business.mrr) : "—"}
					icon={TrendingUpIcon}
					hint={
						business.mrr
							? "Last statement"
							: "Statements start after go-live"
					}
				/>
				<KpiCard
					label="Health"
					value={
						business.health ? <HealthBar value={business.health} /> : "—"
					}
					icon={UsersIcon}
					hint={
						business.lastActive
							? `Active ${fmtAgo(business.lastActive)}`
							: "Not active yet"
					}
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard title="Account">
					<DetailList
						columns={2}
						items={[
							{ label: "Owner", value: business.ownerName },
							{ label: "Owner email", value: business.ownerEmail || "—" },
							{ label: "Owner phone", value: business.ownerPhone ?? "—" },
							{ label: "Account manager", value: business.accountManager },
							{
								label: "Source",
								value:
									business.source === "SELF_SERVE"
										? "Signed up themselves"
										: "Set up by Hospio360",
							},
							{
								label: "Referred by",
								value:
									business.marketer ??
									(business.marketerId ? "Marketer" : "Direct"),
							},
							{ label: "Fee", value: feeLine },
							{
								label: "Fees due",
								value: business.dueFees ? (
									<span className="text-danger">
										{naira(business.dueFees)}
									</span>
								) : (
									"Nothing"
								),
							},
						]}
					/>
				</SectionCard>
				<SectionCard title="Business">
					<DetailList
						columns={2}
						items={[
							{
								label: "Registered name",
								value: business.legalName ?? "—",
							},
							{
								label: "Registration number",
								value: business.registrationNumber ?? "—",
							},
							{ label: "Type", value: business.businessType ?? "—" },
							{ label: "City", value: business.city || "—" },
							{ label: "Address", value: business.address ?? "—" },
							{
								label: "Contact",
								value:
									[business.email, business.phone]
										.filter(Boolean)
										.join(" · ") || "—",
							},
							{
								label: "Currency · time zone",
								value: `${business.currency ?? "NGN"} · ${business.timezone ?? "Africa/Lagos"}`,
							},
							{
								label: "Onboarding",
								value: business.onboarding
									? `${business.onboarding.status === "DONE" ? "Done" : `Step ${business.onboarding.step}`} · ${business.onboarding.completedSteps.length} steps done`
									: "—",
							},
						]}
					/>
				</SectionCard>
			</div>
		</>
	);
}
