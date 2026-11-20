"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Note } from "@hospio/ui/shared/detail-list";
import { MoneyField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { btn } from "@hospio/ui/shared/ui";
import { openTill } from "@hospio/api/actions/finance";
import { cashTill } from "@hospio/api/actions/payment";

type CashTillState = Awaited<ReturnType<typeof cashTill>> extends infer R
	? R extends { ok: true; data: infer D }
		? D
		: never
	: never;

function deskName(role: string) {
	return role === "FRONT_OFFICE" ? "front office" : role.toLowerCase().replace(/_/g, " ");
}

/**
 * The till a manager's or owner's cash goes into, for the plain "Record payment" forms (a folio, Payments → Record a payment):
 * the front office till (hospio-backend docs/operating-day.md "Manager and owner cash"). While cash is picked it says which till
 * takes it, or, when that till is closed, offers to open it with a float (or, when it was left open from an earlier day, says to
 * count and close it in Financials → Tills). `onBlocked` tells the form to hold its button while the cash can't be taken.
 */
export function CashTillNote({
	active,
	onBlocked,
}: {
	active: boolean;
	onBlocked: (blocked: boolean) => void;
}) {
	const [till, setTill] = useState<CashTillState | null>(null);
	const [float, setFloat] = useState<number | "">("");
	const [opening, setOpening] = useState(false);

	useEffect(() => {
		if (!active) {
			setTill(null);
			return;
		}
		let gone = false;
		cashTill()
			.then((r) => !gone && setTill(r.ok ? r.data : null))
			.catch(() => !gone && setTill(null));
		return () => {
			gone = true;
		};
	}, [active]);

	const blocked = active && !!till?.needed && !till.open;
	useEffect(() => onBlocked(blocked), [blocked, onBlocked]);

	if (!active || !till?.needed) return null;
	// A lounge, bar or restaurant with no rooms has no front office: walk-in cash is taken on the outlet's sale screen.
	if (till.noWalkInCash)
		return (
			<Note tone="warning">
				<p className="font-semibold text-ink">Take this cash on the sale screen</p>
				<p className="mt-1">{till.message}</p>
			</Note>
		);
	const name = `${deskName(till.tillRole ?? till.role)} till`;
	if (till.open)
		return (
			<p className="text-xs text-ink-3">
				The cash goes into the {name}
				{till.openedByName ? ` (opened by ${till.openedByName})` : ""}.
			</p>
		);
	if (till.stale)
		return (
			<Note tone="danger">
				<p className="font-semibold text-ink">Count and close the old till first</p>
				<p className="mt-1">{till.message ?? `The ${name} was left open from an earlier day.`}</p>
				{till.takenAs === "MANAGER" && (
					<a
						href="/dashboard/financials?tab=tills"
						className="mt-2 inline-block text-[13px] font-semibold text-brand underline"
					>
						Go to Financials → Tills
					</a>
				)}
			</Note>
		);

	async function open() {
		if (!till) return;
		setOpening(true);
		const r = await openTill({
			role: till.role,
			openingFloat: typeof float === "number" ? float : undefined,
		}).catch(() => null);
		setOpening(false);
		const again = await cashTill().catch(() => null);
		if (again?.ok) setTill(again.data);
		if (!r?.ok) {
			if (!(again?.ok && again.data.open))
				toast.error(r && !r.ok ? r.error : "The till could not be opened");
			return;
		}
		toast.success(`The ${name} is open`, {
			description: `Float ${naira(r.data.openingFloat)} · now record the cash`,
		});
	}

	return (
		<Note tone="warning">
			<p className="font-semibold text-ink">Open the {name} first</p>
			<p className="mt-1">
				{till.manager
					? `Your cash goes into the till of the desk where it is taken: the ${deskName(till.role)} for a folio, booking or walk-in, and that till isn't open. Count the float in its drawer and open it here, or take card or transfer instead.`
					: (till.message ?? `Cash here goes into the ${name}, and it isn't open.`)}
			</p>
			<div className="mt-3 flex flex-wrap items-end gap-2">
				<div className="min-w-[160px] flex-1">
					<MoneyField
						label="Opening float"
						value={float}
						onChange={setFloat}
						hint="Leave blank for the usual float"
					/>
				</div>
				<button type="button" className={btn.primary} disabled={opening} onClick={() => void open()}>
					{opening ? "Opening…" : `Open the ${name}`}
				</button>
			</div>
		</Note>
	);
}
