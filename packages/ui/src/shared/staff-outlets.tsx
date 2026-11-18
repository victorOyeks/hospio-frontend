"use client";

import { useEffect, useState } from "react";
import { setStaffOutlets } from "@hospio/api/actions/bill";
import { type StaffOutletChoices, staffOutletChoices } from "@hospio/api/actions/staff-outlets";
import { Field } from "./field";
import { PanelSection } from "./side-panel";

/**
 * The outlets a person works (hospio-backend docs/plan-venue-type.md, phase 4). A waiter, cashier, bar or kitchen person can be
 * kept to some outlets of a location that has two or more; nobody picked means every outlet, as before. Managers, the owner and
 * finance are never narrowed, so the picker is not shown for them.
 */

const OUTLET_ROLES = new Set(["WAITER", "CASHIER", "BAR", "KITCHEN"]);
export const worksOutlets = (role?: string | null) => !!role && OUTLET_ROLES.has(role);

/** One read per location while the screen is open; forgotten after a save so the next panel shows what was saved. */
const loaded = new Map<string, Promise<StaffOutletChoices>>();
const none: StaffOutletChoices = { outlets: [], assigned: {} };

function useStaffOutlets(hotelId: string | undefined, enabled: boolean): StaffOutletChoices | null {
	const [got, setGot] = useState<{ key: string; choices: StaffOutletChoices } | null>(null);
	const key = hotelId ?? "";
	useEffect(() => {
		if (!enabled) return;
		let on = true;
		let p = loaded.get(key);
		if (!p) {
			p = staffOutletChoices(hotelId).catch(() => none);
			loaded.set(key, p);
		}
		void p.then((choices) => on && setGot({ key, choices }));
		return () => {
			on = false;
		};
	}, [key, hotelId, enabled]);
	return enabled && got?.key === key ? got.choices : null;
}

/**
 * Save a person's outlets after they (or their role) are saved. `picked` null means the picker was not touched: nothing is sent.
 * Every outlet ticked is the same as none, so it is sent as an empty list.
 */
export async function saveStaffOutlets(userId: string, picked: string[] | null, hotelId?: string, outletCount?: number) {
	if (picked === null) return { ok: true as const, data: null };
	const ids = outletCount !== undefined && picked.length >= outletCount ? [] : picked;
	const r = await setStaffOutlets(userId, ids, hotelId);
	loaded.delete(hotelId ?? "");
	return r.ok ? { ok: true as const, data: null } : r;
}

/**
 * "Outlets" on Add staff and Edit staff: All outlets, or the ones ticked. Renders nothing unless the role works outlets and the
 * location has two or more. `value` null = not touched yet (shows what is saved for `userId`, or All outlets for someone new).
 */
export function StaffOutletsField({
	hotelId,
	role,
	userId,
	value,
	onChange,
	disabled,
}: {
	hotelId?: string;
	role?: string | null;
	userId?: string;
	value: string[] | null;
	onChange: (ids: string[]) => void;
	disabled?: boolean;
}) {
	const choices = useStaffOutlets(hotelId, worksOutlets(role));
	if (!choices || choices.outlets.length < 2) return null;
	const all = choices.outlets.map((o) => o.id);
	const saved = (userId ? choices.assigned[userId] : undefined)?.filter((id) => all.includes(id)) ?? [];
	const picked = value ?? saved;
	const everywhere = picked.length === 0 || picked.length === all.length;
	const box = "flex min-w-0 items-center gap-3 rounded-control border border-line px-4 py-3 text-[13px] text-ink";
	return (
		<Field
			label="Outlets"
			hint={
				everywhere
					? "They work every outlet of this location. Tick some to keep them to those"
					: "They take orders, sales and payments only at the outlets ticked"
			}
		>
			<div className="grid gap-2 sm:grid-cols-2">
				<label className={`${box} sm:col-span-2`}>
					<input
						type="checkbox"
						checked={everywhere}
						disabled={disabled || everywhere}
						onChange={() => onChange([])}
						className="accent-brand"
					/>
					All outlets
				</label>
				{choices.outlets.map((o) => (
					<label key={o.id} className={box}>
						<input
							type="checkbox"
							checked={!everywhere && picked.includes(o.id)}
							disabled={disabled}
							onChange={() => {
								const now = everywhere ? [] : picked;
								onChange(all.filter((id) => (id === o.id ? !now.includes(id) : now.includes(id))));
							}}
							className="accent-brand"
						/>
						<span className="min-w-0 break-words">{o.name}</span>
					</label>
				))}
			</div>
		</Field>
	);
}

/** "Works at: Main Bar, VIP Lounge" (or All outlets) on a person's profile; nothing where the picker would not show. */
export function StaffOutletsLine({ hotelId, role, userId }: { hotelId?: string; role?: string | null; userId: string }) {
	const choices = useStaffOutlets(hotelId, worksOutlets(role));
	if (!choices || choices.outlets.length < 2) return null;
	const mine = choices.assigned[userId] ?? [];
	const names = choices.outlets.filter((o) => mine.includes(o.id)).map((o) => o.name);
	const everywhere = names.length === 0 || names.length === choices.outlets.length;
	return (
		<PanelSection title="Outlets">
			<p className="text-[13px] text-ink-2">
				Works at: <span className="font-medium text-ink">{everywhere ? "All outlets" : names.join(", ")}</span>
			</p>
			<p className="mt-1 text-xs text-ink-3">Change it with Edit.</p>
		</PanelSection>
	);
}
