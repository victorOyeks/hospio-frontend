"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BedDoubleIcon, BuildingIcon, CreditCardIcon, PauseCircleIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { HotelDirectoryRow } from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { can, StagePill, stageMeta } from "../shared";
import { HotelDrawer } from "./drawer";
import { FeeStateCell, FEE_FILTERS, feeFilterMatches, KeysCell, LastFeeCell, Pending, useHotelFees } from "./status";

/**
 * Customers → Hotels: every hotel across every business on one list, so a hotel's POS keys, fee state and daily fees are a
 * click away instead of four pages down. Filters live in the URL (`?q=&businessId=&stage=&fee=`) and a row opens the hotel
 * panel (`?hotel=`).
 */
export function HotelsScreen({ role, hotels: base }: { role: AdminRole; hotels: HotelDirectoryRow[] }) {
	const opts = parseAsString.withDefault("").withOptions({ scroll: false });
	const [q, setQ] = useQueryState("q", opts);
	const [biz, setBiz] = useQueryState("businessId", opts);
	const [stage, setStage] = useQueryState("stage", opts);
	const [fee, setFee] = useQueryState("fee", opts);
	const [, setHotel] = useQueryState("hotel", parseAsString.withOptions({ history: "push", scroll: false }));
	const money = can.money(role);
	const { rows: hotels, loading: feesLoading, error: feesError } = useHotelFees(base, money);

	const businesses = useMemo(() => {
		const m = new Map<string, string>();
		for (const h of hotels) m.set(h.businessId, h.businessName);
		return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
	}, [hotels]);

	const rows = useMemo(() => {
		const term = q.trim().toLowerCase();
		return hotels.filter(
			(h) =>
				(!term || `${h.name} ${h.businessName} ${h.city}`.toLowerCase().includes(term)) &&
				(!biz || h.businessId === biz) &&
				(!stage || h.stage === stage) &&
				(!fee || feeFilterMatches(h, fee)),
		);
	}, [hotels, q, biz, stage, fee]);

	const withKeys = hotels.filter((h) => h.collection?.keysIn).length;
	const paused = hotels.filter((h) => h.collection?.posPaused).length;
	const filtered = !!(q || biz || stage || fee);

	const columns: ColumnDef<HotelDirectoryRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Hotel",
			cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.city || "—"} />,
		},
		{
			accessorKey: "businessName",
			header: "Business",
			cell: ({ row }) => (
				<span className="flex flex-col items-start gap-1">
					<span className="font-medium">{row.original.businessName}</span>
					<StagePill stage={row.original.stage} />
				</span>
			),
		},
		{ accessorKey: "rooms", header: "Rooms" },
		...(money
			? ([
					{ id: "keys", header: "POS keys", cell: ({ row }) => (feesLoading ? <Pending /> : <KeysCell c={row.original.collection} />) },
					{ id: "fee", header: "Hospio fee", cell: ({ row }) => (feesLoading ? <Pending /> : <FeeStateCell c={row.original.collection} />) },
					{ id: "lastFee", header: "Last daily fee", cell: ({ row }) => (feesLoading ? <Pending /> : <LastFeeCell f={row.original.lastFee} />) },
				] as ColumnDef<HotelDirectoryRow, unknown>[])
			: []),
	];

	return (
		<>
			<PageHeader
				title="Hotels"
				subtitle={`Every hotel across ${businesses.length} ${businesses.length === 1 ? "business" : "businesses"}. Open one to see today's figures${money ? ", its POS keys and Hospio fees" : ""} and its guest messages.`}
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Hotels" value={hotels.length} icon={BedDoubleIcon} hint={`${hotels.reduce((a, h) => a + h.rooms, 0)} rooms`} />
				<KpiCard label="Businesses" value={businesses.length} icon={BuildingIcon} />
				{money && <KpiCard label="POS keys in" value={feesLoading ? "…" : withKeys} icon={CreditCardIcon} hint="For taking guest payments" />}
				{money && <KpiCard label="POS paused" value={feesLoading ? "…" : paused} icon={PauseCircleIcon} hint="Unpaid Hospio360 invoice" />}
			</div>
			{feesError && <Note tone="warning">{feesError}. The hotels are listed; open one to see its fees.</Note>}
			<Toolbar
				left={<SearchBox value={q} onChange={(v) => void setQ(v || null)} placeholder="Search hotel, business or city…" />}
				right={
					<>
						<FilterSelect value={biz} onChange={(v) => void setBiz(v || null)} all="All businesses" options={businesses} />
						<FilterSelect
							value={stage}
							onChange={(v) => void setStage(v || null)}
							all="All stages"
							options={Object.entries(stageMeta).map(([value, m]) => ({ value, label: m.label }))}
						/>
						{money && <FilterSelect value={fee} onChange={(v) => void setFee(v || null)} all="Any fee state" options={FEE_FILTERS} />}
					</>
				}
			/>
			<DataTable
				columns={columns}
				data={rows}
				onRowClick={(h) => void setHotel(h.id)}
				filtered={filtered}
				onClearFilters={() => {
					void setQ(null);
					void setBiz(null);
					void setStage(null);
					void setFee(null);
				}}
				emptyTitle="No hotels yet"
				emptyHint="Hotels are added while a business is onboarded. Start one from Businesses → Set up a business for them."
			/>
			<HotelDrawer hotels={hotels} role={role} />
		</>
	);
}
