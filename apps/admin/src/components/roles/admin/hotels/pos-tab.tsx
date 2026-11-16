"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import type { HotelDirectoryRow } from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { HotelDrawer } from "./drawer";
import { DebitCell, FEE_FILTERS, feeFilterMatches, KeysCell, LastFeeCell, Pending, useHotelFees } from "./status";

/**
 * Payments & POS → POS & fee collection: every hotel's POS keys, fee debit switch and pause in one table. A row opens the
 * hotel panel on its POS & Hospio fees tab, where the keys and the switch are changed.
 */
export function PosCollectionTab({ role, hotels: base }: { role: AdminRole; hotels: HotelDirectoryRow[] }) {
	const { rows: hotels, loading, error } = useHotelFees(base, true);
	const [q, setQ] = useState("");
	const [fee, setFee] = useQueryState("fee", parseAsString.withDefault("").withOptions({ scroll: false }));
	const [, setHotel] = useQueryState("hotel", parseAsString.withOptions({ history: "push", scroll: false }));
	const [, setHotelTab] = useQueryState("htab", parseAsString.withOptions({ scroll: false }));
	const rows = useMemo(() => hotels.filter((h) => !fee || feeFilterMatches(h, fee)), [hotels, fee]);
	const columns: ColumnDef<HotelDirectoryRow, unknown>[] = [
		{
			accessorKey: "name",
			header: "Hotel",
			cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.businessName}${row.original.city ? ` · ${row.original.city}` : ""}`} />,
		},
		{ id: "keys", header: "POS keys", cell: ({ row }) => (loading ? <Pending /> : <KeysCell c={row.original.collection} />) },
		{ id: "debit", header: "Hospio fee", cell: ({ row }) => (loading ? <Pending /> : <DebitCell c={row.original.collection} />) },
		{
			id: "debitReady",
			header: "Provider debit",
			cell: ({ row }) =>
				loading ? (
					<Pending />
				) : row.original.collection ? (
					<span className="text-[13px] text-ink-2">{row.original.collection.debitConfigured ? "Set up on the server" : "Not set up"}</span>
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{ id: "lastFee", header: "Last daily fee", cell: ({ row }) => (loading ? <Pending /> : <LastFeeCell f={row.original.lastFee} />) },
	];
	return (
		<>
			{error && <Note tone="warning">{error}. Open a hotel to see its keys and fees.</Note>}
			<Toolbar
				left={<SearchBox value={q} onChange={setQ} placeholder="Search hotel or business…" />}
				right={<FilterSelect value={fee} onChange={(v) => void setFee(v || null)} all="Any fee state" options={FEE_FILTERS} />}
			/>
			<DataTable
				columns={columns}
				data={rows}
				search={q}
				onRowClick={(h) => {
					void setHotelTab("fees");
					void setHotel(h.id);
				}}
				filtered={!!fee}
				onClearFilters={() => void setFee(null)}
				emptyTitle="No hotels yet"
				emptyHint="Hotels appear here once a business has one. Add POS keys from a hotel's panel."
			/>
			<HotelDrawer hotels={hotels} role={role} />
		</>
	);
}
