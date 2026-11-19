"use client";

import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { ChevronRightIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import type {
	AdminActivityRow,
	AdminChangeRow,
} from "@hospio/api/data/admin-types";
import { fmtAgo, fmtTime, fmtWhen } from "@hospio/ui/shared/format";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/*
 * Changes by Hospio360 as a compact log (owner, 19 Nov 2026: "a lot of white space"). The old DataTable put the
 * one-line (nowrap) Change cell in an auto-layout table: it took ~1190 px, squeezed Reason / By / When / Undo to
 * ~100 px each (their text wrapped into 160 px tall rows) and pushed them off the right edge. Here every column
 * has a share of a CSS grid and truncates, a row is two lines (~60 px), a click opens the details under it, and
 * rows are grouped by day. Under ~920 px of width (1024 px screens with the sidebar, phones) each row becomes a
 * two-line card: the container query, not the screen width, decides, so the log also fits half-width cards.
 */

/** Rendered after mounting: relative times and day groups depend on the browser's clock and time zone. */
function useNow() {
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => {
		setNow(Date.now());
		const t = setInterval(() => setNow(Date.now()), 60_000);
		return () => clearInterval(t);
	}, []);
	return now;
}

/** "Hospio360 · Tobi Lawal" → name "Tobi Lawal", team "Hospio360". */
export function splitActor(by: string) {
	const i = by.lastIndexOf(" · ");
	return i < 0
		? { name: by, team: "" }
		: { name: by.slice(i + 3), team: by.slice(0, i) };
}

const exact = (at: string) => format(new Date(at), "EEE d MMM yyyy, h:mm:ss aaa");

function dayLabel(at: string) {
	const d = new Date(at);
	if (isToday(d)) return "Today";
	if (isYesterday(d)) return "Yesterday";
	return format(d, "EEEE d MMMM");
}

/** Rows (newest first) split into day groups; one unlabeled group before mounting. */
function byDay<T extends { at: string }>(rows: T[], now: number | null) {
	if (now === null) return [{ key: "all", label: "", rows }];
	const groups: { key: string; label: string; rows: T[] }[] = [];
	for (const r of rows) {
		const key = String(startOfDay(new Date(r.at)).getTime());
		const g = groups.find((x) => x.key === key);
		if (g) g.rows.push(r);
		else groups.push({ key, label: dayLabel(r.at), rows: [r] });
	}
	return groups;
}

/** "chargesStartOn" → "Charges start on". */
function fieldLabel(k: string) {
	const s = k
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/_/g, " ")
		.toLowerCase();
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function fieldValue(v: unknown): string {
	if (v === null || v === undefined || v === "") return "not set";
	if (typeof v === "boolean") return v ? "yes" : "no";
	if (typeof v === "string") {
		if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtWhen(v);
		if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return format(new Date(`${v}T12:00:00`), "d MMM yyyy");
		return v;
	}
	if (typeof v === "number") return String(v);
	return JSON.stringify(v);
}

function parseObject(json?: string): Record<string, unknown> | null {
	if (!json) return null;
	try {
		const v = JSON.parse(json);
		return v && typeof v === "object" && !Array.isArray(v) ? v : null;
	} catch {
		return null;
	}
}

/** The event's own fields, without the ids and actor the row already shows. */
const HIDDEN = new Set(["eventId", "actorName", "occurredAt", "undoUntil"]);
export function payloadFields(json?: string) {
	const o = parseObject(json);
	if (!o) return [];
	return Object.entries(o)
		.filter(([k, v]) => !HIDDEN.has(k) && !/Id$/.test(k) && k !== "id" && v !== null && v !== "")
		.map(([k, v]) => ({ label: fieldLabel(k), value: fieldValue(v) }));
}

function Chevron({ open }: { open: boolean }) {
	return (
		<ChevronRightIcon
			aria-hidden
			className={cn(
				"size-4 shrink-0 text-ink-3 transition-transform",
				open && "rotate-90",
			)}
		/>
	);
}

/** Name over team, or one line in cards. */
function Actor({ by }: { by: string }) {
	const a = splitActor(by);
	return (
		<div className="min-w-0">
			<p className="truncate text-[13px] text-ink">{a.name}</p>
			{a.team && <p className="truncate text-xs text-ink-3">{a.team}</p>}
		</div>
	);
}

function When({ at, now }: { at: string; now: number | null }) {
	return (
		<div className="min-w-0" title={exact(at)}>
			<p className="truncate text-[13px] text-ink">
				{now === null ? fmtWhen(at) : fmtAgo(at)}
			</p>
			{now !== null && (
				<p className="truncate text-xs text-ink-3">{fmtTime(at)}</p>
			)}
		</div>
	);
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="min-w-0">
			<dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
				{label}
			</dt>
			<dd className="mt-0.5 break-words text-[13px] text-ink">{children}</dd>
		</div>
	);
}

/** The table frame: header (wide only), day groups, footer with the pager. */
function Frame({
	header,
	groups,
	footer,
	empty,
}: {
	header: ReactNode;
	groups: { key: string; label: string; count: number; body: ReactNode }[];
	footer?: ReactNode;
	empty: ReactNode;
}) {
	return (
		<div className="@container flex flex-col overflow-hidden rounded-card border border-line bg-card">
			{groups.length === 0 ? (
				<div className="p-4">{empty}</div>
			) : (
				<>
					{header}
					{groups.map((g) => (
						<Fragment key={g.key}>
							{g.label && (
								<h3 className="flex items-center gap-2 border-b border-line bg-[#fafafa] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									{g.label}
									<span className="font-medium normal-case tracking-normal">
										· {g.count}
									</span>
								</h3>
							)}
							<ul className="divide-y divide-line border-b border-line">
								{g.body}
							</ul>
						</Fragment>
					))}
				</>
			)}
			{footer && (
				<div className="flex items-center gap-3 px-4 py-[10px] text-xs text-ink-3">
					{footer}
				</div>
			)}
		</div>
	);
}

const headCls =
	"text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3 truncate";

// ---- Changes in businesses -------------------------------------------------------------------------

const changeCols =
	"@min-[920px]:grid-cols-[minmax(0,2.7fr)_minmax(0,0.95fr)_minmax(0,0.85fr)_minmax(0,1.6fr)]";
const changeOuter = "grid-cols-[minmax(0,1fr)_auto] @min-[920px]:grid-cols-[minmax(0,1fr)_196px]";

type UndoState = "undone" | "requested" | "open" | "closed";
function undoState(c: AdminChangeRow, now: number): UndoState {
	if (c.undone) return "undone";
	const open = new Date(c.undoUntil).getTime() > now;
	if (!open) return "closed";
	return c.undoRequestedAt ? "requested" : "open";
}

function ChangeStatus({
	c,
	now,
	canUndo,
	onUndo,
}: {
	c: AdminChangeRow;
	now: number;
	canUndo: boolean;
	onUndo: (c: AdminChangeRow) => void;
}) {
	const st = undoState(c, now);
	const until = format(new Date(c.undoUntil), "d MMM");
	if (st === "undone")
		return (
			<span title={c.undoneAt ? `Undone ${exact(c.undoneAt)}` : undefined}>
				<StatusPill tone="grey" dot={false}>
					Undone
				</StatusPill>
			</span>
		);
	if (st === "closed")
		return (
			<span
				className="text-[13px] text-ink-3"
				title={`Undo window closed ${exact(c.undoUntil)}`}
			>
				—
			</span>
		);
	return (
		<div className="flex min-w-0 items-center justify-end gap-2 @min-[920px]:justify-between">
			{st === "requested" ? (
				<span
					className="hidden @min-[920px]:inline"
					title={`Asked ${c.undoRequestedAt ? exact(c.undoRequestedAt) : ""}${c.undoRequestedBy ? ` by ${c.undoRequestedBy}` : ""}`}
				>
					<StatusPill tone="info" dot={false}>
						Owner asked to undo
					</StatusPill>
				</span>
			) : (
				<span
					className="hidden text-xs leading-tight text-ink-3 @min-[920px]:block"
					title={exact(c.undoUntil)}
				>
					Can undo until
					<br />
					<span className="font-semibold text-ink-2">{until}</span>
				</span>
			)}
			{canUndo ? (
				<button
					type="button"
					onClick={() => onUndo(c)}
					title={`Can undo until ${exact(c.undoUntil)}`}
					className={cn(
						btn.secondary,
						btn.small,
						"flex shrink-0 items-center gap-1",
					)}
				>
					<Undo2Icon className="size-3" /> Undo
				</button>
			) : (
				<span className="text-xs text-ink-3 @min-[920px]:hidden">
					until {until}
				</span>
			)}
		</div>
	);
}

function BeforeAfter({ c }: { c: AdminChangeRow }) {
	const before = parseObject(c.beforeJson);
	const after = parseObject(c.afterJson);
	if (!before && !after) return null;
	const keys = [
		...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
	];
	if (keys.length === 0) return null;
	return (
		<div className="min-w-0 @min-[920px]:col-span-2">
			<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
				Before → after
			</p>
			<table className="mt-1 w-full table-fixed text-left text-[13px]">
				<tbody>
					{keys.map((k) => (
						<tr key={k} className="align-top">
							<td className="w-[34%] py-0.5 pr-3 text-ink-3">{fieldLabel(k)}</td>
							<td className="py-0.5 pr-3 break-words text-ink-2 line-through decoration-ink-3/60">
								{fieldValue(before?.[k])}
							</td>
							<td className="py-0.5 break-words font-semibold text-ink">
								{fieldValue(after?.[k])}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ChangeDetails({ c, now }: { c: AdminChangeRow; now: number | null }) {
	const st = now === null ? null : undoState(c, now);
	return (
		<dl className="grid gap-x-6 gap-y-3 border-t border-dashed border-line bg-subtle/40 px-4 py-3 pl-10 @min-[920px]:grid-cols-4">
			<div className="@min-[920px]:col-span-2">
				<Detail label="Change">{c.description}</Detail>
			</div>
			<div className="@min-[920px]:col-span-2">
				<Detail label="Reason">{c.reason || "—"}</Detail>
			</div>
			<Detail label="Made by">{c.madeBy}</Detail>
			<Detail label="When">{exact(c.at)}</Detail>
			<BeforeAfter c={c} />
			<Detail label="Business">
				{c.businessId ? (
					<Link
						href={`/dashboard/businesses/${c.businessId}/activity`}
						className="font-semibold text-brand hover:underline"
					>
						{c.businessName}
					</Link>
				) : (
					c.businessName
				)}
				{c.area ? ` · ${c.area}` : ""}
			</Detail>
			<Detail label="Undo">
				{c.undone
					? `Undone${c.undoneAt ? ` ${fmtWhen(c.undoneAt)}` : ""}`
					: st === "closed"
						? `Window closed ${fmtWhen(c.undoUntil)}`
						: `Possible until ${fmtWhen(c.undoUntil)}`}
				{c.undoRequestedAt && (
					<span className="block text-xs text-ink-3">
						Owner asked {fmtWhen(c.undoRequestedAt)}
						{c.undoRequestedBy ? ` (${c.undoRequestedBy})` : ""}
					</span>
				)}
			</Detail>
		</dl>
	);
}

function ChangeItem({
	c,
	now,
	canUndo,
	onUndo,
}: {
	c: AdminChangeRow;
	now: number | null;
	canUndo: boolean;
	onUndo: (c: AdminChangeRow) => void;
}) {
	const [open, setOpen] = useState(false);
	const who = splitActor(c.madeBy).name;
	return (
		<li className={cn(open && "bg-subtle/30")}>
			<div className={cn("grid items-center gap-x-3 pr-4 hover:bg-subtle/50", changeOuter)}>
				<button
					type="button"
					aria-expanded={open}
					onClick={() => setOpen((o) => !o)}
					className={cn(
						"grid min-h-[60px] min-w-0 grid-cols-1 items-center gap-x-4 py-2.5 pl-4 text-left outline-none focus-visible:bg-subtle",
						changeCols,
					)}
				>
					<div className="flex min-w-0 items-center gap-2">
						<Chevron open={open} />
						<div className="min-w-0">
							<p className="truncate text-[13px] font-semibold text-ink" title={c.description}>
								{c.description}
							</p>
							<p className="truncate text-xs text-ink-3">
								{c.businessName}
								{c.area ? ` · ${c.area}` : ""}
								<span className="@min-[920px]:hidden">
									{" "}
									· {who} · {now === null ? fmtWhen(c.at) : fmtAgo(c.at)}
								</span>
							</p>
						</div>
					</div>
					<div className="hidden min-w-0 @min-[920px]:block">
						<Actor by={c.madeBy} />
					</div>
					<div className="hidden min-w-0 @min-[920px]:block">
						<When at={c.at} now={now} />
					</div>
					<div className="hidden min-w-0 @min-[920px]:block">
						<p className="line-clamp-2 text-xs leading-snug text-ink-2" title={c.reason}>
							{c.reason || "—"}
						</p>
					</div>
				</button>
				<div className="flex min-w-0 justify-end py-2.5 @min-[920px]:justify-start">
					{now !== null && (
						<ChangeStatus c={c} now={now} canUndo={canUndo} onUndo={onUndo} />
					)}
				</div>
			</div>
			{open && <ChangeDetails c={c} now={now} />}
		</li>
	);
}

export function ChangeLog({
	rows,
	canUndo,
	onUndo,
	footer,
	empty,
}: {
	rows: AdminChangeRow[];
	canUndo: boolean;
	onUndo: (c: AdminChangeRow) => void;
	footer?: ReactNode;
	empty: ReactNode;
}) {
	const now = useNow();
	const groups = rows.length === 0 ? [] : byDay(rows, now);
	return (
		<Frame
			empty={empty}
			footer={footer}
			header={
				<div className={cn("hidden items-center gap-x-3 border-b border-line bg-[#fafafa] pr-4 @min-[920px]:grid", changeOuter)}>
					<div className={cn("grid gap-x-4 py-[10px] pl-4", changeCols)}>
						<span className={cn(headCls, "pl-6")}>Change</span>
						<span className={headCls}>By</span>
						<span className={headCls}>When</span>
						<span className={headCls}>Reason</span>
					</div>
					<span className={headCls}>Status</span>
				</div>
			}
			groups={groups.map((g) => ({
				key: g.key,
				label: g.label,
				count: g.rows.length,
				body: g.rows.map((c) => (
					<ChangeItem key={c.id} c={c} now={now} canUndo={canUndo} onUndo={onUndo} />
				)),
			}))}
		/>
	);
}

// ---- Admin activity --------------------------------------------------------------------------------

const activityCols =
	"@min-[920px]:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1.9fr)]";

/** "AlertsSwitched" / "SUPPORT_ACCESS" → "Alerts switched" / "Support access". */
const eventLabel = (t: string) => (t ? fieldLabel(t) : "Event");

function ActivityItem({
	a,
	now,
	businessName,
}: {
	a: AdminActivityRow;
	now: number | null;
	businessName?: string;
}) {
	const [open, setOpen] = useState(false);
	const fields = payloadFields(a.payload);
	// The Details column skips what the action line already says (a change's area and description).
	const summary = fields
		.filter((f) => !a.action.includes(f.value))
		.map((f) => `${f.label}: ${f.value}`)
		.join(" · ");
	const where = a.businessId ? (businessName ?? "A business") : "Platform";
	return (
		<li className={cn(open && "bg-subtle/30")}>
			<button
				type="button"
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
				className={cn(
					"grid min-h-[60px] w-full min-w-0 grid-cols-1 items-center gap-x-4 px-4 py-2.5 text-left outline-none hover:bg-subtle/50 focus-visible:bg-subtle",
					activityCols,
				)}
			>
				<div className="flex min-w-0 items-center gap-2">
					<Chevron open={open} />
					<div className="min-w-0">
						<p className="truncate text-[13px] font-semibold text-ink" title={a.action}>
							{a.action}
						</p>
						<p className="truncate text-xs text-ink-3">
							{where} · {eventLabel(a.eventType)}
							<span className="@min-[920px]:hidden">
								{" "}
								· {splitActor(a.by).name} · {now === null ? fmtWhen(a.at) : fmtAgo(a.at)}
							</span>
						</p>
					</div>
				</div>
				<div className="hidden min-w-0 @min-[920px]:block">
					<Actor by={a.by} />
				</div>
				<div className="hidden min-w-0 @min-[920px]:block">
					<When at={a.at} now={now} />
				</div>
				<div className="hidden min-w-0 @min-[920px]:block">
					<p className="line-clamp-2 text-xs leading-snug text-ink-2" title={summary}>
						{summary || "—"}
					</p>
				</div>
			</button>
			{open && (
				<dl className="grid gap-x-6 gap-y-3 border-t border-dashed border-line bg-subtle/40 px-4 py-3 pl-10 @min-[920px]:grid-cols-4">
					<Detail label="By">{a.by}</Detail>
					<Detail label="When">{exact(a.at)}</Detail>
					<Detail label="Event">{eventLabel(a.eventType)}</Detail>
					<Detail label="Where">
						{a.businessId ? (
							<Link
								href={`/dashboard/businesses/${a.businessId}/activity`}
								className="font-semibold text-brand hover:underline"
							>
								{where}
							</Link>
						) : (
							where
						)}
					</Detail>
					{fields.map((f) => (
						<Detail key={f.label} label={f.label}>
							{f.value}
						</Detail>
					))}
				</dl>
			)}
		</li>
	);
}

export function ActivityLog({
	rows,
	businessNames,
	footer,
	empty,
}: {
	rows: AdminActivityRow[];
	businessNames: Map<string, string>;
	footer?: ReactNode;
	empty: ReactNode;
}) {
	const now = useNow();
	const groups = rows.length === 0 ? [] : byDay(rows, now);
	return (
		<Frame
			empty={empty}
			footer={footer}
			header={
				<div className={cn("hidden gap-x-4 border-b border-line bg-[#fafafa] px-4 py-[10px] @min-[920px]:grid", activityCols)}>
					<span className={cn(headCls, "pl-6")}>Action</span>
					<span className={headCls}>By</span>
					<span className={headCls}>When</span>
					<span className={headCls}>Details</span>
				</div>
			}
			groups={groups.map((g) => ({
				key: g.key,
				label: g.label,
				count: g.rows.length,
				body: g.rows.map((a) => (
					<ActivityItem
						key={a.id}
						a={a}
						now={now}
						businessName={a.businessId ? businessNames.get(a.businessId) : undefined}
					/>
				)),
			}))}
		/>
	);
}

