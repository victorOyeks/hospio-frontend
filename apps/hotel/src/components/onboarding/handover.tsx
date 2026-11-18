"use client";

import { venueLabel } from "@hospio/api/venue";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptHandover } from "@hospio/api/actions/onboarding";
import { acceptLegal } from "@hospio/api/actions/legal";
import { acceptItem, type LegalDoc } from "@hospio/api/api/routes-legal";
import { boxesFor, TickBox } from "@hospio/ui/shared/legal";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business } from "@hospio/api/api/schema";
import type { OwnerHotelRow, PortalUserRow } from "@hospio/api/data/types";
import { roleLabels } from "@hospio/api/roles";
import { Button } from "@hospio/ui/primitives/button";
import { Checkbox } from "@hospio/ui/primitives/checkbox";
import type { DevicePackageView } from "@hospio/api/actions/device-packages";
import { naira, plural } from "@hospio/ui/shared/format";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

const FEE: Record<string, (v: number) => string> = {
	PERCENT_OF_SALES: (v) => `${v}% of each day's sales, debited daily from your POS provider account`,
	PERCENT_OF_PAYMENTS: (v) => `${v}% of guest payments`,
	PERCENT_OF_BOOKINGS: (v) => `${v}% of bookings`,
	PER_ROOM_NIGHT: (v) => `₦${v.toLocaleString("en-NG")} per room-night`,
};

/** K3 · Review and accept the handover (Figma 3331:2380): what Hospio360 set up, a tick, and POST /tenant/handover/accept. */
export function HandoverReview({
	business,
	hotels,
	users,
	firstName,
	setupCount,
	devices = [],
	legal = [],
	outlets = {},
}: {
	/** Outlet names of each location without accommodation (hotel id → names). */
	outlets?: Record<string, string[]>;
	business: Business | null;
	hotels: OwnerHotelRow[];
	users: PortalUserRow[];
	firstName: string;
	setupCount: number;
	/** Devices & internet Hospio360 supplies, one package per hotel. */
	devices?: DevicePackageView[];
	/** The legal documents the owner still has to accept: the two boxes (they tick them; the admin never does). */
	legal?: LegalDoc[];
}) {
	const router = useRouter();
	const [agreed, setAgreed] = useState(false);
	const legalBoxes = boxesFor(legal);
	const [ticked, setTicked] = useState<Record<string, boolean>>({});
	const legalDone = legalBoxes.every((b) => ticked[b.id]);
	const { run, pending } = useAction();
	const rooms = hotels.reduce((s, h) => s + h.rooms, 0);
	// hospio-backend docs/plan-venue-type.md: rooms are counted only where there is accommodation; a lounge is named by its kind.
	const stays = hotels.filter((h) => h.hasAccommodation !== false);
	const venues = hotels.filter((h) => h.hasAccommodation === false);
	const allHotels = venues.length === 0;
	const people = users.filter((u) => u.role !== "OWNER");
	const roles = Array.from(
		new Set(people.map((u) => roleLabels[u.role])),
	).slice(0, 4);
	const fee =
		business?.feeModel && business.feeValue != null
			? (
					FEE[business.feeModel] ??
					((v: number) => `${business.feeModel} · ${v}`)
				)(business.feeValue)
			: "As agreed with Hospio360";

	const rows: { label: string; value: string }[] = [
		{
			label: plural(hotels.length, allHotels ? "hotel" : "location"),
			value:
				hotels
					.map((h) =>
						allHotels ? h.name : `${h.name} (${venueLabel(h.venueType)})`,
					)
					.join(" · ") || "None yet",
		},
		...(stays.length > 0
			? [
					{
						label: plural(rooms, "room"),
						value:
							rooms > 0
								? `Room types and prices set${venues.length ? ` at ${stays.map((h) => h.name).join(", ")}` : ""}`
								: "Rooms not added yet",
					},
				]
			: []),
		...venues.map((h) => {
			const names = outlets[h.hotelId] ?? [];
			return {
				label: venues.length > 1 ? `Outlets · ${h.name}` : plural(names.length, "outlet"),
				value: names.length
					? names.join(", ")
					: "Outlets are added in Hotel setup → Restaurants & tables",
			};
		}),
		{
			label: plural(people.length, "person", "people"),
			value: roles.length
				? `${roles.join(", ")} · roles and levels set`
				: "Logins come with your invite pack",
		},
		{
			label: "Hotel setup",
			value:
				setupCount > 0
					? `${plural(setupCount, "section")} of defaults applied to every ${allHotels ? "hotel" : "location"}`
					: "Default hotel settings",
		},
		{ label: "Fee", value: fee },
		...devices
			.filter((p) => p.paymentOption !== "OWN_DEVICES" || p.dataPlanMonthly > 0)
			.map((p) => ({
				label: `Devices${p.hotelName && hotels.length > 1 ? ` · ${p.hotelName}` : ""}`,
				value: [
					p.items.map((i) => `${i.quantity} × ${i.name}`).join(", "),
					p.paymentOption === "TRANSACTION"
						? `${naira(p.total)}, paid from ${p.deviceRate ?? 2.5}% of each day's sales`
						: p.paymentOption === "MONTHLY"
							? `${naira(p.total)} in ${p.months} monthly payments of ${naira(p.monthlyInstalment ?? 0)}`
							: p.paymentOption === "ONE_TIME"
								? `${naira(p.total)}, paid at installation`
								: null,
					p.dataPlanMonthly > 0 ? `data plan ${naira(p.dataPlanMonthly)} a month` : null,
				]
					.filter(Boolean)
					.join(" · "),
			})),
	];
	const supplied = devices.some((p) => p.total > 0);

	return (
		<div className="grid w-full max-w-[1000px] gap-5 xl:grid-cols-[320px_1fr]">
			<aside className="flex flex-col justify-end gap-2 rounded-card bg-brand px-7 py-8 text-white">
				<p className="text-2xl font-bold">Welcome, {firstName}</p>
				<p className="text-sm text-white/80">
					Hospio360 set up {business?.name ?? "your business"} for you. Check it,
					accept, and it's yours.
				</p>
			</aside>
			<section className="flex flex-col gap-5 rounded-card border border-line bg-card px-7 py-6">
				<div>
					<p className="text-xs font-semibold text-brand">
						Step 3 of 3 · Check what we set up
					</p>
					<h1 className="mt-1 text-2xl font-bold tracking-[-0.01em] text-ink">
						{allHotels ? "Your hotels are ready" : "Your business is ready"}
					</h1>
				</div>
				<dl className="divide-y divide-line border-y border-line">
					{rows.map((r) => (
						<div
							key={r.label}
							className="flex items-start justify-between gap-6 py-3"
						>
							<dt className="text-[13px] font-semibold text-ink">{r.label}</dt>
							<dd className="text-right text-[13px] text-ink-2">{r.value}</dd>
						</div>
					))}
				</dl>
				{people.length > 0 && (
					<div className="rounded-xl bg-subtle/70 px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-3">
							Logins Hospio360 created
						</p>
						<ul className="mt-2 grid gap-1 text-xs text-ink-2 sm:grid-cols-2">
							{people.slice(0, 8).map((u) => (
								<li key={u.id} className="truncate">
									<span className="font-semibold text-ink">{u.fullName}</span> ·{" "}
									{roleLabels[u.role]} · {u.hotels.join(", ")}
								</li>
							))}
							{people.length > 8 && (
								<li>and {people.length - 8} more under Users</li>
							)}
						</ul>
					</div>
				)}
				<div className="flex items-start gap-3 text-[13px] text-ink">
					<Checkbox
						id="handover-agree"
						checked={agreed}
						onCheckedChange={(v) => setAgreed(v === true)}
						className="mt-[2px] data-[state=checked]:border-brand data-[state=checked]:bg-brand"
					/>
					<label htmlFor="handover-agree">
						I've checked the setup and I accept the handover{supplied ? ", including the devices and how they are paid for" : ""}
					</label>
				</div>
				{legalBoxes.length > 0 && (
					<div className="flex flex-col gap-2" data-testid="handover-legal">
						{legalBoxes.map((b) => (
							<TickBox key={b.id} id={b.id} checked={!!ticked[b.id]} onChange={(v) => setTicked((t) => ({ ...t, [b.id]: v }))}>
								{b.label}
							</TickBox>
						))}
					</div>
				)}
				{supplied && (
					<p className="text-xs text-ink-2">
						The devices remain Hospio360's until they are paid off. If you leave before then, you pay what is left or
						return them.
					</p>
				)}
				<p className="text-xs text-ink-3">
					Hospio360 support can still help and make changes when needed. Every
					change is shown in your Activity log with a reason, and you can undo
					it within 7 days.
				</p>
				<Button
					className={cn(btn.primary, btn.large, "w-full")}
					disabled={!agreed || !legalDone || pending}
					onClick={() =>
						run(
							async () => {
								// The owner's own acceptance first (who, version, when, IP, browser; method HANDOVER), then the handover.
								if (legal.length) {
									const r = await acceptLegal({
										documents: legal.map(acceptItem),
										method: "HANDOVER",
									});
									if (!r.ok) return r;
								}
								return acceptHandover();
							},
							"Welcome to your dashboard",
							() => router.replace("/dashboard"),
						)
					}
				>
					{pending ? (
						<Loader2Icon className="size-4 animate-spin" />
					) : (
						"Accept and go to my dashboard"
					)}
				</Button>
				<a
					href="mailto:support@hospio360.com?subject=Handover%20check"
					className="text-[13px] font-semibold text-brand hover:underline"
				>
					Something not right? Tell support
				</a>
			</section>
		</div>
	);
}
