"use client";

import { useEffect, useMemo, useState } from "react";
import { undoChange } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	AdminActivityRow,
	AdminChangeRow,
	Paged,
} from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RetentionNote } from "@hospio/ui/shared/retention-note";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { ActivityLog, ChangeLog } from "./change-log";
import { ServerPager, useFilterParam, usePageParam } from "./live";
import { can } from "./shared";

/**
 * Admin — Changes by Hospio360 (Figma 3334:1454): GET /platform/admin/changes paged and filtered on the
 * server, undo while the window is open; the Activity tab is GET /platform/activity?byPlatform=true.
 */
export function ChangesScreen({
	role,
	changes: initial,
	businesses,
	activity,
	retentionDays,
}: {
	role: AdminRole;
	changes: Paged<AdminChangeRow>;
	businesses: BusinessRow[];
	activity: Paged<AdminActivityRow>;
	/** Both tabs are audit logs, deleted after this many days (GET /platform/activity/retention). */
	retentionDays: number;
}) {
	const [changes, setChanges] = useState(initial.content);
	useEffect(() => setChanges(initial.content), [initial.content]);
	const [tab, setTab] = useFilterParam("tab");
	const [biz, setBiz] = useFilterParam("businessId");
	const [, setPage] = usePageParam();
	const [search, setSearch] = useState("");
	const [undo, setUndo] = useState<AdminChangeRow | null>(null);
	const { run, pending } = useAction();
	const active = tab || "changes";
	const rows = changes;

	const needle = search.toLowerCase().trim();
	const shown = needle
		? rows.filter((c) => JSON.stringify(c).toLowerCase().includes(needle))
		: rows;
	const businessNames = useMemo(
		() => new Map(businesses.map((b) => [b.id, b.name])),
		[businesses],
	);

	return (
		<>
			<PageHeader
				title="Changes by Hospio360"
				subtitle="Everything our team changed inside a business's account, with the reason given; marked undone within 7 days once support puts it back"
			/>
			<RetentionNote days={retentionDays} />
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{
								key: "changes",
								label: "Changes in businesses",
								count: initial.total,
							},
							{
								key: "activity",
								label: "Admin activity",
								count: activity.total,
							},
						]}
						value={active}
						onChange={(k) => {
							setTab(k === "changes" ? null : k);
							setPage(0);
						}}
					/>
				}
				right={
					active === "changes" ? (
						<>
							<FilterSelect
								value={biz}
								onChange={(v) => {
									setBiz(v);
									setPage(0);
								}}
								all="All businesses"
								options={businesses.map((b) => ({
									value: b.id,
									label: b.name,
								}))}
							/>
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search this page…"
							/>
						</>
					) : undefined
				}
			/>
			{active === "changes" ? (
				<ChangeLog
					rows={shown}
					canUndo={can.editBusiness(role)}
					onUndo={setUndo}
					empty={
						needle && rows.length > 0 ? (
							<EmptyState title="No matches" hint="Nothing on this page matches the search." />
						) : (
							<EmptyState title="No changes" hint="Edits made as Hospio360 appear here." />
						)
					}
					footer={<ServerPager bare page={initial} onPage={setPage} className="flex-1" />}
				/>
			) : (
				<ActivityLog
					rows={activity.content}
					businessNames={businessNames}
					empty={<EmptyState title="Nothing recorded yet" hint="Sign-ins, approvals and actions by the Hospio360 team appear here." />}
					footer={<ServerPager bare page={activity} onPage={setPage} className="flex-1" />}
				/>
			)}

			<ConfirmModal
				open={!!undo}
				onOpenChange={(o) => !o && setUndo(null)}
				tone="danger"
				title="Undo this change?"
				subtitle={
					undo ? `${undo.businessName} · ${undo.description}` : undefined
				}
				confirmLabel="Mark undone"
				pending={pending}
				onConfirm={() =>
					undo &&
					run(
						() => undoChange(undo.id, undo),
						"Marked undone",
						(c) => {
							setChanges((all) => all.map((x) => (x.id === c.id ? c : x)));
							setUndo(null);
						},
					)
				}
			>
				<WhatHappens
					tone="warning"
					items={[
						"Put the previous value back first (for example with Edit as Hospio360): Undo doesn't change the setting itself",
						"The change is marked undone and the owner's undo request ticket is resolved",
						"The owner and managers see 'undone by Hospio360' in their activity log",
					]}
				/>
			</ConfirmModal>
		</>
	);
}
