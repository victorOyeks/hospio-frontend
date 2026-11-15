"use client";

import { CheckIcon, MoonIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import {
	BUILT_IN_SHIFTS,
	type DepartmentDef,
	departmentLabel,
	parseDepartment,
	parseShift,
	ROLE_OPTIONS,
	type ShiftPreset,
	shiftLabel,
} from "@hospio/api/data/rota-setup";
import { Field } from "@hospio/ui/shared/field";
import { input as inputCls } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Hotel setup → Staff & shifts: the Shifts and Departments lists as small forms instead of free text. The lists are
 * still stored as labels ("Early 07:00–15:00", "Food & drink: Kitchen, Bar"), so the rota reads them as before
 * (data/rota-setup). Nothing goes in until it is complete and doesn't clash with what is there.
 */

const addBtn =
	"inline-flex h-[42px] items-center gap-1 rounded-control bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40";

function Row({
	title,
	detail,
	night,
	broken,
	onRemove,
	disabled,
}: {
	title: string;
	detail: string;
	night?: boolean;
	broken?: boolean;
	onRemove: () => void;
	disabled: boolean;
}) {
	return (
		<li
			className={cn(
				"flex items-center gap-3 px-3 py-[10px] text-[13px]",
				broken && "bg-warning-soft/50",
			)}
		>
			<span className="font-semibold text-ink">{title}</span>
			<span className="flex-1 text-ink-2">
				{detail}
				{night && (
					<span className="ml-2 inline-flex items-center gap-1 text-xs text-ink-3">
						<MoonIcon className="size-3" /> ends the next morning
					</span>
				)}
			</span>
			{!disabled && (
				<button
					type="button"
					aria-label={`Remove ${title}`}
					onClick={onRemove}
					className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
				>
					<XIcon className="size-4" />
				</button>
			)}
		</li>
	);
}

// ---- shifts --------------------------------------------------------------------------------------

export function ShiftListEditor({
	label,
	hint,
	items,
	onChange,
	disabled,
	className,
}: {
	label: string;
	hint?: string;
	items: string[];
	onChange: (v: string[]) => void;
	disabled: boolean;
	className?: string;
}) {
	const [name, setName] = useState("");
	const [starts, setStarts] = useState("");
	const [ends, setEnds] = useState("");
	const shifts = items.map((label) => ({ label, shift: parseShift(label) }));
	const clash = shifts.some(
		(s) => s.shift?.name.toLowerCase() === name.trim().toLowerCase(),
	);
	const sameTime = !!starts && starts === ends;
	const problem = clash
		? `There is already a shift called ${name.trim()}`
		: sameTime
			? "The shift has to end at a different time than it starts"
			: "";
	const ready = !!name.trim() && !!starts && !!ends && !problem;
	const add = (s: ShiftPreset) => {
		// Kept in start-time order, which is the order the rota offers them in.
		onChange(
			[...items, shiftLabel(s)].sort((a, b) =>
				(parseShift(a)?.starts ?? "99").localeCompare(
					parseShift(b)?.starts ?? "99",
				),
			),
		);
		setName("");
		setStarts("");
		setEnds("");
	};
	const sorted = [...shifts].sort((a, b) =>
		(a.shift?.starts ?? "99").localeCompare(b.shift?.starts ?? "99"),
	);
	return (
		<Field label={label} hint={hint} className={className}>
			<div className="flex flex-col gap-3 rounded-control border border-line p-3">
				{items.length === 0 ? (
					<p className="text-[13px] text-ink-3">
						No shifts of your own yet: the rota offers Morning 6am–2pm,
						Afternoon 2pm–10pm and Night 10pm–6am.
						{!disabled && (
							<>
								{" "}
								<button
									type="button"
									className="font-semibold text-brand hover:underline"
									onClick={() => onChange(BUILT_IN_SHIFTS.map(shiftLabel))}
								>
									Start from these three
								</button>{" "}
								and change the times.
							</>
						)}
					</p>
				) : (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{sorted.map(({ label: l, shift }) => (
							<Row
								key={l}
								title={shift?.name ?? l}
								detail={
									shift
										? `${shift.starts} – ${shift.ends}`
										: "Can't be read: remove it and add it again"
								}
								night={!!shift && shift.ends < shift.starts}
								broken={!shift}
								disabled={disabled}
								onRemove={() => onChange(items.filter((x) => x !== l))}
							/>
						))}
					</ul>
				)}
				{!disabled && (
					<div className="flex flex-col gap-1">
						<div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_130px_130px_auto]">
							<label className="flex flex-col gap-1 text-xs font-medium text-ink-2">
								Shift name
								<input
									className={inputCls}
									value={name}
									maxLength={40}
									onChange={(e) =>
										setName(e.target.value.replace(/[:()]/g, ""))
									}
									placeholder="e.g. Early"
								/>
							</label>
							<label className="flex flex-col gap-1 text-xs font-medium text-ink-2">
								Starts
								<input
									type="time"
									className={inputCls}
									value={starts}
									onChange={(e) => setStarts(e.target.value)}
								/>
							</label>
							<label className="flex flex-col gap-1 text-xs font-medium text-ink-2">
								Ends
								<input
									type="time"
									className={inputCls}
									value={ends}
									onChange={(e) => setEnds(e.target.value)}
								/>
							</label>
							<button
								type="button"
								className={addBtn}
								disabled={!ready}
								onClick={() => add({ name: name.trim(), starts, ends })}
							>
								<PlusIcon className="size-4" /> Add shift
							</button>
						</div>
						{problem ? (
							<p className="text-xs text-danger">{problem}</p>
						) : starts && ends && ends < starts ? (
							<p className="text-xs text-ink-3">
								Ends the next morning (a night shift).
							</p>
						) : name.trim() && (!starts || !ends) ? (
							<p className="text-xs text-ink-3">
								Pick when it starts and ends.
							</p>
						) : null}
					</div>
				)}
			</div>
		</Field>
	);
}

// ---- departments ----------------------------------------------------------------------------------

export function DepartmentListEditor({
	label,
	hint,
	items,
	onChange,
	disabled,
	className,
}: {
	label: string;
	hint?: string;
	items: string[];
	onChange: (v: string[]) => void;
	disabled: boolean;
	className?: string;
}) {
	const [name, setName] = useState("");
	const [roles, setRoles] = useState<string[]>([]);
	const depts = items.map((label) => ({ label, dept: parseDepartment(label) }));
	const holder = (role: string) =>
		depts.find((d) => d.dept?.roles.includes(role))?.dept?.name;
	const clash = depts.some(
		(d) => d.dept?.name.toLowerCase() === name.trim().toLowerCase(),
	);
	const ready = !!name.trim() && roles.length > 0 && !clash;
	const toggle = (role: string) =>
		setRoles((r) =>
			r.includes(role) ? r.filter((x) => x !== role) : [...r, role],
		);
	const add = () => {
		const d: DepartmentDef = {
			name: name.trim(),
			roles: ROLE_OPTIONS.map((o) => o.role).filter((r) => roles.includes(r)),
		};
		onChange([...items, departmentLabel(d)]);
		setName("");
		setRoles([]);
	};
	const move = (i: number, by: number) => {
		const next = [...items];
		const [x] = next.splice(i, 1);
		next.splice(i + by, 0, x);
		onChange(next);
	};
	const free = ROLE_OPTIONS.filter((o) => !holder(o.role));
	return (
		<Field label={label} hint={hint} className={className}>
			<div className="flex flex-col gap-3 rounded-control border border-line p-3">
				{items.length === 0 ? (
					<p className="text-[13px] text-ink-3">
						No departments of your own yet: the rota has one heading per role
						(Front office, Housekeeping, Kitchen…). Add one to group roles
						together, e.g. "Food & drink" for Kitchen and Bar.
					</p>
				) : (
					<ul className="divide-y divide-line rounded-xl border border-line">
						{depts.map(({ label: l, dept }, i) => (
							<li
								key={l}
								className={cn(
									"flex items-center gap-3 px-3 py-[10px] text-[13px]",
									!dept && "bg-warning-soft/50",
								)}
							>
								<span className="w-5 text-xs text-ink-3">{i + 1}</span>
								<span className="font-semibold text-ink">
									{dept?.name ?? l}
								</span>
								<span className="flex flex-1 flex-wrap gap-1">
									{dept ? (
										dept.roles.map((r) => (
											<span
												key={r}
												className="rounded-pill bg-subtle px-2 py-[2px] text-xs text-ink-2"
											>
												{ROLE_OPTIONS.find((o) => o.role === r)?.label ?? r}
											</span>
										))
									) : (
										<span className="text-ink-2">
											Can't be read: remove it and add it again
										</span>
									)}
								</span>
								{!disabled && (
									<span className="flex items-center gap-1">
										<button
											type="button"
											aria-label={`Move ${dept?.name ?? l} up`}
											disabled={i === 0}
											onClick={() => move(i, -1)}
											className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30"
										>
											↑
										</button>
										<button
											type="button"
											aria-label={`Move ${dept?.name ?? l} down`}
											disabled={i === items.length - 1}
											onClick={() => move(i, 1)}
											className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-subtle disabled:opacity-30"
										>
											↓
										</button>
										<button
											type="button"
											aria-label={`Remove ${dept?.name ?? l}`}
											onClick={() => onChange(items.filter((_, j) => j !== i))}
											className="flex size-7 items-center justify-center rounded-md text-ink-3 hover:bg-danger-soft hover:text-danger"
										>
											<XIcon className="size-4" />
										</button>
									</span>
								)}
							</li>
						))}
					</ul>
				)}
				{!disabled && (
					<div className="flex flex-col gap-2">
						<div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto]">
							<label className="flex flex-col gap-1 text-xs font-medium text-ink-2">
								Department name
								<input
									className={inputCls}
									value={name}
									maxLength={40}
									onChange={(e) => setName(e.target.value.replace(/:/g, ""))}
									placeholder="e.g. Food & drink"
								/>
							</label>
							<button
								type="button"
								className={addBtn}
								disabled={!ready}
								onClick={add}
							>
								<PlusIcon className="size-4" /> Add department
							</button>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-xs font-medium text-ink-2">
								Roles in it
							</span>
							<div className="flex flex-wrap gap-2">
								{ROLE_OPTIONS.map((o) => {
									const taken = holder(o.role);
									const on = roles.includes(o.role);
									return (
										<button
											key={o.role}
											type="button"
											disabled={!!taken}
											title={taken ? `Already in ${taken}` : undefined}
											aria-pressed={on}
											onClick={() => toggle(o.role)}
											className={cn(
												"inline-flex items-center gap-1 rounded-pill border px-3 py-[6px] text-xs font-medium",
												on
													? "border-brand bg-brand-soft text-brand"
													: "border-line bg-card text-ink-2 hover:bg-subtle",
												taken && "cursor-not-allowed opacity-40",
											)}
										>
											{on && <CheckIcon className="size-3" />}
											{o.label}
											{taken && (
												<span className="text-[10px]">· in {taken}</span>
											)}
										</button>
									);
								})}
							</div>
						</div>
						{clash ? (
							<p className="text-xs text-danger">
								There is already a department called {name.trim()}
							</p>
						) : free.length === 0 ? (
							<p className="text-xs text-ink-3">
								Every role is in a department. Remove one to regroup.
							</p>
						) : name.trim() && roles.length === 0 ? (
							<p className="text-xs text-ink-3">
								Pick at least one role for {name.trim()}.
							</p>
						) : null}
					</div>
				)}
			</div>
		</Field>
	);
}
