"use client";

import { addDays, format, parseISO, startOfWeek } from "date-fns";
import {
	ArrowLeftRightIcon,
	CalendarDaysIcon,
	CopyIcon,
	PlusIcon,
	SparklesIcon,
	UserCheckIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtDay, humanize, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import {
	addShift,
	cancelShift,
	changeShift,
	copyRotaWeek,
	swapShifts,
} from "@hospio/api/actions/workforce";
import { useAction } from "@hospio/api/actions/use-action";
import type { ShiftRow, StaffRow } from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	departmentFor,
	type RotaSetup,
	type ShiftPreset,
	shiftsSentence,
} from "@hospio/api/data/rota-setup";
import { useWording } from "@hospio/ui/shared/wording";

/** The shift as the actions want it: who, when, and the times to keep. */
const asInput = (s: ShiftRow) => ({
	userId: s.staffId,
	userName: s.staffName,
	role: s.role,
	date: s.date,
	starts: s.starts,
	ends: s.ends,
});

/** Hotel time: the rota's days are Lagos days whatever the browser's clock says. */
const today = () =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
		new Date(),
	);

/** The Monday of the week holding the day (rota weeks run Monday to Sunday). */
export const weekOf = (day: string) =>
	format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), "yyyy-MM-dd");

type Person = {
	key: string;
	fullName: string;
	role: string;
	department: string;
	status: StaffRow["status"];
};

/**
 * Everyone who can work a shift, grouped by department: active staff (owners only when they hold a shift), plus anyone
 * holding a shift this week who is not in the staff list any more, so no shift goes unseen.
 */
function rotaPeople(
	staff: StaffRow[],
	weekShifts: ShiftRow[],
	setup: RotaSetup,
) {
	const holds = new Set(weekShifts.map((s) => s.staffId));
	const people: Person[] = staff
		.filter((s) => {
			const key = s.userId ?? s.id;
			if (holds.has(key)) return true;
			if (s.role === "OWNER") return false;
			return s.status === "ACTIVE" || s.status === "ON_LEAVE";
		})
		.map((s) => ({
			key: s.userId ?? s.id,
			fullName: s.fullName,
			role: s.role,
			department: departmentFor(setup, s.role).name,
			status: s.status,
		}));
	const known = new Set(people.map((p) => p.key));
	for (const s of weekShifts) {
		if (known.has(s.staffId)) continue;
		known.add(s.staffId);
		people.push({
			key: s.staffId,
			fullName: s.staffName,
			role: s.role,
			department: departmentFor(setup, s.role).name,
			status: "ACTIVE",
		});
	}
	const rankOf = new Map(
		people.map((p) => [p.department, departmentFor(setup, p.role).rank]),
	);
	const rank = (d: string) => rankOf.get(d) ?? Number.MAX_SAFE_INTEGER;
	const groups = new Map<string, Person[]>();
	for (const p of [...people].sort(
		(a, b) =>
			rank(a.department) - rank(b.department) ||
			a.department.localeCompare(b.department) ||
			a.fullName.localeCompare(b.fullName),
	)) {
		groups.set(p.department, [...(groups.get(p.department) ?? []), p]);
	}
	return [...groups.entries()];
}

export function RotaGrid({
	staff,
	shifts,
	week,
	onWeek,
	onFindCover,
	onSwap,
	onAutoFill,
	setup,
}: {
	staff: StaffRow[];
	shifts: ShiftRow[];
	/** The hotel's shifts and departments (Hotel setup → Staff & shifts). */
	setup: RotaSetup;
	/** The Monday of the week on show (yyyy-MM-dd). */
	week: string;
	onWeek: (monday: string) => void;
	onFindCover: (s: ShiftRow) => void;
	onSwap: (s: ShiftRow) => void;
	onAutoFill: () => void;
}) {
	const { place: w } = useWording();
	const [adding, setAdding] = useState<{ person: Person; date: string } | null>(
		null,
	);
	const [copying, setCopying] = useState(false);
	const start = parseISO(week);
	const days = Array.from({ length: 7 }, (_, i) =>
		format(addDays(start, i), "yyyy-MM-dd"),
	);
	const now = today();
	const inWeek = shifts.filter(
		(s) => s.date >= days[0] && s.date <= days[6] && s.status !== "CANCELLED",
	);
	const groups = rotaPeople(staff, inWeek, setup);
	const gaps = shifts.filter(
		(s) => s.status === "ABSENT" && s.date >= now,
	).length;
	const isThisWeek = week === weekOf(now);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-1 rounded-control border border-line bg-card p-1">
					<button
						type="button"
						className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle"
						onClick={() => onWeek(format(addDays(start, -7), "yyyy-MM-dd"))}
					>
						← Prev week
					</button>
					<span className="px-2 text-[13px] font-semibold text-ink">
						{format(start, "d MMM")} – {format(addDays(start, 6), "d MMM")}
					</span>
					<button
						type="button"
						className="rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:bg-subtle"
						onClick={() => onWeek(format(addDays(start, 7), "yyyy-MM-dd"))}
					>
						Next week →
					</button>
				</div>
				{!isThisWeek && (
					<button
						type="button"
						className="rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-subtle"
						onClick={() => onWeek(weekOf(now))}
					>
						This week
					</button>
				)}
				<div className="ml-auto flex items-center gap-2">
					{gaps > 0 && (
						<StatusPill tone="danger">
							{plural(gaps, "gap")} to cover
						</StatusPill>
					)}
					<Button
						variant="outline"
						className={btn.secondary}
						disabled={days[6] < now}
						onClick={() => setCopying(true)}
					>
						<CopyIcon className="size-4" /> Copy last week
					</Button>
					<Button
						variant="outline"
						className={btn.secondary}
						onClick={onAutoFill}
					>
						<SparklesIcon className="size-4" /> Auto-fill gaps
					</Button>
				</div>
			</div>
			<div className="overflow-x-auto rounded-card border border-line bg-card">
				<table className="w-full min-w-[900px] text-left">
					<thead>
						<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="w-56 px-4 py-[10px]">Staff</th>
							{days.map((d) => (
								<th
									key={d}
									className={cn(
										"px-2 py-[10px] text-center",
										d === now && "text-brand",
									)}
								>
									{format(parseISO(d), "EEE")}
									<span className="block text-[10px] font-medium normal-case tracking-normal">
										{format(parseISO(d), "d MMM")}
									</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{groups.length === 0 && (
							<tr>
								<td
									colSpan={8}
									className="px-4 py-6 text-center text-[13px] text-ink-3"
								>
									No active staff yet. Add people in All staff first.
								</td>
							</tr>
						)}
						{groups.map(([dept, people]) => (
							<RotaDepartment
								key={dept}
								dept={dept}
								people={people}
								days={days}
								shifts={inWeek}
								now={now}
								onAdd={(person, date) => setAdding({ person, date })}
								onFindCover={onFindCover}
								onSwap={onSwap}
							/>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-xs text-ink-3">
				Tap + in an empty day to add a shift, a shift to swap or cancel it, or a
				gap to find cover. Shifts: {shiftsSentence(setup.shifts)}. Change them,
				the departments and when someone counts as late in {w.setup} → Staff &
				shifts.
			</p>
			<AddShiftModal
				target={adding}
				shifts={setup.shifts}
				onClose={() => setAdding(null)}
			/>
			<CopyWeekModal
				open={copying}
				week={week}
				shifts={shifts}
				staff={staff}
				onClose={() => setCopying(false)}
			/>
		</div>
	);
}

function RotaDepartment({
	dept,
	people,
	days,
	shifts,
	now,
	onAdd,
	onFindCover,
	onSwap,
}: {
	dept: string;
	people: Person[];
	days: string[];
	shifts: ShiftRow[];
	now: string;
	onAdd: (p: Person, date: string) => void;
	onFindCover: (s: ShiftRow) => void;
	onSwap: (s: ShiftRow) => void;
}) {
	const keys = new Set(people.map((p) => p.key));
	const count = shifts.filter((s) => keys.has(s.staffId)).length;
	return (
		<>
			<tr className="border-b border-line bg-subtle/40">
				<td
					colSpan={8}
					className="px-4 py-[6px] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-2"
				>
					{dept}
					<span className="ml-2 font-medium normal-case tracking-normal text-ink-3">
						{plural(people.length, "person", "people")} ·{" "}
						{plural(count, "shift")} this week
					</span>
				</td>
			</tr>
			{people.map((p) => (
				<tr key={p.key} className="border-b border-line last:border-b-0">
					<td className="px-4 py-2">
						<p className="text-[13px] font-semibold text-ink">{p.fullName}</p>
						<p className="text-xs text-ink-3">
							{humanize(p.role)}
							{p.status === "ON_LEAVE" ? " · on leave" : ""}
						</p>
					</td>
					{days.map((d) => {
						const mine = shifts.filter(
							(x) => x.staffId === p.key && x.date === d,
						);
						if (mine.length === 0)
							return (
								<td key={d} className="px-1 py-1 text-center">
									{d >= now ? (
										<button
											type="button"
											aria-label={`Add a shift for ${p.fullName} on ${fmtDay(d)}`}
											onClick={() => onAdd(p, d)}
											className="group flex h-[42px] w-full items-center justify-center rounded-lg border border-dashed border-transparent text-ink-3 hover:border-line hover:bg-subtle/60 hover:text-ink"
										>
											<PlusIcon className="size-4 opacity-30 group-hover:opacity-100" />
										</button>
									) : (
										<span className="text-xs text-ink-3">—</span>
									)}
								</td>
							);
						return (
							<td key={d} className="px-1 py-1">
								<div className="flex flex-col gap-1">
									{mine.map((s) => (
										<ShiftChip
											key={s.id}
											s={s}
											now={now}
											onClick={() =>
												s.status === "ABSENT" ? onFindCover(s) : onSwap(s)
											}
										/>
									))}
								</div>
							</td>
						);
					})}
				</tr>
			))}
		</>
	);
}

function ShiftChip({
	s,
	now,
	onClick,
}: {
	s: ShiftRow;
	now: string;
	onClick: () => void;
}) {
	const tone =
		s.status === "ABSENT"
			? "border-danger/40 bg-danger-soft text-danger"
			: s.status === "LATE"
				? "border-warning/40 bg-warning-soft text-warning"
				: s.status === "PRESENT"
					? "border-success/30 bg-success-soft text-success"
					: s.status === "COVERED" || s.status === "SWAPPED"
						? "border-info/30 bg-info-soft text-info"
						: "border-line bg-subtle/60 text-ink";
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full flex-col items-center rounded-lg border px-1 py-[6px] text-[11px] font-semibold leading-tight hover:opacity-80",
				tone,
			)}
		>
			{s.starts}–{s.ends}
			<span className="text-[10px] font-medium opacity-80">
				{s.status === "ABSENT"
					? s.date >= now
						? "Needs cover"
						: "Absent"
					: s.status === "SCHEDULED"
						? "Scheduled"
						: humanize(s.status)}
			</span>
		</button>
	);
}

const CUSTOM = "Custom";

/** One shift for one person on one day, from an empty cell on the rota. */
function AddShiftModal({
	target,
	shifts,
	onClose,
}: {
	target: { person: Person; date: string } | null;
	shifts: ShiftPreset[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const first = shifts[0]?.name ?? CUSTOM;
	const [kind, setKind] = useState(first);
	const [starts, setStarts] = useState("09:00");
	const [ends, setEnds] = useState("17:00");
	const times: [string, string] | undefined =
		kind === CUSTOM
			? [starts, ends]
			: (() => {
					const p = shifts.find((s) => s.name === kind);
					return p ? [p.starts, p.ends] : undefined;
				})();
	const valid =
		!!times &&
		/^\d\d:\d\d$/.test(times[0]) &&
		/^\d\d:\d\d$/.test(times[1]) &&
		times[0] !== times[1];
	const close = () => {
		setKind(first);
		onClose();
	};
	return (
		<Modal
			open={!!target}
			onOpenChange={(o) => !o && close()}
			icon={CalendarDaysIcon}
			title="Add a shift"
			subtitle={
				target
					? `${target.person.fullName} · ${humanize(target.person.role)} · ${fmtDay(target.date)}`
					: ""
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={close}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!target || !valid || pending}
						onClick={() =>
							target &&
							times &&
							run(
								() =>
									addShift({
										userId: target.person.key,
										userName: target.person.fullName,
										role: target.person.role,
										date: target.date,
										starts: times[0],
										ends: times[1],
									}),
								`${target.person.fullName} is on ${times[0]}–${times[1]} on ${fmtDay(target.date)}`,
								close,
							)
						}
					>
						Add shift
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ChoiceCards
					value={kind}
					onChange={setKind}
					columns={2}
					options={[
						...shifts.map((s) => ({
							value: s.name,
							label: s.name,
							hint: `${s.starts} – ${s.ends}${s.ends < s.starts ? " (next morning)" : ""}`,
						})),
						{ value: CUSTOM, label: CUSTOM, hint: "Set the times" },
					]}
				/>
				{kind === CUSTOM && (
					<FieldRow>
						<TextField
							label="Starts"
							type="time"
							value={starts}
							onChange={setStarts}
						/>
						<TextField
							label="Ends"
							type="time"
							value={ends}
							onChange={setEnds}
						/>
					</FieldRow>
				)}
				{kind === CUSTOM && valid && times[1] < times[0] && (
					<Note tone="info">Ends the next morning.</Note>
				)}
				{kind === CUSTOM && times && times[0] === times[1] && (
					<Note tone="warning">
						The shift has to end at a different time than it starts.
					</Note>
				)}
				<WhatHappens
					items={[
						"The shift shows on the rota straight away",
						"They see it under My shifts and clock in against it",
						"Someone on approved leave that day can't be given a shift",
					]}
				/>
			</div>
		</Modal>
	);
}

/** Copies the week before onto the week on show, in one call (finance-service skips anyone already on or away). */
function CopyWeekModal({
	open,
	week,
	shifts,
	staff,
	onClose,
}: {
	open: boolean;
	week: string;
	shifts: ShiftRow[];
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const from = format(addDays(parseISO(week), -7), "yyyy-MM-dd");
	const fromEnd = format(addDays(parseISO(week), -1), "yyyy-MM-dd");
	const toEnd = format(addDays(parseISO(week), 6), "yyyy-MM-dd");
	const source = shifts.filter(
		(s) => s.date >= from && s.date <= fromEnd && s.status !== "CANCELLED",
	);
	const away = staff
		.filter((s) => s.status === "SUSPENDED" || s.status === "PAUSED")
		.map((s) => s.userId ?? s.id);
	const range = (a: string, b: string) =>
		`${format(parseISO(a), "d MMM")} – ${format(parseISO(b), "d MMM")}`;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={CopyIcon}
			title="Copy last week"
			subtitle={`${range(from, fromEnd)} → ${range(week, toEnd)}`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || source.length === 0}
						onClick={() =>
							run(
								() => copyRotaWeek(from, week, away),
								(r) => {
									const left = [
										r.alreadyOnRota && `${r.alreadyOnRota} already on the rota`,
										r.onLeave && `${r.onLeave} on leave`,
										r.past && `${r.past} on days already gone`,
										r.skipped && `${r.skipped} for suspended staff`,
									].filter(Boolean);
									return r.added === 0
										? `Nothing new to copy${left.length ? ` (${left.join(", ")})` : ""}`
										: `${plural(r.added, "shift")} copied${left.length ? `; left out ${left.join(", ")}` : ""}`;
								},
								onClose,
							)
						}
					>
						Copy {plural(source.length, "shift")}
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{source.length === 0 ? (
					<Note tone="info">
						There are no shifts in {range(from, fromEnd)} to copy. Fill this
						week with the + in each day instead.
					</Note>
				) : (
					<p className="text-[13px] text-ink-2">
						Each of the {plural(source.length, "shift")} from last week is added
						on the same weekday this week, with the same person and times.
					</p>
				)}
				<WhatHappens
					items={[
						"Someone who already has a shift that day keeps theirs, so copying twice adds nothing",
						"Days already gone, approved leave and suspended staff are skipped",
						"Change or cancel any copied shift by tapping it",
					]}
				/>
			</div>
		</Modal>
	);
}

export function FindCoverPanel({
	shift,
	staff,
	onClose,
}: {
	shift: ShiftRow | null;
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [chosen, setChosen] = useState("");
	const candidates = shift
		? staff.filter(
				(s) =>
					s.role === shift.role &&
					s.id !== shift.staffId &&
					s.status === "ACTIVE",
			)
		: [];
	return (
		<SidePanel
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={UserCheckIcon}
			title="Find cover"
			subtitle={
				shift
					? `${shift.staffName} · ${fmtDay(shift.date)} · ${shift.starts}–${shift.ends}`
					: ""
			}
			footerInfo="The shift moves to the person you pick and the rota updates straight away"
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={!chosen || pending}
						onClick={() =>
							shift &&
							run(
								() =>
									changeShift(shift.id, {
										...asInput(shift),
										userId: chosen,
										userName: staff.find((s) => s.id === chosen)?.fullName,
									}),
								`${staff.find((s) => s.id === chosen)?.fullName} now covers this shift`,
								() => {
									setChosen("");
									onClose();
								},
							)
						}
					>
						Give the shift
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{candidates.length === 0 ? (
					<Note>
						Nobody else holds the {shift ? humanize(shift.role) : ""} role here.
						Add staff or ask another branch.
					</Note>
				) : (
					<ChoiceCards
						label={`Who can cover (${humanize(shift?.role ?? "")})`}
						value={chosen}
						onChange={setChosen}
						options={candidates.map((c) => ({
							value: c.id,
							label: c.fullName,
							hint: c.shift !== "—" ? `${c.shift} shift` : humanize(c.role),
						}))}
					/>
				)}
				<WhatHappens
					items={[
						"The shift moves to them for that day",
						"They see it under My shifts",
					]}
				/>
			</div>
		</SidePanel>
	);
}

export function SwapShiftModal({
	shift,
	shifts,
	staff,
	onClose,
}: {
	shift: ShiftRow | null;
	shifts: ShiftRow[];
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const [withId, setWithId] = useState("");
	const [note, setNote] = useState("");
	const others = shift
		? staff.filter((s) => s.role === shift.role && s.id !== shift.staffId)
		: [];
	return (
		<Modal
			open={!!shift}
			onOpenChange={(o) => !o && onClose()}
			icon={ArrowLeftRightIcon}
			title="Swap shift"
			subtitle={
				shift
					? `${shift.staffName} · ${fmtDay(shift.date)} ${shift.starts}–${shift.ends}`
					: ""
			}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="outline"
						className={btn.dangerSoft}
						disabled={pending}
						onClick={() =>
							shift &&
							run(() => cancelShift(shift.id), "Shift cancelled", onClose)
						}
					>
						Cancel this shift
					</Button>
					<Button
						className={btn.primary}
						disabled={!withId || pending}
						onClick={() => {
							const other = staff.find((o) => o.id === withId);
							if (!shift || !other) return;
							const theirs = shifts.find(
								(x) =>
									x.staffId === withId &&
									x.date === shift.date &&
									x.status !== "CANCELLED",
							);
							run(
								() =>
									swapShifts(
										{ id: shift.id, ...asInput(shift) },
										theirs ? { id: theirs.id, ...asInput(theirs) } : null,
										{ userId: other.id, userName: other.fullName },
									),
								`Shift swapped with ${other.fullName}`,
								() => {
									setWithId("");
									onClose();
								},
							);
						}}
					>
						Swap
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Swap with"
					value={withId}
					onChange={setWithId}
					options={others.map((o) => ({
						value: o.id,
						label: o.fullName,
						hint: o.shift !== "—" ? `${o.shift} shift` : humanize(o.role),
					}))}
					placeholder="Choose a colleague"
				/>
				<TextareaField
					label="Note (optional)"
					value={note}
					onChange={setNote}
					placeholder="Why the swap"
				/>
			</div>
		</Modal>
	);
}

/** Each gap goes to the person of that role with the fewest shifts on the rota. */
function bestCover(gap: ShiftRow, staff: StaffRow[], shifts: ShiftRow[]) {
	const load = (id: string) =>
		shifts.filter((s) => s.staffId === id && s.status !== "CANCELLED").length;
	const busy = (id: string) =>
		shifts.some(
			(s) =>
				s.staffId === id && s.date === gap.date && s.status !== "CANCELLED",
		);
	return staff
		.filter(
			(p) =>
				p.role === gap.role &&
				p.id !== gap.staffId &&
				p.status === "ACTIVE" &&
				!busy(p.id),
		)
		.sort((a, b) => load(a.id) - load(b.id))[0];
}

export function AutoFillModal({
	open,
	shifts,
	staff,
	onClose,
}: {
	open: boolean;
	shifts: ShiftRow[];
	staff: StaffRow[];
	onClose: () => void;
}) {
	const { run, pending } = useAction();
	const gaps = shifts.filter((s) => s.status === "ABSENT" && s.date >= today());
	const matches = gaps.map((g) => ({
		gap: g,
		cover: bestCover(g, staff, shifts),
	}));
	const fillable = matches.filter((m) => m.cover);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			icon={SparklesIcon}
			title="Auto-fill gaps"
			subtitle={`${plural(gaps.length, "uncovered shift")} this week`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={onClose}>
						Cancel
					</Button>
					<Button
						className={btn.primary}
						disabled={pending || fillable.length === 0}
						onClick={() =>
							run(
								async () => {
									for (const m of fillable) {
										const r = await changeShift(m.gap.id, {
											...asInput(m.gap),
											userId: m.cover?.id ?? "",
											userName: m.cover?.fullName,
										});
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								`${plural(fillable.length, "shift")} handed to cover`,
								onClose,
							)
						}
					>
						Hand over
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-3">
				{gaps.length === 0 ? (
					<Note tone="success">Every shift this week is covered.</Note>
				) : (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{matches.map(({ gap: g, cover }) => (
							<li
								key={g.id}
								className="flex items-center gap-3 px-3 py-[10px] text-[13px]"
							>
								<span className="w-24 font-medium text-ink">
									{fmtDay(g.date)}
								</span>
								<span className="flex-1 text-ink-2">
									{g.staffName} · {g.starts}–{g.ends}
								</span>
								<span className="text-xs text-ink-3">
									{cover
										? `→ ${cover.fullName}`
										: `→ nobody free in ${humanize(g.role)}`}
								</span>
							</li>
						))}
					</ul>
				)}
				<WhatHappens
					items={[
						"Each gap goes to the person with the fewest shifts in that role",
						"Nobody is given two shifts on one day",
						"You see the new name on the rota straight away",
					]}
				/>
			</div>
		</Modal>
	);
}
