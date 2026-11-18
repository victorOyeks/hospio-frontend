"use client";

import { AlertTriangleIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { fmtTime } from "@hospio/ui/shared/format";
import type { DepartmentLive } from "@hospio/api/data/types";
import { ActivityIcon, ClipboardCheckIcon, LayoutGridIcon, UsersIcon } from "lucide-react";
import { roleIcons } from "@hospio/api/roles";
import { isHotelRole } from "@hospio/api/roles";

const toneLabel: Record<DepartmentLive["tone"], { label: string; tone: "success" | "warning" | "danger" | "grey" }> = {
	success: { label: "OK", tone: "success" },
	warning: { label: "to watch", tone: "warning" },
	danger: { label: "Urgent", tone: "danger" },
	grey: { label: "Quiet", tone: "grey" },
};

/** Manager · Departments: what every team is doing right now, one card per department. */
export function DepartmentsScreen({ departments: all, hotelName, approvalsWaiting, roomsReady, hasRooms = true }: { departments: DepartmentLive[]; hotelName: string; approvalsWaiting: number; roomsReady: number; hasRooms?: boolean }) {
	const router = useRouter();
	// The board is live: read it again every minute while the page is open.
	useEffect(() => {
		const t = setInterval(() => router.refresh(), 60_000);
		return () => clearInterval(t);
	}, [router]);
	// Teams this hotel does not run (no rooms, no bar, nobody in the role) are left out.
	const departments = all.filter((d) => d.present !== false);
	const staffOnShift = departments.reduce((s, d) => s + d.onShift, 0);
	const staffScheduled = departments.reduce((s, d) => s + d.scheduled, 0);
	const attention = departments.filter((d) => d.tone === "warning" || d.tone === "danger").reduce((s, d) => s + d.open, 0);
	return (
		<>
			<PageHeader title="Departments" subtitle={<span suppressHydrationWarning>{`${hotelName} · what every team is doing right now · ${fmtTime(new Date())}`}</span>}>
				<StatusPill tone="success">Live · updates every minute</StatusPill>
			</PageHeader>

			<div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
				<KpiCard label="Staff on shift" value={staffScheduled > 0 ? `${staffOnShift} of ${staffScheduled}` : `${staffOnShift} clocked in`} icon={UsersIcon} hint={staffScheduled === 0 ? <Link href="/dashboard/shifts" className="font-semibold text-brand">Nobody on today's rota →</Link> : undefined} />
				<KpiCard label="Needs attention" value={attention === 0 ? "Nothing" : `${attention} ${attention === 1 ? "thing" : "things"}`} icon={AlertTriangleIcon} />
				<KpiCard label="Waiting for you" value={`${approvalsWaiting} ${approvalsWaiting === 1 ? "approval" : "approvals"}`} icon={ClipboardCheckIcon} hint={<Link href="/dashboard/approvals" className="font-semibold text-brand">Open approvals →</Link>} />
				{hasRooms && <KpiCard label="Rooms ready to sell" value={roomsReady} icon={LayoutGridIcon} />}
			</div>

			{departments.length === 0 && (
				<p className="rounded-card border border-line bg-card px-5 py-6 text-sm text-ink-2">
					No team has people, shifts or work recorded here yet. Add staff in Staff and their shifts in Shifts, and each team shows up with what it is doing.
				</p>
			)}

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{departments.map((d) => {
					const Icon = isHotelRole(d.key) ? roleIcons[d.key] : ActivityIcon;
					const t = toneLabel[d.tone];
					return (
						<Link key={d.key} href={`/dashboard/departments/${d.key.toLowerCase()}`} className={`flex flex-col gap-3 rounded-card border bg-card p-[18px] transition-colors hover:bg-brand-soft/20 ${d.tone === "danger" ? "border-danger/40" : "border-line"}`}>
							<div className="flex items-center gap-[10px]">
								<span className="flex size-8 items-center justify-center rounded-[10px] bg-brand-soft text-brand">
									<Icon className="size-4" />
								</span>
								<span className="flex-1 text-[15px] font-bold text-ink">{d.name}</span>
								<StatusPill tone={t.tone}>{d.tone === "warning" ? `${d.open} ${t.label}` : t.label}</StatusPill>
							</div>
							<p className="text-xs text-ink-3">
								{d.onShift} on shift · {d.scheduled === 0 ? "nobody on today's rota" : `${d.scheduled} scheduled`}
							</p>
							<dl className="flex flex-col gap-[6px] text-[13px]">
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">{d.openLabel.charAt(0).toUpperCase() + d.openLabel.slice(1)}</dt>
									<dd className="font-semibold text-ink">{d.open}</dd>
								</div>
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">Actions last hour</dt>
									<dd className="font-semibold text-ink">{d.actionsLastHour}</dd>
								</div>
								<div className="flex justify-between gap-3">
									<dt className="text-ink-2">Last action</dt>
									<dd className="truncate text-right font-semibold text-ink">{d.lastAt ? fmtTime(d.lastAt) : "—"}</dd>
								</div>
							</dl>
							<p className={`flex items-center gap-[6px] text-xs font-medium ${d.tone === "danger" ? "text-danger" : d.tone === "warning" ? "text-warning" : "text-ink-2"}`}>
								<AlertTriangleIcon className="size-[14px] shrink-0" />
								<span className="truncate">{d.lastAction || "Nothing recorded in the last 24 hours"}</span>
							</p>
						</Link>
					);
				})}
			</div>

			<p className="flex items-center gap-2 rounded-[10px] bg-card px-4 py-3 text-xs text-ink-2">
				<EyeIcon className="size-4 text-ink-3" /> You can open any team’s own screen to see exactly what they see — view only. Every action they take is in the{" "}
				<Link href="/dashboard/activity" className="font-semibold text-brand">
					Activity log
				</Link>
				.
			</p>
		</>
	);
}
