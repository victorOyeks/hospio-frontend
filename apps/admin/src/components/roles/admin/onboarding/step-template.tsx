"use client";

import { CheckCircle2Icon, CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { applyTemplate } from "@hospio/api/actions/hotel-config";
import {
	createOnboardingOutlet,
	type OnboardingOutlet,
	onboardingOutlets,
} from "@hospio/api/actions/onboarding";
import { hasAccommodation, venueLabel } from "@hospio/api/venue";
import { btn, input as inputCls } from "@hospio/ui/shared/ui";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { ChoiceCards } from "@hospio/ui/shared/field";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { cn } from "@hospio/ui/utils";
import type { WizardCtx } from "./wizard";
import {
	KeyRow,
	nextStep,
	prevStep,
	StepCard,
	roomsOrKind,
	StepFrame,
	useWizardSave,
	type WizardData,
} from "./shared";

/**
 * J8 · step 6: pick a setup template and the hotels to apply it to (POST /hotel-config/setup/apply-template per hotel).
 *
 * A location without rooms (hospio-backend docs/plan-venue-type.md, phase 3) never gets a hotel template: it starts from the
 * built-in "Lounge / bar / restaurant" setup (applied again here, `builtIn: "VENUE"`), and Hospio360 adds its outlets on this step
 * (name + kind, each linked to the store of its kind), so the owner's review lists them.
 */

type OutletKind = "BAR" | "RESTAURANT" | "KITCHEN";
const OUTLET_KINDS: { value: OutletKind; label: string }[] = [
	{ value: "BAR", label: "Bar / lounge" },
	{ value: "RESTAURANT", label: "Restaurant" },
	{ value: "KITCHEN", label: "Kitchen" },
];
const kindLabel = (k: string) => OUTLET_KINDS.find((x) => x.value === k)?.label ?? k;
type NewOutlet = { key: string; name: string; kind: OutletKind };
let seq = 0;

/** What the built-in venue template sets, in the admin's words. */
const VENUE_SETS: [string, string][] = [
	["Tabs", "On · limit ₦100,000 · flagged when open over 4 hours · a tab needs a name or a table"],
	["Payments", "Cash, card and transfer · till float ₦10,000 · receipts on WhatsApp · waiters don't take payment (the cashier does)"],
	["Taxes", "VAT 7.5 % included in prices · no service charge"],
	["Guest messages", "Receipts only (no booking or arrival messages)"],
	["Opening hours", "10:00 to 02:00 · day closes 04:00 (tills and open tabs only)"],
	["Reasons & lists", "Void, cancel and discount reasons for sales · Day and Evening shifts · Service, Cashier, Kitchen, Bar departments"],
	["Left out", "Stay rules, housekeeping, check-in times and charge to a room (they come back with hotel defaults if rooms are added)"],
];

const SECTION_LABELS: Record<string, string> = {
	BASICS: "Times & basics",
	BRAND: "Brand",
	STAY_RULES: "Stay rules",
	PAYMENTS: "Payments",
	TAXES_CURRENCY: "Taxes & currency",
	APPROVAL_LIMITS: "Approval limits",
	HOUSEKEEPING: "Housekeeping",
	OUTLETS: "Restaurants & bars",
	MESSAGING: "Guest messages",
	STAFF: "Staff",
	NIGHT_AUDIT: "Night audit",
	POS: "POS",
	lists: "Reasons & lists",
};

/** "checkInTime 14:00 · checkOutTime 12:00" for one section of a template. */
function describe(section: string, value: unknown): string {
	if (!value || typeof value !== "object") return String(value ?? "");
	if (section === "lists")
		return Object.entries(value as Record<string, unknown>)
			.map(
				([k, v]) =>
					`${k.toLowerCase().replace(/_/g, " ")} (${Array.isArray(v) ? v.length : 0})`,
			)
			.join(" · ");
	return Object.entries(value as Record<string, unknown>)
		.map(
			([k, v]) =>
				`${k
					.replace(/([A-Z])/g, " $1")
					.toLowerCase()
					.replace(/pct$/, " %")
					.trim()} ${typeof v === "boolean" ? (v ? "on" : "off") : String(v)}`,
		)
		.join(" · ");
}

export function TemplateStep({ ctx }: { ctx: WizardCtx }) {
	const { templates, data } = ctx;
	const saved = data.template;
	// Hotel templates go to locations with rooms; the others take the venue setup.
	const hotels = ctx.hotels.filter((h) => hasAccommodation(h));
	const venues = ctx.hotels.filter((h) => !hasAccommodation(h));
	// The outlets are read from fnb-service every time (the owner may add some too); the draft does not keep them.
	const [made, setMade] = useState<Record<string, OnboardingOutlet[]>>({});
	const [fresh, setFresh] = useState<Record<string, NewOutlet[]>>({});
	const venueIds = venues.map((v) => v.id).join(",");
	// What each venue already has (the owner or an earlier visit may have added some).
	useEffect(() => {
		let off = false;
		for (const v of venues)
			void onboardingOutlets(v.id).then((r) => {
				if (!off && r.ok) setMade((m) => ({ ...m, [v.id]: r.data }));
			});
		return () => {
			off = true;
		};
	}, [venueIds]);
	const addRow = (hotelId: string) =>
		setFresh((f) => ({
			...f,
			[hotelId]: [...(f[hotelId] ?? []), { key: `n${++seq}`, name: "", kind: "BAR" }],
		}));
	const patchRow = (hotelId: string, key: string, patch: Partial<NewOutlet>) =>
		setFresh((f) => ({
			...f,
			[hotelId]: (f[hotelId] ?? []).map((x) => (x.key === key ? { ...x, ...patch } : x)),
		}));
	const dropRow = (hotelId: string, key: string) =>
		setFresh((f) => ({ ...f, [hotelId]: (f[hotelId] ?? []).filter((x) => x.key !== key) }));

	/** The venue setup and the new outlets of every location without rooms; false when something was refused. */
	async function saveVenues(
		done: string[],
		when: Record<string, string>,
	): Promise<{ ok: boolean; outlets: Record<string, OnboardingOutlet[]> }> {
		const outlets = { ...made };
		for (const v of venues) {
			const rows = (fresh[v.id] ?? []).filter((x) => x.name.trim());
			const names = [...(outlets[v.id] ?? []).map((o) => o.name), ...rows.map((x) => x.name)].map((n) =>
				n.trim().toLowerCase(),
			);
			if (new Set(names).size !== names.length) {
				toast.error(`Give each outlet at ${v.name} its own name`);
				return { ok: false, outlets };
			}
			const applied = await applyTemplate({ builtIn: "VENUE" }, v.id);
			if (!applied.ok) {
				toast.error(applied.error, { duration: 8000 });
				return { ok: false, outlets };
			}
			if (!done.includes(v.id)) done.push(v.id);
			when[v.id] = new Date().toISOString();
			for (const row of rows) {
				const o = await createOnboardingOutlet(v.id, { name: row.name, kind: row.kind });
				if (!o.ok) {
					toast.error(`${row.name}: ${o.error}`, { duration: 8000 });
					setMade(outlets);
					return { ok: false, outlets };
				}
				outlets[v.id] = [...(outlets[v.id] ?? []), o.data];
				dropRow(v.id, row.key);
			}
		}
		setMade(outlets);
		return { ok: true, outlets };
	}
	const [templateId, setTemplateId] = useState(
		saved?.templateId ?? templates[0]?.id ?? "",
	);
	// The ticks saved last time come back; on a first visit every hotel without the setup is ticked.
	const [picked, setPicked] = useState<string[]>(() => {
		const ids = hotels.map((h) => h.id);
		if (saved?.picked) return saved.picked.filter((id) => ids.includes(id));
		const notYet = ids.filter((id) => !(saved?.appliedTo ?? []).includes(id));
		return saved?.appliedTo?.length ? notYet : ids;
	});
	const [appliedTo, setAppliedTo] = useState<string[]>(saved?.appliedTo ?? []);
	const [appliedAt, setAppliedAt] = useState<Record<string, string>>(
		saved?.appliedAt ?? {},
	);
	const { pending, busy } = useWizardSave();
	const template = templates.find((t) => t.id === templateId);
	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

	const apply = () =>
		busy(async () => {
			if (!templateId && picked.length > 0) {
				toast.error("Choose a template");
				return;
			}
			const done: string[] = [...appliedTo];
			const when = { ...appliedAt };
			const venueSave = await saveVenues(done, when);
			for (const hotelId of picked) {
				// applyTemplate answers {ok: true, data: null} on success, so the result itself is checked, not its data.
				const result = await applyTemplate({ templateId }, hotelId);
				if (!result.ok) {
					toast.error(result.error, { duration: 8000 });
					break;
				}
				if (!done.includes(hotelId)) done.push(hotelId);
				when[hotelId] = new Date().toISOString();
			}
			setAppliedTo(done);
			setAppliedAt(when);
			const applied = picked.filter((id) => done.includes(id)).length;
			if (applied > 0)
				toast.success(
					`${template?.name ?? "Template"} applied to ${applied} ${applied === 1 ? "hotel" : "hotels"}`,
				);
			if (venues.length > 0 && venueSave.ok)
				toast.success(
					`Lounge / bar / restaurant setup applied to ${venues.length} ${venues.length === 1 ? "location" : "locations"}`,
				);
			const row = await ctx.saveStep("template", {
				templateId: templateId || undefined,
				appliedTo: done,
				picked,
				appliedAt: when,
			} as NonNullable<WizardData["template"]>);
			if (row && applied === picked.length && venueSave.ok) ctx.goTo(nextStep("template"));
		});

	const skip = () =>
		busy(async () => {
			const row = await ctx.saveStep("template", {
				templateId: saved?.templateId,
				appliedTo,
				picked,
				appliedAt,
			} as NonNullable<WizardData["template"]>);
			if (row) ctx.goTo(nextStep("template"));
		});

	return (
		<StepFrame
			venue={ctx.venue}
			step="template"
			subtitle={
				hotels.length > 1
					? `Start from a ready setup, then change anything · applies to the locations you tick`
					: undefined
			}
			onBack={() => ctx.goTo(prevStep("template"))}
			onContinue={ctx.editable ? apply : undefined}
			continueLabel={
				picked.length + venues.length === 0
					? "Save and continue"
					: `Apply to ${picked.length + venues.length} ${picked.length + venues.length === 1 ? (venues.length ? "location" : "hotel") : venues.length ? "locations" : "hotels"} and continue`
			}
			continueDisabled={(!templateId && picked.length > 0) || ctx.hotels.length === 0}
			pending={pending}
			extra={
				ctx.editable && appliedTo.length > 0 ? (
					<button
						type="button"
						className="inline-flex min-h-[44px] items-center whitespace-nowrap px-1 text-[13px] font-semibold text-brand hover:underline"
						onClick={skip}
						disabled={pending}
					>
						Continue without re-applying
					</button>
				) : undefined
			}
			footerNote="Each location already answers with the default setup; the template changes what differs. Anything can be changed later in its setup."
		>
			{venues.length > 0 && (
				<StepCard
					title="Lounge / bar / restaurant setup"
					subtitle={`Applied to ${venues.map((v) => v.name).join(", ")}: ${venues.length === 1 ? "it has" : "they have"} no rooms, so no hotel template`}
				>
					<div>
						{VENUE_SETS.map(([label, text], i) => (
							<KeyRow key={label} label={label} last={i === VENUE_SETS.length - 1}>
								<span className="block min-w-0 break-words text-xs">{text}</span>
							</KeyRow>
						))}
					</div>
				</StepCard>
			)}

			{venues.map((v) => {
				const have = made[v.id] ?? [];
				const rows = fresh[v.id] ?? [];
				return (
					<StepCard
						key={v.id}
						title={`Outlets at ${v.name}`}
						subtitle={`${venueLabel(v.venueType)} · where it sells: each outlet gets its own menu, tables and sales, and draws from the store of its kind`}
						headerRight={
							appliedTo.includes(v.id) ? <StatusPill tone="success">setup applied</StatusPill> : undefined
						}
					>
						{have.length > 0 && (
							<ul className="flex flex-col gap-2" aria-label={`Outlets at ${v.name}`}>
								{have.map((o) => (
									<li
										key={o.outletId}
										className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-[13px]"
									>
										<CheckCircle2Icon className="size-4 shrink-0 text-success" />
										<span className="min-w-0 truncate font-semibold text-ink">{o.name}</span>
										<span className="shrink-0 text-ink-3">· {kindLabel(o.kind)}</span>
									</li>
								))}
							</ul>
						)}
						{have.length === 0 && rows.length === 0 && (
							<p className="text-[13px] text-ink-3">
								No outlets yet. Add the bar, the restaurant floor or the kitchen, or the owner adds them in the
								location's own setup → Restaurants & tables.
							</p>
						)}
						{rows.map((row) => (
							<div key={row.key} className="grid grid-cols-[minmax(0,1fr)_150px_36px] gap-2">
								<input
									aria-label="Outlet name"
									className={inputCls}
									value={row.name}
									placeholder="Main bar"
									onChange={(e) => patchRow(v.id, row.key, { name: e.target.value })}
								/>
								<select
									aria-label="Outlet kind"
									className={inputCls}
									value={row.kind}
									onChange={(e) => patchRow(v.id, row.key, { kind: e.target.value as OutletKind })}
								>
									{OUTLET_KINDS.map((k) => (
										<option key={k.value} value={k.value}>
											{k.label}
										</option>
									))}
								</select>
								<button
									type="button"
									aria-label={`Remove ${row.name || "this outlet"}`}
									className="flex items-center justify-center rounded-control text-ink-3 hover:bg-subtle hover:text-danger"
									onClick={() => dropRow(v.id, row.key)}
								>
									<Trash2Icon className="size-4" />
								</button>
							</div>
						))}
						{ctx.editable && (
							<button type="button" className={cn(btn.secondary, "inline-flex items-center gap-2 self-start")} onClick={() => addRow(v.id)}>
								<PlusIcon className="size-4" /> Add an outlet
							</button>
						)}
					</StepCard>
				);
			})}

			{hotels.length === 0 ? null : templates.length === 0 ? (
				<EmptyState
					title="No templates yet"
					hint="The locations keep the default setup. Continue and adjust each location in its setup."
				/>
			) : (
				<StepCard title="Choose a template">
					<ChoiceCards
						value={templateId}
						onChange={setTemplateId}
						options={templates.map((t) => ({
							value: t.id,
							label: t.name,
							hint: t.description,
						}))}
					/>
				</StepCard>
			)}

			{template && hotels.length > 0 && (
				<StepCard
					title="What it fills in"
					subtitle="You can open any of these in its setup to change them"
				>
					<div>
						{Object.entries(template.settings).map(
							([section, value], i, arr) => (
								<KeyRow
									key={section}
									label={SECTION_LABELS[section] ?? section}
									last={i === arr.length - 1}
								>
									<span className="block min-w-0 break-words text-xs">
										{describe(section, value) || "—"}
									</span>
								</KeyRow>
							),
						)}
						{Object.keys(template.settings).length === 0 && (
							<p className="py-3 text-[13px] text-ink-3">
								This template only confirms the defaults.
							</p>
						)}
					</div>
				</StepCard>
			)}

			{hotels.length > 0 && (
			<StepCard
				title="Apply to"
				subtitle={
					hotels.length === 0
						? "Add a location first"
						: "Tick the locations that should start from this setup"
				}
			>
				<ul className="flex flex-col gap-2">
					{hotels.map((h) => {
						const on = picked.includes(h.id);
						const was = appliedTo.includes(h.id);
						return (
							<li key={h.id}>
								<button
									type="button"
									onClick={() => toggle(h.id)}
									disabled={!ctx.editable}
									className={cn(
										"flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left",
										on
											? "border-brand bg-brand-soft/40"
											: "border-line bg-card hover:bg-subtle",
									)}
								>
									<span
										className={cn(
											"flex size-5 shrink-0 items-center justify-center rounded-md border",
											on
												? "border-brand bg-brand text-white"
												: "border-line-strong",
										)}
									>
										{on && <CheckIcon className="size-3" />}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-[13px] font-semibold text-ink">
											{h.name}
										</span>
										<span className="block text-xs text-ink-3">
											{h.city || "—"} · {roomsOrKind(h)}
										</span>
									</span>
									{was && (
										<StatusPill tone="success">
											{appliedAt[h.id]
												? `applied ${new Date(appliedAt[h.id]).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
												: "applied"}
										</StatusPill>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			</StepCard>
			)}
		</StepFrame>
	);
}
