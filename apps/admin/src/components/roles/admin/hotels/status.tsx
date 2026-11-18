"use client";

import { useEffect, useState } from "react";
import { loadHotelFees } from "@hospio/api/actions/admin-search";
import type { HotelCollectionSummary, HotelDirectoryRow } from "@hospio/api/data/admin-types";
import { naira } from "@hospio/ui/shared/format";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { feeStatus } from "../hotel-fees";

/** The pieces of a hotel's POS and fee state that the Hotels list and Payments → POS & fee collection both show. */

/**
 * The hotels with their fee columns filled in from the browser: the list shows at once, and the per-hotel fee calls (slow
 * with many hotels) follow. `loading` is true until they land.
 */
export function useHotelFees(hotels: HotelDirectoryRow[], money: boolean) {
	const [rows, setRows] = useState(hotels);
	const [loading, setLoading] = useState(money);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		setRows(hotels);
		if (!money || hotels.length === 0) {
			setLoading(false);
			return;
		}
		let alive = true;
		setLoading(true);
		void loadHotelFees(hotels).then((r) => {
			if (!alive) return;
			if (r.ok) setRows(r.data);
			else setError(r.error);
			setLoading(false);
		});
		return () => {
			alive = false;
		};
	}, [hotels, money]);
	return { rows, loading, error };
}

export const Pending = () => <span className="text-[12px] text-ink-3">Loading…</span>;

export const providerName = (p?: string | null) => (p === "OPAY" ? "OPay" : p === "MONIEPOINT" ? "Moniepoint" : null);

export function KeysCell({ c }: { c: HotelCollectionSummary | null }) {
	if (!c) return <span className="text-ink-3">—</span>;
	const names = (c.providers?.length ? c.providers : c.keysIn && c.provider ? [c.provider] : []).map(providerName).filter(Boolean);
	return (
		<span className="flex flex-col gap-[2px]">
			{c.keysIn ? <StatusPill tone="success">Keys in</StatusPill> : <StatusPill tone="warning">No keys</StatusPill>}
			<span className="text-[11px] text-ink-3">{names.length ? names.join(" · ") : "No provider yet"}</span>
		</span>
	);
}

/** The Hospio fee is billed on the business's monthly invoice; POS payments pause while that invoice is unpaid past its last day. */
export function FeeStateCell({ c }: { c: HotelCollectionSummary | null }) {
	if (!c) return <span className="text-ink-3">—</span>;
	return (
		<span className="flex flex-wrap items-center gap-1">
			<StatusPill tone="info">Monthly invoice</StatusPill>
			{c.posPaused && <StatusPill tone="danger">POS paused · unpaid invoice</StatusPill>}
		</span>
	);
}

export function LastFeeCell({ f }: { f: HotelDirectoryRow["lastFee"] }) {
	if (!f) return <span className="text-ink-3">None yet</span>;
	return (
		<span className="flex flex-col gap-[2px]">
			<span>
				{naira(f.fee)}{" "}
				<span className="text-[11px] text-ink-3">
					{new Date(`${f.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
				</span>
			</span>
			{feeStatus(f.status)}
		</span>
	);
}

/** The fee filter on both lists. */
export const FEE_FILTERS = [
	{ value: "nokeys", label: "No POS keys" },
	{ value: "paused", label: "POS paused (unpaid invoice)" },
];

export function feeFilterMatches(h: HotelDirectoryRow, filter: string) {
	const c = h.collection;
	switch (filter) {
		case "nokeys":
			return !!c && !c.keysIn;
		case "paused":
			return !!c?.posPaused;
		default:
			return true;
	}
}
