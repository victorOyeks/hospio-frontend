"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import type {
	CommissionLine,
	MarketerBusinessItem,
	MarketerMeData,
} from "@hospio/api/data/admin-types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { CommissionTable } from "../admin/marketers";
import { earningLine, stageLabel, stageTone } from "./shared";

const agreementTone = (s?: string) =>
	s === "ACTIVE" ? "success" : s === "ENDED" ? "grey" : "info";
const agreementText = (s?: string) =>
	s === "ACTIVE" ? "Active" : s === "ENDED" ? "Ended" : "Not started";

/**
 * Marketer — My businesses: GET /platform/marketer/businesses (every business that named me, any stage) with each one's
 * agreement, earning window and what it has earned, and the commission lines per business.
 */
export function MarketerBusinesses({
	me,
	businesses,
	ledger,
}: {
	me: MarketerMeData;
	businesses: MarketerBusinessItem[];
	ledger: CommissionLine[];
}) {
	const [open, setOpen] = useQueryState("open");
	const p = me.profile;
	const selected = businesses.find((b) => b.id === open) ?? null;

	const columns: ColumnDef<MarketerBusinessItem, unknown>[] = [
		{
			accessorKey: "name",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.name}
					secondary={`${row.original.city || "—"} · ${plural(row.original.hotels, "hotel")}`}
				/>
			),
		},
		{
			accessorKey: "stage",
			header: "Stage",
			cell: ({ row }) => (
				<StatusPill tone={stageTone[row.original.stage] ?? "grey"}>
					{stageLabel[row.original.stage] ?? row.original.stage}
				</StatusPill>
			),
		},
		{
			accessorKey: "agreementStatus",
			header: "Agreement",
			cell: ({ row }) => (
				<TwoLine
					primary={
						<StatusPill tone={agreementTone(row.original.agreementStatus)}>
							{agreementText(row.original.agreementStatus)}
						</StatusPill>
					}
					secondary={earningLine(row.original, p.months)}
				/>
			),
		},
		{
			accessorKey: "sharePct",
			header: "Your share",
			cell: ({ row }) => `${row.original.sharePct || p.sharePct}%`,
		},
		{
			accessorKey: "earnedNet",
			header: "Earned (net)",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.earnedNet)}</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="My businesses"
				subtitle={`${plural(businesses.length, "business", "businesses")} that named you · you earn ${p.sharePct}% of the platform fee collected from each, for ${p.months} months from its first collected fee`}
			/>
			<DataTable
				columns={columns}
				data={businesses}
				onRowClick={(b) => setOpen(b.id)}
				emptyTitle="No businesses yet"
				emptyHint="Refer a hotel to start earning."
			/>

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected?.name ?? ""}
				subtitle={
					selected
						? `${selected.city || "—"} · ${plural(selected.hotels, "hotel")}`
						: undefined
				}
				icon={BuildingIcon}
				width="md"
			>
				{selected && (
					<div className="flex flex-col gap-5">
						<DetailList
							columns={2}
							items={[
								{
									label: "Stage",
									value: (
										<StatusPill tone={stageTone[selected.stage] ?? "grey"}>
											{stageLabel[selected.stage] ?? selected.stage}
										</StatusPill>
									),
								},
								{
									label: "Agreement",
									value: (
										<StatusPill tone={agreementTone(selected.agreementStatus)}>
											{agreementText(selected.agreementStatus)}
										</StatusPill>
									),
								},
								{
									label: "Agreement started",
									value: selected.agreementStartedOn
										? fmtLongDate(selected.agreementStartedOn)
										: "—",
								},
								{
									label: "Earning window",
									value: earningLine(selected, p.months),
								},
								{
									label: "First collected fee",
									value: selected.windowStart
										? fmtLongDate(selected.windowStart)
										: "Not yet",
								},
								{
									label: "Your share",
									value: `${selected.sharePct || p.sharePct}% for ${selected.months || p.months} months`,
								},
								{ label: "Earned so far (net)", value: naira(selected.earnedNet) },
							]}
						/>
						<PanelSection title="Commission lines">
							<CommissionTable
								rows={ledger.filter(
									(c) =>
										c.businessId === selected.id ||
										c.businessName === selected.name,
								)}
								sharePct={p.sharePct}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>
		</>
	);
}
