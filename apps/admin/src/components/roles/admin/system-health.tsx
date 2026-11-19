"use client";

import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	DatabaseIcon,
	HardDriveIcon,
	InfoIcon,
	Loader2Icon,
	RefreshCwIcon,
	SettingsIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { loadSystemHealth } from "@hospio/api/actions/system-health";
import type {
	SystemHealthData,
	SystemHealthLevel,
	SystemHealthPoint,
	SystemHealthReport,
	SystemHealthService,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtDate } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { type PillTone, StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Platform → System health (hospio-backend docs/system-health.md): is the server running out of anything, and is every Hospio
 * service up? Reads GET /platform/admin/system-health every 30 s while the page is open (paused while the tab is hidden) and on
 * "Refresh now". Read-only; the alert limits are in Settings → System health (Super admin).
 *
 * Compact layout (like the 19 Nov Integrations cards): the banner and five headline tiles first, then the services (problems first),
 * the server's disks and memory, the database, Kafka/Redis/certificates and the 24 h / 7 day trends.
 */

const REFRESH_MS = 30_000;

const TONE: Record<SystemHealthLevel, PillTone> = { OK: "success", WARNING: "warning", PROBLEM: "danger" };
const BAR: Record<SystemHealthLevel, "success" | "warning" | "danger"> = {
	OK: "success",
	WARNING: "warning",
	PROBLEM: "danger",
};

// ---- formatting -------------------------------------------------------------------------------------

export function fmtBytes(b?: number | null): string {
	if (b == null) return "—";
	const units = ["B", "KB", "MB", "GB", "TB"];
	let v = b;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function fmtDuration(seconds?: number | null): string {
	if (seconds == null) return "—";
	const s = Math.max(0, Math.round(seconds));
	const d = Math.floor(s / 86400);
	const h = Math.floor((s % 86400) / 3600);
	const m = Math.floor((s % 3600) / 60);
	if (d > 0) return `${d}d ${h}h`;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m`;
	return `${s}s`;
}

const pct = (part?: number | null, total?: number | null) =>
	part == null || !total ? null : Math.round((part / total) * 1000) / 10;

function LevelIcon({ level, className }: { level: SystemHealthLevel; className?: string }) {
	if (level === "PROBLEM") return <XCircleIcon className={cn("size-4 shrink-0 text-danger", className)} />;
	if (level === "WARNING") return <AlertTriangleIcon className={cn("size-4 shrink-0 text-warning", className)} />;
	return <CheckCircle2Icon className={cn("size-4 shrink-0 text-success", className)} />;
}

// ---- the screen --------------------------------------------------------------------------------------

export function SystemHealthScreen({ initial, superAdmin }: { initial: SystemHealthData; superAdmin: boolean }) {
	const [report, setReport] = useState<SystemHealthReport | null>(initial.ok ? initial.report : null);
	const [error, setError] = useState<string | null>(initial.ok ? null : initial.error);
	const [loading, setLoading] = useState(false);
	// The clock starts at the report's own time so the server's HTML and the browser's first render agree (React #418); the
	// times on the page are formatted in the browser's zone only after mounting.
	const [now, setNow] = useState(() => (initial.ok ? new Date(initial.report.at).getTime() : 0));
	const [mounted, setMounted] = useState(false);
	const busy = useRef(false);
	/** Failed polls in a row: one miss (a deploy restarting the service) isn't shown; two are. */
	const misses = useRef(0);

	const reload = useCallback(async (fresh: boolean) => {
		if (busy.current) return;
		busy.current = true;
		setLoading(true);
		try {
			const r = await loadSystemHealth(fresh);
			if (r.ok) {
				misses.current = 0;
				setReport(r.data);
				setError(null);
			} else {
				misses.current++;
				if (fresh) toast.error(r.error);
				if (fresh || misses.current >= 2) setError(r.error);
			}
		} catch {
			misses.current++;
			if (fresh || misses.current >= 2) setError("System health couldn't be read. Trying again in 30 seconds.");
		} finally {
			busy.current = false;
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const tick = setInterval(() => {
			if (document.visibilityState === "visible") void reload(false);
		}, REFRESH_MS);
		setMounted(true);
		setNow(Date.now());
		const clock = setInterval(() => setNow(Date.now()), 5_000);
		return () => {
			clearInterval(tick);
			clearInterval(clock);
		};
	}, [reload]);

	const age = report ? Math.max(0, Math.round((now - new Date(report.at).getTime()) / 1000)) : null;

	return (
		<>
			<PageHeader
				title="System health"
				subtitle="This server, every Hospio service, the database, Kafka, Redis and certificates · updates every 30 seconds"
			>
				<div className="flex flex-wrap items-center gap-2">
					{age != null && (
						<span className="text-xs text-ink-3">
							Checked {age < 5 ? "just now" : `${fmtDuration(age)} ago`}
						</span>
					)}
					<button
						type="button"
						className={cn(btn.secondary, "flex items-center gap-2")}
						onClick={() => void reload(true)}
						disabled={loading}
						aria-busy={loading}
					>
						{loading ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
						{loading ? "Checking…" : "Refresh now"}
					</button>
				</div>
			</PageHeader>

			{!mounted ? (
				<p className="flex items-center gap-2 py-6 text-sm text-ink-3">
					<Loader2Icon className="size-4 animate-spin" /> Loading…
				</p>
			) : !report ? (
				<EmptyState title="System health couldn't be loaded" hint={error ?? undefined} />
			) : (
				<div className={cn("flex min-w-0 flex-col gap-4", loading && "opacity-90")}>
					{error && (
						<p className="rounded-control bg-warning-soft px-4 py-2 text-xs text-warning">
							{error} The figures below are from {fmtDate(report.at, "h:mm:ssaaa")}.
						</p>
					)}
					<Banner report={report} />
					<Headlines report={report} />
					<Services services={report.services} />
					<div className="grid min-w-0 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
						<ServerCard report={report} />
						<DatabaseCard report={report} />
					</div>
					<div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
						<KafkaCard report={report} />
						<RedisCard report={report} />
						<CertsCard report={report} />
					</div>
					<HistoryCard report={report} />
					<LimitsCard report={report} superAdmin={superAdmin} />
				</div>
			)}
		</>
	);
}

// ---- banner and headline tiles ------------------------------------------------------------------------

function Banner({ report }: { report: SystemHealthReport }) {
	const level = report.overall;
	const title = level === "PROBLEM" ? "Problem" : level === "WARNING" ? "Warning" : "All good";
	const box =
		level === "PROBLEM"
			? "border-danger/30 bg-danger-soft"
			: level === "WARNING"
				? "border-warning/30 bg-warning-soft"
				: "border-success/30 bg-success-soft";
	return (
		<section className={cn("rounded-card border px-5 py-4", box)} aria-live="polite">
			<div className="flex items-start gap-3">
				<LevelIcon level={level} className="mt-[2px] size-5" />
				<div className="min-w-0 flex-1">
					<p className="text-base font-bold text-ink">{title}</p>
					{report.reasons.length === 0 ? (
						<p className="text-[13px] text-ink-2">
							Every service is up and the server has room to spare.
						</p>
					) : (
						<ul className="mt-1 flex flex-col gap-[2px]">
							{report.reasons.map((r) => (
								<li key={`${r.area}-${r.text}`} className="flex items-start gap-2 text-[13px] text-ink">
									<LevelIcon level={r.level} className="mt-[2px] size-[14px]" />
									<span className="min-w-0 break-words">
										<span className="font-semibold">{r.area}:</span> {r.text}
									</span>
								</li>
							))}
						</ul>
					)}
					{report.notes.map((n) => (
						<p key={n} className="mt-2 flex items-start gap-2 text-xs text-ink-2">
							<InfoIcon className="mt-[1px] size-[14px] shrink-0 text-info" /> {n}
						</p>
					))}
				</div>
			</div>
		</section>
	);
}

function Tile({
	label,
	value,
	hint,
	level = "OK",
	bar,
}: {
	label: string;
	value: string;
	hint?: string;
	level?: SystemHealthLevel;
	bar?: number | null;
}) {
	return (
		<div className="flex min-w-0 flex-col gap-1 rounded-card border border-line bg-card px-4 py-3">
			<p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
				<LevelIcon level={level} className="size-3" /> {label}
			</p>
			<p className="truncate text-xl font-bold text-ink">{value}</p>
			{bar != null && <ProgressBar value={bar} max={100} tone={BAR[level]} />}
			{hint && <p className="truncate text-xs text-ink-3">{hint}</p>}
		</div>
	);
}

function mainDisk(report: SystemHealthReport) {
	const mounts = report.server?.mounts ?? [];
	return mounts.find((m) => m.path === "/") ?? mounts[0] ?? null;
}

function Headlines({ report }: { report: SystemHealthReport }) {
	const s = report.server;
	const disk = mainDisk(report);
	const memPct = pct(s?.memUsed, s?.memTotal);
	const swapPct = pct(s?.swapUsed, s?.swapTotal);
	const t = report.thresholds;
	const memLevel: SystemHealthLevel =
		memPct != null && memPct >= 97
			? "PROBLEM"
			: memPct != null && t && memPct >= t.memoryPct && (swapPct == null || swapPct >= t.swapPct)
				? "WARNING"
				: "OK";
	const cores = s?.cores ?? 0;
	const cpuLevel: SystemHealthLevel =
		s?.load5 != null && cores > 0 ? (s.load5 > 2 * cores ? "PROBLEM" : s.load5 > cores ? "WARNING" : "OK") : "OK";
	const up = report.services.filter((x) => x.level !== "PROBLEM").length;
	const db = report.database;
	const conn = pct(db?.connections, db?.maxConnections);
	return (
		<div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
			<Tile
				label="Disk space left"
				value={disk ? `${fmtBytes(disk.free)} free` : "—"}
				hint={disk ? `${Math.round(disk.usedPct)}% used of ${fmtBytes(disk.total)} (${disk.path})` : undefined}
				level={disk?.level ?? "OK"}
				bar={disk?.usedPct}
			/>
			<Tile
				label="Memory"
				value={memPct == null ? "—" : `${Math.round(memPct)}% used`}
				hint={
					s?.memTotal
						? `${fmtBytes(s.memUsed)} of ${fmtBytes(s.memTotal)} · swap ${swapPct == null ? "—" : `${Math.round(swapPct)}%`}`
						: undefined
				}
				level={memLevel}
				bar={memPct}
			/>
			<Tile
				label="CPU"
				value={s?.cpuPct == null ? "—" : `${Math.round(s.cpuPct)}% busy`}
				hint={s?.load5 != null ? `Load ${s.load1} · ${s.load5} · ${s.load15} on ${cores} cores` : undefined}
				level={cpuLevel}
				bar={s?.cpuPct}
			/>
			<Tile
				label="Services up"
				value={`${up} of ${report.services.length}`}
				hint={up === report.services.length ? "All running and healthy" : `${report.services.length - up} down`}
				level={up === report.services.length ? "OK" : "PROBLEM"}
			/>
			<Tile
				label="Database"
				value={db?.up ? fmtBytes(db.hospioBytes) : "Not reachable"}
				hint={db?.up ? `${db.connections ?? "—"} of ${db.maxConnections ?? "—"} connections${conn != null ? ` (${Math.round(conn)}%)` : ""}` : (db?.error ?? undefined)}
				level={db?.level ?? "PROBLEM"}
			/>
		</div>
	);
}

// ---- services -------------------------------------------------------------------------------------------

function stateLabel(s: SystemHealthService): { text: string; tone: PillTone } {
	if (s.state == null) return { text: s.health === "UP" ? "running" : "unknown", tone: s.health === "UP" ? "success" : "grey" };
	switch (s.state) {
		case "active":
			return { text: "running", tone: "success" };
		case "failed":
			return { text: "failed", tone: "danger" };
		case "activating":
			return { text: "restarting", tone: "warning" };
		case "inactive":
			return { text: "stopped", tone: "danger" };
		case "not-found":
			return { text: "not installed", tone: "grey" };
		default:
			return { text: s.state, tone: "warning" };
	}
}

function healthLabel(s: SystemHealthService): { text: string; tone: PillTone } {
	if (s.health === "UP") return { text: "healthy", tone: "success" };
	if (s.health === "DOWN") return { text: "down", tone: "danger" };
	return { text: "unknown", tone: "warning" };
}

function Services({ services }: { services: SystemHealthService[] }) {
	const problems = services.filter((s) => s.level !== "OK").length;
	return (
		<SectionCard
			title="Services"
			subtitle="Each Hospio service and web app on this server · problems first · memory and CPU are the process' own"
			count={problems > 0 ? problems : undefined}
			flush
		>
			{/* lg and up: one table; below: a compact row per service. */}
			<div className="hidden lg:block">
				<table className="w-full table-fixed text-left">
					<thead className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<tr>
							<th className="w-[30%] px-4 py-2">Service</th>
							<th className="px-2 py-2">Status</th>
							<th className="px-2 py-2">Health</th>
							<th className="px-2 py-2">Version</th>
							<th className="px-2 py-2">Up for</th>
							<th className="px-2 py-2 text-right">Restarts</th>
							<th className="px-2 py-2 text-right">Memory</th>
							<th className="px-4 py-2 text-right">CPU</th>
						</tr>
					</thead>
					<tbody>
						{services.map((s) => {
							const st = stateLabel(s);
							const h = healthLabel(s);
							return (
								<tr
									key={s.key}
									className={cn(
										"border-b border-line text-[13px] last:border-b-0",
										s.level === "PROBLEM" && "bg-danger-soft/50",
										s.level === "WARNING" && "bg-warning-soft/50",
									)}
								>
									<td className="px-4 py-2">
										<p className="truncate font-semibold text-ink" title={s.unit ?? undefined}>
											{s.key}
											{s.kind === "WEB" && <span className="ml-1 text-[11px] font-normal text-ink-3">web app</span>}
										</p>
										<p className="truncate text-xs text-ink-3" title={s.healthDetail ?? undefined}>
											{s.level === "OK" ? s.name : s.healthDetail}
										</p>
									</td>
									<td className="px-2 py-2">
										<StatusPill tone={st.tone}>{st.text}</StatusPill>
									</td>
									<td className="px-2 py-2">
										<StatusPill tone={h.tone}>{h.text}</StatusPill>
									</td>
									<td className="px-2 py-2 font-mono text-xs text-ink-2" title={s.deployedAt ? `Deployed ${fmtDate(s.deployedAt, "d MMM, h:mmaaa")}` : undefined}>
										{s.commit ?? "—"}
									</td>
									<td className="px-2 py-2 text-ink-2" title={s.startedAt ? `Started ${fmtDate(s.startedAt, "d MMM, h:mmaaa")}` : undefined}>
										{fmtDuration(s.uptimeSeconds)}
									</td>
									<td className={cn("px-2 py-2 text-right", (s.restarts ?? 0) > 0 ? "font-semibold text-warning" : "text-ink-2")}>
										{s.restarts ?? "—"}
									</td>
									<td className="px-2 py-2 text-right text-ink-2">{fmtBytes(s.memoryBytes)}</td>
									<td className="px-4 py-2 text-right text-ink-2">{s.cpuPct == null ? "—" : `${s.cpuPct}%`}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<ul className="lg:hidden">
				{services.map((s) => {
					const st = stateLabel(s);
					const h = healthLabel(s);
					return (
						<li
							key={s.key}
							className={cn(
								"flex flex-col gap-1 border-t border-line px-5 py-2",
								s.level === "PROBLEM" && "bg-danger-soft/50",
								s.level === "WARNING" && "bg-warning-soft/50",
							)}
						>
							<div className="flex min-w-0 items-center gap-2">
								<LevelIcon level={s.level} />
								<p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{s.key}</p>
								<StatusPill tone={st.tone}>{st.text}</StatusPill>
								<StatusPill tone={h.tone}>{h.text}</StatusPill>
							</div>
							<p className="truncate pl-6 text-xs text-ink-3">
								{s.level === "OK" ? s.name : s.healthDetail} · up {fmtDuration(s.uptimeSeconds)} · {fmtBytes(s.memoryBytes)}
								{s.cpuPct != null ? ` · CPU ${s.cpuPct}%` : ""} · {s.restarts ?? 0} restarts
								{s.commit ? ` · ${s.commit}` : ""}
							</p>
						</li>
					);
				})}
			</ul>
		</SectionCard>
	);
}

// ---- server ---------------------------------------------------------------------------------------------

function Meter({ label, used, total, level, right }: { label: string; used: number; total: number; level: SystemHealthLevel; right: string }) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<div className="flex items-baseline justify-between gap-2 text-[13px]">
				<span className="min-w-0 truncate font-semibold text-ink">{label}</span>
				<span className="shrink-0 text-xs text-ink-2">{right}</span>
			</div>
			<ProgressBar value={used} max={total} tone={BAR[level]} />
		</div>
	);
}

function Facts({ rows }: { rows: [string, string | number | null | undefined][] }) {
	return (
		<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px]">
			{rows.map(([k, v]) => (
				<div key={k} className="contents">
					<dt className="text-ink-3">{k}</dt>
					<dd className="min-w-0 truncate text-ink">{v ?? "—"}</dd>
				</div>
			))}
		</dl>
	);
}

function ServerCard({ report }: { report: SystemHealthReport }) {
	const s = report.server;
	if (!s) {
		return (
			<SectionCard title="Server" subtitle="CPU, memory and disks">
				<EmptyState title="The server's figures couldn't be read" />
			</SectionCard>
		);
	}
	const memPct = pct(s.memUsed, s.memTotal);
	const swapPct = pct(s.swapUsed, s.swapTotal);
	const t = report.thresholds;
	return (
		<SectionCard
			title="Server"
			subtitle={`${s.hostname ?? "This server"} · ${s.os ?? ""}`}
			className="min-w-0"
			bodyClassName="gap-4 pt-1"
		>
			<div className="flex flex-col gap-3">
				<p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
					<HardDriveIcon className="size-3" /> Disks · amber from 80% used, red from 90%
				</p>
				{s.mounts.map((m) => (
					<div key={m.path} className="flex min-w-0 flex-col gap-1">
						<div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]">
							<span className="font-semibold text-ink">
								{m.path} <span className="font-normal text-ink-3">({m.device})</span>
							</span>
							<span className={cn("font-bold", m.level === "PROBLEM" ? "text-danger" : m.level === "WARNING" ? "text-warning" : "text-ink")}>
								{fmtBytes(m.free)} free · {Math.round(m.usedPct)}% used
							</span>
						</div>
						<ProgressBar value={m.usedPct} max={100} tone={BAR[m.level]} className="h-[10px]" />
						<p className="text-xs text-ink-3">
							{fmtBytes(m.used)} used of {fmtBytes(m.total)}
						</p>
					</div>
				))}
				{report.history?.diskFullInDays != null && (
					<p className="text-xs text-ink-2">
						At the current rate ({fmtBytes(report.history.diskGrowthPerDay)} a day) the main disk would be full in about{" "}
						<span className="font-semibold text-ink">{Math.round(report.history.diskFullInDays)} days</span>.
					</p>
				)}
			</div>
			<div className="flex flex-col gap-3">
				<Meter
					label="Memory"
					used={s.memUsed ?? 0}
					total={s.memTotal ?? 0}
					level={memPct != null && t && memPct >= t.memoryPct ? "WARNING" : "OK"}
					right={`${fmtBytes(s.memUsed)} of ${fmtBytes(s.memTotal)} (${memPct ?? "—"}%) · ${fmtBytes(s.memAvailable)} available`}
				/>
				<Meter
					label="Swap"
					used={s.swapUsed ?? 0}
					total={s.swapTotal ?? 0}
					level={swapPct != null && t && swapPct >= t.swapPct ? "WARNING" : "OK"}
					right={`${fmtBytes(s.swapUsed)} of ${fmtBytes(s.swapTotal)} (${swapPct ?? "—"}%)`}
				/>
				{s.hospioMemory != null && s.memUsed != null && (
					<p className="text-xs text-ink-3">
						Hospio's services use {fmtBytes(s.hospioMemory)} of the {fmtBytes(s.memUsed)} in use; the rest is the database, Kafka and other apps
						on this server.
					</p>
				)}
			</div>
			<Facts
				rows={[
					["CPU now", s.cpuPct == null ? null : `${s.cpuPct}% busy (${s.cores ?? "—"} cores)`],
					["Load 1 / 5 / 15 min", s.load1 == null ? null : `${s.load1} / ${s.load5} / ${s.load15}`],
					["Waiting for memory", s.memoryStallPct == null ? null : `${s.memoryStallPct}% of the last minute`],
					["Up for", fmtDuration(s.uptimeSeconds)],
					["Kernel", s.kernel],
					["Server time", s.serverTime ? `${fmtDate(s.serverTime, "d MMM yyyy, h:mm:ssaaa")} (${s.timezone ?? ""})` : null],
				]}
			/>
			{s.largest.length > 0 && (
				<div className="flex flex-col gap-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						What uses the disk
						<span className="font-normal normal-case tracking-normal">
							{s.largestMeasuredAt ? ` · measured ${fmtDate(s.largestMeasuredAt, "h:mmaaa")}, every 15 minutes` : " · being measured"}
						</span>
					</p>
					{[
						...s.largest,
						...(report.database?.totalBytes != null
							? [{ label: "Databases (all on this server)", path: "PostgreSQL", bytes: report.database.totalBytes, note: null }]
							: []),
						...(report.kafka?.logBytes != null
							? [{ label: "Kafka event logs", path: "Docker volume", bytes: report.kafka.logBytes, note: null }]
							: []),
					].map((d) => (
						<div key={d.label} className="flex items-baseline justify-between gap-3 text-[13px]">
							<span className="min-w-0 truncate text-ink" title={d.note ?? d.path ?? undefined}>
								{d.label} <span className="text-xs text-ink-3">{d.path}</span>
							</span>
							<span className="shrink-0 text-ink-2">{d.bytes == null ? (d.note ?? "—") : fmtBytes(d.bytes)}</span>
						</div>
					))}
				</div>
			)}
			{report.otherApps.length > 0 && (
				<div className="flex flex-col gap-1">
					<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Also running on this server</p>
					<p className="text-xs text-ink-2">
						{report.otherApps
							.slice(0, 8)
							.map((o) => `${o.unit} ${fmtBytes(o.memoryBytes)}`)
							.join(" · ")}
					</p>
				</div>
			)}
		</SectionCard>
	);
}

// ---- database -------------------------------------------------------------------------------------------

function DatabaseCard({ report }: { report: SystemHealthReport }) {
	const d = report.database;
	if (!d) return null;
	const conn = pct(d.connections, d.maxConnections);
	const t = report.thresholds;
	const maxSchema = Math.max(1, ...d.schemas.map((x) => x.bytes));
	return (
		<SectionCard
			title="Database"
			subtitle={d.up ? `PostgreSQL ${d.version ?? ""}` : "PostgreSQL"}
			className="min-w-0"
			headerRight={<StatusPill tone={TONE[d.level]}>{d.up ? "up" : "not reachable"}</StatusPill>}
			bodyClassName="gap-4 pt-1"
		>
			<div
				className={cn(
					"flex items-start gap-2 rounded-control px-3 py-2 text-[13px]",
					d.backups?.scheduled ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
				)}
			>
				<DatabaseIcon className="mt-[2px] size-4 shrink-0" />
				<span>
					<span className="font-bold">{d.backups?.scheduled ? "Backups" : "No scheduled backup"}</span>
					{d.backups?.scheduled
						? `: ${d.backups.detail ?? ""}`
						: ": nothing copies the database off this server. If the disk fails, bookings, bills and settings are lost."}
				</span>
			</div>
			{!d.up ? (
				<EmptyState title="The database couldn't be read" hint={d.error ?? undefined} />
			) : (
				<>
					<Facts
						rows={[
							["Hospio database", fmtBytes(d.hospioBytes)],
							["All databases", `${fmtBytes(d.totalBytes)} (${d.databases.map((x) => `${x.name} ${fmtBytes(x.bytes)}`).join(", ")})`],
							["Longest running query", d.longestQuerySeconds == null ? "none running" : `${d.longestQuerySeconds} s`],
							["Cache hit ratio", d.cacheHitPct == null ? null : `${d.cacheHitPct}%`],
							[
								"Rows waiting for clean-up",
								d.deadRows == null
									? null
									: `${d.deadRows.toLocaleString()}${d.tablesNeedingVacuum ? ` · ${d.tablesNeedingVacuum} tables need autovacuum` : ""}`,
							],
						]}
					/>
					<Meter
						label="Connections in use"
						used={d.connections ?? 0}
						total={d.maxConnections ?? 0}
						level={conn != null && t && conn >= t.dbConnectionsPct ? "WARNING" : "OK"}
						right={`${d.connections ?? "—"} of ${d.maxConnections ?? "—"} (every app on this server)`}
					/>
					<div className="flex flex-col gap-1">
						<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Size per service</p>
						{d.schemas.slice(0, 14).map((x) => (
							<div key={x.name} className="grid grid-cols-[110px_minmax(0,1fr)_64px] items-center gap-2 text-xs">
								<span className="truncate text-ink">{x.name}</span>
								<ProgressBar value={x.bytes} max={maxSchema} />
								<span className="text-right text-ink-2">{fmtBytes(x.bytes)}</span>
							</div>
						))}
					</div>
					{d.largestTables.length > 0 && (
						<div className="flex flex-col gap-1">
							<p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">Largest tables</p>
							{d.largestTables.map((x) => (
								<div key={`${x.schema}.${x.table}`} className="flex items-baseline justify-between gap-3 text-xs">
									<span className="min-w-0 truncate text-ink">
										{x.schema}.{x.table}
									</span>
									<span className="shrink-0 text-ink-2">
										{fmtBytes(x.bytes)} · {(x.liveRows ?? 0).toLocaleString()} rows
									</span>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</SectionCard>
	);
}

// ---- Kafka, Redis, certificates ------------------------------------------------------------------------

function KafkaCard({ report }: { report: SystemHealthReport }) {
	const k = report.kafka;
	if (!k) return null;
	const waiting = k.groups.filter((g) => g.lag > 0);
	return (
		<SectionCard
			title="Kafka"
			subtitle="Events between the services"
			headerRight={<StatusPill tone={TONE[k.level]}>{k.up ? "up" : "not reachable"}</StatusPill>}
			bodyClassName="gap-3 pt-1"
		>
			{!k.up ? (
				<EmptyState title="Kafka couldn't be reached" hint={k.error ?? undefined} />
			) : (
				<>
					<Facts
						rows={[
							["Brokers", k.brokers],
							["Topics", k.topics],
							["Event logs on disk", fmtBytes(k.logBytes)],
							["Hospio readers", `${k.groups.length} · ${waiting.length === 0 ? "nothing waiting" : `${waiting.length} with messages waiting`}`],
						]}
					/>
					{k.groups.length > 0 && (
						<ul className="flex flex-col">
							{k.groups.map((g) => (
								<li key={g.group} className="flex items-center justify-between gap-2 border-t border-line py-1 text-xs">
									<span className="flex min-w-0 items-center gap-2 text-ink">
										<LevelIcon level={g.level} className="size-3" />
										<span className="truncate">{g.service}</span>
									</span>
									<span className={cn("shrink-0", g.lag > 0 ? "font-semibold text-ink" : "text-ink-3")}>
										{g.lag === 0 ? "up to date" : `${g.lag.toLocaleString()} waiting`}
										{g.trend === "GROWING" && g.lag > 0 ? " · growing" : ""}
										{g.stuckMinutes ? ` · no progress ${g.stuckMinutes} min` : ""}
									</span>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</SectionCard>
	);
}

function RedisCard({ report }: { report: SystemHealthReport }) {
	const r = report.redis;
	if (!r) return null;
	return (
		<SectionCard
			title="Redis"
			subtitle="Short-lived data: sign-in codes, limits"
			headerRight={<StatusPill tone={TONE[r.level]}>{r.up ? "up" : "not reachable"}</StatusPill>}
			bodyClassName="gap-3 pt-1"
		>
			{!r.up ? (
				<EmptyState title="Redis couldn't be reached" hint={r.error ?? undefined} />
			) : (
				<Facts
					rows={[
						["Version", r.version],
						["Memory used", fmtBytes(r.usedBytes)],
						["Highest so far", fmtBytes(r.peakBytes)],
						["Memory limit", r.maxBytes ? fmtBytes(r.maxBytes) : "none set"],
						["Keys", r.keys?.toLocaleString()],
						["Up for", fmtDuration(r.uptimeSeconds)],
					]}
				/>
			)}
		</SectionCard>
	);
}

function CertsCard({ report }: { report: SystemHealthReport }) {
	return (
		<SectionCard title="TLS certificates" subtitle="Days until each address's padlock expires · amber under 21 days" bodyClassName="pt-1">
			{report.certs.length === 0 ? (
				<EmptyState title="No addresses are checked" />
			) : (
				<ul className="flex flex-col">
					{report.certs.map((c) => (
						<li key={c.host} className="flex items-center justify-between gap-2 border-t border-line py-[6px] first:border-t-0">
							<span className="min-w-0">
								<span className="block truncate text-[13px] font-semibold text-ink">{c.host}</span>
								<span className="block truncate text-xs text-ink-3">
									{c.error ?? `${c.issuer ?? ""} · until ${fmtDate(c.expiresAt, "d MMM yyyy")}`}
									{c.checkedAt ? ` · read ${fmtDate(c.checkedAt, "h:mmaaa")}` : ""}
								</span>
							</span>
							<StatusPill tone={TONE[c.level]}>
								{c.daysLeft == null ? "unknown" : c.daysLeft < 0 ? "expired" : `${c.daysLeft} days`}
							</StatusPill>
						</li>
					))}
				</ul>
			)}
		</SectionCard>
	);
}

// ---- history ------------------------------------------------------------------------------------------

/** One measure over time: a 2px brand line on a light area, the latest value as text, hover shows the point. */
function Sparkline({
	label,
	points,
	value,
	format,
	max,
}: {
	label: string;
	points: { at: string; v: number | null | undefined }[];
	value: (v: number) => number;
	format: (v: number) => string;
	max?: number;
}) {
	const [hover, setHover] = useState<number | null>(null);
	const data = points.filter((p): p is { at: string; v: number } => p.v != null);
	const W = 240;
	const H = 48;
	if (data.length < 2) {
		return (
			<div className="flex min-w-0 flex-col gap-1 rounded-control border border-line px-3 py-2">
				<p className="text-xs font-semibold text-ink-2">{label}</p>
				<p className="text-xs text-ink-3">Not enough history yet (a snapshot is kept every 5 minutes)</p>
			</div>
		);
	}
	const vals = data.map((p) => value(p.v));
	const hi = max ?? Math.max(...vals);
	const lo = max != null ? 0 : Math.min(...vals);
	const span = hi - lo || 1;
	const x = (i: number) => (i / (data.length - 1)) * W;
	const y = (v: number) => H - 2 - ((v - lo) / span) * (H - 4);
	const line = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
	const shown = hover ?? data.length - 1;
	return (
		<div className="flex min-w-0 flex-col gap-1 rounded-control border border-line px-3 py-2">
			<div className="flex items-baseline justify-between gap-2">
				<p className="truncate text-xs font-semibold text-ink-2">{label}</p>
				<p className="shrink-0 text-xs text-ink">
					<span className="font-bold">{format(data[shown].v)}</span>{" "}
					<span className="text-ink-3">{hover == null ? "now" : fmtDate(data[shown].at, "EEE h:mmaaa")}</span>
				</p>
			</div>
			<svg
				viewBox={`0 0 ${W} ${H}`}
				preserveAspectRatio="none"
				className="h-12 w-full touch-none"
				role="img"
				aria-label={`${label}: from ${format(data[0].v)} to ${format(data[data.length - 1].v)}`}
				onPointerMove={(e) => {
					const r = e.currentTarget.getBoundingClientRect();
					const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1));
					setHover(Math.max(0, Math.min(data.length - 1, i)));
				}}
				onPointerLeave={() => setHover(null)}
			>
				<path d={`${line}L${W},${H}L0,${H}Z`} className="fill-brand/10" />
				<path d={line} className="fill-none stroke-brand" strokeWidth={2} vectorEffect="non-scaling-stroke" />
				{hover != null && (
					<line x1={x(hover)} x2={x(hover)} y1={0} y2={H} className="stroke-ink-3" strokeWidth={1} vectorEffect="non-scaling-stroke" />
				)}
			</svg>
			<p className="flex justify-between text-[10px] text-ink-3">
				<span>{fmtDate(data[0].at, "EEE h:mmaaa")}</span>
				<span>
					low {format(Math.min(...data.map((p) => p.v)))} · high {format(Math.max(...data.map((p) => p.v)))}
				</span>
			</p>
		</div>
	);
}

function HistoryCard({ report }: { report: SystemHealthReport }) {
	const [range, setRange] = useState<"day" | "week">("day");
	const h = report.history;
	const pts: SystemHealthPoint[] = (range === "day" ? h?.day : h?.week) ?? [];
	const series = (f: (p: SystemHealthPoint) => number | null | undefined) => pts.map((p) => ({ at: p.at, v: f(p) }));
	const pctFmt = (v: number) => `${Math.round(v)}%`;
	return (
		<SectionCard
			title="Trends"
			subtitle={range === "day" ? "Last 24 hours, a snapshot every 5 minutes" : "Last 7 days, hourly averages"}
			headerRight={
				<div className="flex rounded-pill border border-line p-[2px] text-xs">
					{(["day", "week"] as const).map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => setRange(r)}
							className={cn("rounded-pill px-3 py-1 font-semibold", range === r ? "bg-brand text-white" : "text-ink-2")}
							aria-pressed={range === r}
						>
							{r === "day" ? "24 h" : "7 days"}
						</button>
					))}
				</div>
			}
			bodyClassName="gap-3 pt-1"
		>
			<p className="text-[13px] text-ink-2">
				{h?.diskFullInDays != null ? (
					<>
						Main disk grows about <span className="font-semibold text-ink">{fmtBytes(h.diskGrowthPerDay)} a day</span>: full in about{" "}
						<span className="font-semibold text-ink">{Math.round(h.diskFullInDays)} days</span> at this rate.
					</>
				) : h?.diskTrend === "STEADY" || h?.diskTrend === "SHRINKING" ? (
					"Main disk use is steady: no sign of it filling up."
				) : (
					"Not enough history yet to tell when the disk would be full (needs 6 hours of snapshots)."
				)}
			</p>
			<div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
				<Sparkline label="CPU busy" points={series((p) => p.cpuPct)} value={(v) => v} format={pctFmt} max={100} />
				<Sparkline label="Memory used" points={series((p) => p.memPct)} value={(v) => v} format={pctFmt} max={100} />
				<Sparkline label="Main disk used" points={series((p) => p.diskPct)} value={(v) => v} format={(v) => `${v.toFixed(1)}%`} />
				<Sparkline label="Hospio database" points={series((p) => p.dbBytes)} value={(v) => v} format={fmtBytes} />
				<Sparkline
					label="Services up"
					points={series((p) => p.servicesUp)}
					value={(v) => v}
					format={(v) => `${Math.round(v)} of ${pts[pts.length - 1]?.servicesTotal ?? "—"}`}
					max={pts[pts.length - 1]?.servicesTotal ?? undefined}
				/>
			</div>
		</SectionCard>
	);
}

// ---- the limits in force --------------------------------------------------------------------------------

function LimitsCard({ report, superAdmin }: { report: SystemHealthReport; superAdmin: boolean }) {
	const t = report.thresholds;
	if (!t) return null;
	return (
		<SectionCard
			title="Alerts"
			subtitle={`Super admins get the bell${t.emailAlerts ? " and an email" : ""} once when one of these starts, once if it gets worse and once when it clears`}
			headerRight={
				superAdmin ? (
					<Link href="/dashboard/settings?tab=system" className={cn(btn.secondary, btn.small, "flex items-center gap-1")}>
						<SettingsIcon className="size-[14px]" /> Change limits
					</Link>
				) : undefined
			}
			bodyClassName="pt-1"
		>
			<ul className="grid gap-x-6 gap-y-1 text-[13px] text-ink-2 md:grid-cols-2">
				<li>Disk at {t.diskWarnPct}% (warning) and {t.diskCriticalPct}% (critical)</li>
				<li>
					Memory over {t.memoryPct}% with swap over {t.swapPct}% for {t.memoryMinutes} minutes
				</li>
				<li>A service down or failed for {t.serviceDownMinutes} minutes</li>
				<li>A certificate with under {t.certDays} days left</li>
				<li>
					Kafka: {t.kafkaLag.toLocaleString()} messages waiting with no progress for {t.kafkaStuckMinutes} minutes
				</li>
				<li>Database connections over {t.dbConnectionsPct}%</li>
			</ul>
			<p className="mt-2 text-xs text-ink-3">
				Open alerts also show on the Dashboard under System alerts. Never by SMS or WhatsApp. Checked {fmtDate(report.at, "h:mm:ssaaa")} in{" "}
				{report.collectSeconds ?? "—"} s.
			</p>
		</SectionCard>
	);
}
