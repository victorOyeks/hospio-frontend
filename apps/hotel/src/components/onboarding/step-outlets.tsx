"use client";

import { CheckCircle2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	createOnboardingOutlet,
	type OnboardingOutlet,
	saveMyOnboardingStep,
} from "@hospio/api/actions/onboarding";
import { useAction } from "@hospio/api/actions/use-action";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SideCard, StepCard, StepFooter, StepPage, gridHead } from "./common";
import { useFreshOnOpen } from "./persist";
import { placeWord, setupWord, stepHref } from "./steps";

type OutletKind = "BAR" | "RESTAURANT" | "KITCHEN";
const KINDS: { value: OutletKind; label: string }[] = [
	{ value: "BAR", label: "Bar" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "KITCHEN", label: "Kitchen" },
];
const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;

type Row = { key: string; name: string; kind: OutletKind };
let seq = 0;
const newRow = (patch: Partial<Row> = {}): Row => ({
	key: `o${++seq}`,
	name: "",
	kind: "BAR",
	...patch,
});

/** What a business of this kind usually starts with: a lounge or bar its bar and kitchen, a restaurant its dining room and bar. */
function suggested(kind: string | null | undefined, place: string): Row[] {
	if (kind === "RESTAURANT")
		return [
			newRow({ name: `${place} dining`, kind: "RESTAURANT" }),
			newRow({ name: "Bar", kind: "BAR" }),
		];
	return [newRow({ name: "Bar", kind: "BAR" }), newRow({ name: "Kitchen", kind: "KITCHEN" })];
}

/**
 * Step 3 at a lounge, bar or restaurant (hospio-backend docs/plan-venue-type.md): no rooms, so the owner names where they sell.
 * Each outlet is POST /fnb/outlets on the new location, linked to the store of its kind; the step saves `outlets` in the draft
 * (same step number as Rooms & prices). At least one outlet; more can be added in Hotel setup → Restaurants & tables.
 */
export function OutletsStep({
	draft,
	kind,
	existing,
}: {
	draft: OwnerOnboardingData;
	kind?: string | null;
	/** The location's outlets already made (coming back to the step). */
	existing: OnboardingOutlet[];
}) {
	const router = useRouter();
	useFreshOnOpen();
	const hotel = draft.hotel;
	const place = hotel?.name ?? `Your ${placeWord(kind)}`;
	const made = existing.length
		? existing
		: (draft.rooms?.outlets ?? []);
	const [rows, setRows] = useState<Row[]>(() =>
		made.length ? [] : suggested(kind, place),
	);
	const [error, setError] = useState<string | null>(null);
	const { run, pending } = useAction();

	const fresh = rows.filter((r) => r.name.trim());
	const total = made.length + fresh.length;

	function submit() {
		if (!hotel?.hotelId) {
			setError(`Add your ${placeWord(kind)} first`);
			return;
		}
		if (total === 0) {
			setError("Add at least one outlet: where you sell drinks or food");
			return;
		}
		const names = [...made.map((m) => m.name), ...fresh.map((r) => r.name)].map((n) =>
			n.trim().toLowerCase(),
		);
		if (new Set(names).size !== names.length) {
			setError("Give each outlet its own name");
			return;
		}
		setError(null);
		run(
			async () => {
				const all: OnboardingOutlet[] = [...made];
				for (const r of fresh) {
					const o = await createOnboardingOutlet(hotel.hotelId, {
						name: r.name,
						kind: r.kind,
					});
					if (!o.ok) return { ok: false as const, error: o.error };
					all.push(o.data);
				}
				return saveMyOnboardingStep("rooms", { outlets: all });
			},
			fresh.length ? "Outlets saved" : "Saved",
			() => router.push(stepHref("manager")),
		);
	}

	return (
		<StepPage
			aside={
				<>
					<SideCard title="What is an outlet?">
						<p>
							Each place that takes orders: the bar, the restaurant floor, the
							kitchen. Staff sell from their outlet, and its stock comes from
							its store (the Bar store for a bar, the Kitchen store otherwise).
						</p>
					</SideCard>
					<SideCard title="Rooms later?">
						<p>
							If you add rooms one day, bookings, folios and charging to a
							room switch on by themselves.
						</p>
					</SideCard>
				</>
			}
		>
			<StepCard
				step="rooms"
				title={`Outlets at ${place}`}
				intro={`Where do you sell? Add at least one outlet. Menus, tables and more outlets live in ${setupWord(kind)} → Restaurants & tables.`}
			>
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					{made.length > 0 && (
						<ul className="flex flex-col gap-2" aria-label="Outlets made">
							{made.map((m) => (
								<li
									key={m.outletId}
									className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-[13px]"
								>
									<CheckCircle2Icon className="size-4 text-success" />
									<span className="font-semibold text-ink">{m.name}</span>
									<span className="text-ink-3">· {kindLabel(m.kind)}</span>
								</li>
							))}
						</ul>
					)}
					{rows.length > 0 && (
						<div className="flex flex-col gap-2">
							<div className={cn("grid grid-cols-[minmax(0,1fr)_120px_44px] gap-2 sm:grid-cols-[minmax(0,1fr)_160px_44px]", gridHead)}>
								<span>Outlet name</span>
								<span>Kind</span>
								<span />
							</div>
							{rows.map((r) => (
								<div key={r.key} className="grid grid-cols-[minmax(0,1fr)_120px_44px] gap-2 sm:grid-cols-[minmax(0,1fr)_160px_44px]">
									<input
										aria-label="Outlet name"
										className={inputCls}
										value={r.name}
										placeholder="Main bar"
										onChange={(e) =>
											setRows((rs) =>
												rs.map((x) =>
													x.key === r.key ? { ...x, name: e.target.value } : x,
												),
											)
										}
									/>
									<select
										aria-label="Outlet kind"
										className={inputCls}
										value={r.kind}
										onChange={(e) =>
											setRows((rs) =>
												rs.map((x) =>
													x.key === r.key
														? { ...x, kind: e.target.value as OutletKind }
														: x,
												),
											)
										}
									>
										{KINDS.map((k) => (
											<option key={k.value} value={k.value}>
												{k.label}
											</option>
										))}
									</select>
									<button
										type="button"
										aria-label="Remove outlet"
										className="flex min-h-[44px] items-center justify-center text-ink-3 hover:text-ink"
										onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
									>
										<Trash2Icon className="size-4" />
									</button>
								</div>
							))}
						</div>
					)}
					<button
						type="button"
						className={cn(btn.secondary, btn.small, "flex w-fit items-center gap-2")}
						onClick={() => setRows((rs) => [...rs, newRow()])}
					>
						<PlusIcon className="size-4" /> Add an outlet
					</button>
					{error && (
						<p role="alert" className="text-[13px] font-medium text-danger">
							{error}
						</p>
					)}
					<StepFooter
						back={stepHref("hotel")}
						label="Continue"
						pending={pending}
						onContinue={submit}
						info={
							total
								? `${total} ${total === 1 ? "outlet" : "outlets"} · each draws stock from the store of its kind`
								: "At least one outlet"
						}
					/>
				</form>
			</StepCard>
		</StepPage>
	);
}
