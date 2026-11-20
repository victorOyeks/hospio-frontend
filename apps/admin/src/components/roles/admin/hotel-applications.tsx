"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowRightIcon,
	BuildingIcon,
	CalendarCheckIcon,
	MessageSquarePlusIcon,
	RocketIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	addHotelApplicationNote,
	assignHotelApplication,
	changeHotelApplicationStatus,
	linkHotelApplication,
	setHotelApplicationMeeting,
} from "@hospio/api/actions/hotel-applications";
import { useAction } from "@hospio/api/actions/use-action";
import {
	applicationStatusLabel,
	applicationTypeLabel,
	CALL_TIME_LABELS,
	HEARD_FROM_LABELS,
	HOTEL_APPLICATION_STATUSES,
	type HotelApplicationPermissions,
	type HotelApplicationRow,
	type HotelApplicationStatus,
	venueKindOf,
} from "@hospio/api/data/hotel-application-types";
import type { PageResult } from "@hospio/api/data/paging";
import type { AdminUserRow, MarketerRow } from "@hospio/api/data/types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen } from "@hospio/ui/shared/format";
import { useListParams } from "@hospio/ui/shared/list-params";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { type PillTone, StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { NewBusinessPanel } from "./businesses";
import { ReadOnlyNote } from "./shared";

const tone: Record<HotelApplicationStatus, PillTone> = {
	NEW: "warning",
	CONTACTED: "info",
	MEETING_BOOKED: "brand",
	APPROVED: "success",
	ONBOARDED: "success",
	DECLINED: "grey",
};

const TABS = ["OPEN", "NEW", "CONTACTED", "MEETING_BOOKED", "APPROVED", "ONBOARDED", "DECLINED", "ALL"] as const;
const tabLabel = (k: (typeof TABS)[number]) => (k === "OPEN" ? "Open" : k === "ALL" ? "All" : applicationStatusLabel(k));

/** "2026-11-24T10:00" in this browser's time for a datetime-local field, from an ISO instant. */
function toLocalInput(iso?: string) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

function StatusTag({ status }: { status: HotelApplicationStatus }) {
	return <StatusPill tone={tone[status]}>{applicationStatusLabel(status)}</StatusPill>;
}

/**
 * Admin · Hotel applications (hospio-backend docs/onboarding.md, "Applications"): the "Book a demo" requests from the landing site,
 * which replace self sign-up. One page at a time (`?status=&q=&page=`, Open by default), a detail panel with the status, meeting,
 * assignee, referral and an append-only timeline of notes, and Start onboarding: the "Set up a business" panel filled from the
 * request, then the 10-step wizard, with the new business linked back (ONBOARDED). Super admin and Support change; others read.
 */
export function HotelApplicationsScreen({
	result,
	opened,
	permissions,
	marketers,
	admins,
}: {
	result: PageResult<HotelApplicationRow>;
	/** The request named in the URL (`?app=`), read with its timeline. */
	opened: HotelApplicationRow | null;
	permissions: HotelApplicationPermissions;
	marketers: MarketerRow[];
	admins: AdminUserRow[];
}) {
	const router = useRouter();
	const list = useListParams();
	const [appId, setAppId] = useQueryState("app", { shallow: false });
	const [onboarding, setOnboarding] = useState<HotelApplicationRow | null>(null);
	const page = result.data;
	const counts = page.counts ?? {};
	const active = (list.params.status ?? "OPEN") as (typeof TABS)[number];
	const current = appId && opened?.id === appId ? opened : null;

	const columns: ColumnDef<HotelApplicationRow, unknown>[] = [
		{
			accessorKey: "businessName",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.businessName}
					secondary={`${applicationTypeLabel(row.original.businessType)}${row.original.rooms ? ` · ${row.original.rooms} rooms` : ""} · ${row.original.city}, ${row.original.state}`}
				/>
			),
		},
		{
			accessorKey: "ownerName",
			header: "Owner",
			cell: ({ row }) => <TwoLine primary={row.original.ownerName} secondary={row.original.phone} />,
		},
		{
			accessorKey: "marketerName",
			header: "Referred by",
			cell: ({ row }) =>
				row.original.marketerName ? (
					<span>{row.original.marketerName}</span>
				) : row.original.referralCode ? (
					<span className="text-ink-3">{row.original.referralCode} (not active)</span>
				) : (
					<span className="text-ink-3">—</span>
				),
		},
		{
			accessorKey: "assigneeName",
			header: "Assignee",
			cell: ({ row }) => <span className={row.original.assigneeName ? "" : "text-ink-3"}>{row.original.assigneeName ?? "Nobody"}</span>,
		},
		{
			accessorKey: "createdAt",
			header: "Received",
			cell: ({ row }) => <span className="text-ink-3">{fmtAgo(row.original.createdAt)}</span>,
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<span className="flex flex-col items-start gap-1">
					<StatusTag status={row.original.status} />
					{row.original.status === "MEETING_BOOKED" && row.original.meetingAt && (
						<span className="text-[11px] text-ink-3">{fmtWhen(row.original.meetingAt)}</span>
					)}
				</span>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Hotel applications"
				subtitle={`Book a demo requests from the website · ${counts.newTotal ?? 0} new · we promise a call within 1 working day`}
			/>
			{!permissions.canUpdate && (
				<ReadOnlyNote>You can read the requests; Support or a Super admin works them and starts onboarding.</ReadOnlyNote>
			)}
			<Toolbar
				left={
					<PillTabs
						tabs={TABS.map((t) => ({
							key: t,
							label: tabLabel(t),
							count: t === "ALL" ? (counts.all ?? 0) : (counts[t] ?? 0),
						}))}
						value={active}
						onChange={(k) => list.set({ status: k === "OPEN" ? null : k })}
					/>
				}
				right={
					<SearchBox value={list.search} onChange={list.setSearch} placeholder="Search business, owner, phone, city, code…" />
				}
			/>
			<DataTable
				columns={columns}
				data={page.content}
				server={{ page, onPage: list.goTo }}
				filtered={list.filtered}
				onClearFilters={list.clear}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(a) => void setAppId(a.id)}
				emptyTitle="No requests here"
				emptyHint="Businesses ask for a demo on the website's Book a demo page; each request lands here."
			/>

			<ApplicationPanel
				key={current?.id ?? "none"}
				application={current}
				loading={Boolean(appId) && !current}
				permissions={permissions}
				admins={admins}
				onClose={() => void setAppId(null)}
				onStartOnboarding={(a) => setOnboarding(a)}
				onChanged={() => router.refresh()}
			/>

			{onboarding && (
				<NewBusinessPanel
					key={onboarding.id}
					open
					onOpenChange={(o) => !o && setOnboarding(null)}
					marketers={marketers}
					admins={admins}
					initial={{
						name: onboarding.businessName,
						owner: onboarding.ownerName,
						email: onboarding.email,
						phone: onboarding.phone,
						city: onboarding.city,
						kind: venueKindOf(onboarding.businessType),
						marketerId:
							onboarding.marketerProfileId && marketers.some((m) => m.id === onboarding.marketerProfileId)
								? onboarding.marketerProfileId
								: undefined,
					}}
					note={
						<Note tone="info">
							Filled from {onboarding.ownerName}’s request ({applicationTypeLabel(onboarding.businessType)}
							{onboarding.rooms ? `, ${onboarding.rooms} rooms` : ""}, {onboarding.city}, {onboarding.state}). Check it, then
							Create business: the request is linked to the new business and marked Onboarded, and the wizard opens.
						</Note>
					}
					onCreated={async (business) => {
						const linked = await linkHotelApplication(onboarding.id, business.id);
						if (!linked.ok) toast.error(`${linked.error}. Link it from the request later.`, { duration: 10000 });
						// A full load, like Businesses: a soft push here can leave the wizard's first save queued.
						window.location.assign(`/dashboard/onboarding/${business.id}?created=1&application=${onboarding.id}`);
					}}
				/>
			)}
		</>
	);
}

function ApplicationPanel({
	application: a,
	loading,
	permissions,
	admins,
	onClose,
	onStartOnboarding,
	onChanged,
}: {
	application: HotelApplicationRow | null;
	loading: boolean;
	permissions: HotelApplicationPermissions;
	admins: AdminUserRow[];
	onClose: () => void;
	onStartOnboarding: (a: HotelApplicationRow) => void;
	onChanged: () => void;
}) {
	const { run, pending } = useAction();
	const [row, setRow] = useState(a);
	useEffect(() => setRow(a), [a]);
	const [status, setStatus] = useState<string>(a?.status ?? "NEW");
	const [meeting, setMeeting] = useState(toLocalInput(a?.meetingAt));
	const [reason, setReason] = useState("");
	const [note, setNote] = useState("");
	const updated = (r: HotelApplicationRow) => {
		setRow(r);
		setStatus(r.status);
		setMeeting(toLocalInput(r.meetingAt));
		onChanged();
	};
	const open = row ? row.status !== "ONBOARDED" && row.status !== "DECLINED" : false;
	const canWork = permissions.canUpdate && row?.status !== "ONBOARDED";
	const assigneeOptions = admins
		.filter((x) => x.status === "ACTIVE" && x.role !== "FINANCE_ADMIN")
		.map((x) => ({ value: x.id, label: x.fullName, hint: x.role === "SUPER_ADMIN" ? "Super admin" : "Support" }));
	const statusChanged = row ? status !== row.status : false;
	const needsMeeting = status === "MEETING_BOOKED" && !meeting;
	const needsReason = status === "DECLINED" && reason.trim().length < 5;

	return (
		<SidePanel
			open={Boolean(row) || loading}
			onOpenChange={(o) => !o && onClose()}
			title={row?.businessName ?? "Hotel application"}
			subtitle={row ? `Received ${fmtWhen(row.createdAt)} · ${row.city}, ${row.state}` : "Loading…"}
			icon={CalendarCheckIcon}
			width="md"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Close
					</button>
					{row && open && permissions.canUpdate && (
						<button
							type="button"
							className={cn(btn.primary, "flex items-center gap-2")}
							onClick={() => onStartOnboarding(row)}
						>
							<RocketIcon className="size-4" /> Start onboarding
						</button>
					)}
				</>
			}
		>
			{row && (
				<div className="flex flex-col gap-5">
					<div className="flex flex-wrap items-center gap-2">
						<StatusTag status={row.status} />
						{row.statusChangedAt && <span className="text-xs text-ink-3">since {fmtWhen(row.statusChangedAt)}</span>}
					</div>
					{row.status === "ONBOARDED" && row.businessId && (
						<Note tone="success">
							Onboarded as{" "}
							<Link href={`/dashboard/businesses/${row.businessId}`} className="font-semibold underline">
								{row.linkedBusinessName ?? "the business"}
							</Link>
							{row.onboardedAt ? ` on ${fmtWhen(row.onboardedAt)}` : ""}.{" "}
							<Link href={`/dashboard/onboarding/${row.businessId}`} className="font-semibold underline">
								Open the onboarding wizard
							</Link>
						</Note>
					)}
					{row.status === "DECLINED" && row.declineReason && (
						<Note tone="warning">
							<span className="font-semibold">Why it was declined: </span>
							{row.declineReason}
						</Note>
					)}

					<PanelSection title="The business">
						<DetailList
							columns={2}
							items={[
								{ label: "Business", value: row.businessName },
								{ label: "Kind", value: applicationTypeLabel(row.businessType) },
								{ label: "City / state", value: `${row.city}, ${row.state}` },
								{ label: "Rooms", value: row.rooms ?? "—" },
							]}
						/>
					</PanelSection>
					<PanelSection title="Owner">
						<DetailList
							columns={2}
							items={[
								{ label: "Full name", value: row.ownerName },
								{ label: "Phone", value: <a href={`tel:${row.phone}`} className="underline">{row.phone}</a> },
								{ label: "Email", value: <span className="break-all">{row.email}</span> },
								{ label: "Best time to call", value: row.preferredTime ? CALL_TIME_LABELS[row.preferredTime] ?? row.preferredTime : "Any time" },
								{ label: "Heard about us", value: row.heardFrom ? HEARD_FROM_LABELS[row.heardFrom] ?? row.heardFrom : "—" },
							]}
						/>
						{row.message ? (
							<p className="whitespace-pre-wrap break-words rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">{row.message}</p>
						) : (
							<p className="text-xs text-ink-3">No message.</p>
						)}
					</PanelSection>
					<PanelSection title="Referral">
						{row.marketerName ? (
							<p className="text-[13px] text-ink">
								Referred by <span className="font-semibold">{row.marketerName}</span>
								{row.referralCode ? ` (${row.referralCode})` : ""}. Start onboarding picks them as the business’s marketer.
							</p>
						) : row.referralCode ? (
							<p className="text-[13px] text-ink-2">
								Came with code {row.referralCode}, which isn’t an active partner’s. No marketer is recorded.
							</p>
						) : (
							<p className="text-[13px] text-ink-2">No referral: they came direct.</p>
						)}
					</PanelSection>

					<PanelSection title="Work it">
						<SelectField
							label="Assignee"
							value={row.assigneeId ?? ""}
							onChange={(v) =>
								run(() => assignHotelApplication(row, v || null), v ? "Assignee saved" : "Unassigned", updated)
							}
							options={assigneeOptions}
							placeholder="Nobody"
							disabled={!canWork || pending}
						/>
						<SelectField
							label="Status"
							value={status}
							onChange={setStatus}
							options={HOTEL_APPLICATION_STATUSES.filter((s) => s.value !== "ONBOARDED").map((s) => ({
								value: s.value,
								label: s.label,
							}))}
							disabled={!canWork || pending}
							hint={row.status === "ONBOARDED" ? "Onboarded is final." : "Onboarded comes from Start onboarding."}
						/>
						<TextField
							label="Meeting date and time"
							type="datetime-local"
							value={meeting}
							onChange={setMeeting}
							disabled={!canWork || pending}
							hint="Your time. Needed for Meeting booked."
							error={statusChanged && needsMeeting ? "Set the meeting date and time" : undefined}
						/>
						{status === "DECLINED" && statusChanged && (
							<TextareaField
								label="Why is it declined?"
								value={reason}
								onChange={(v) => setReason(v.slice(0, 500))}
								placeholder="e.g. Outside the cities we cover for now"
								hint={`${reason.trim().length}/500 · kept with the request; the applicant is not emailed`}
								rows={2}
							/>
						)}
						{canWork && (
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									className={btn.primary}
									disabled={pending || !statusChanged || needsMeeting || needsReason || (status === "DECLINED" && !permissions.canDecline)}
									onClick={() =>
										run(
											() =>
												changeHotelApplicationStatus(row, {
													status: status as Exclude<HotelApplicationStatus, "ONBOARDED">,
													meetingAt: toIso(meeting),
													reason: status === "DECLINED" ? reason.trim() : undefined,
												}),
											`Marked ${applicationStatusLabel(status)}`,
											(r) => {
												setReason("");
												updated(r);
											},
										)
									}
								>
									Save status
								</button>
								{!statusChanged && meeting !== toLocalInput(row.meetingAt) && (
									<button
										type="button"
										className={btn.secondary}
										disabled={pending}
										onClick={() => run(() => setHotelApplicationMeeting(row, toIso(meeting)), meeting ? "Meeting saved" : "Meeting cleared", updated)}
									>
										Save meeting
									</button>
								)}
							</div>
						)}
					</PanelSection>

					<PanelSection title="Notes">
						{row.notes.length === 0 ? (
							<p className="text-xs text-ink-3">Nothing yet. Notes, status changes and assignments show here, oldest first.</p>
						) : (
							<ol className="flex flex-col gap-3">
								{row.notes.map((n) => (
									<li key={n.id} className={cn("rounded-xl px-4 py-3 text-[13px]", n.kind === "NOTE" ? "bg-subtle text-ink" : "border border-line text-ink-2")}>
										<p className="whitespace-pre-wrap break-words">{n.body}</p>
										<p className="mt-1 text-[11px] text-ink-3">
											{n.authorName} · {fmtWhen(n.createdAt)}
										</p>
									</li>
								))}
							</ol>
						)}
						{permissions.canUpdate && (
							<div className="flex flex-col gap-2">
								<TextareaField
									label="Add a note"
									value={note}
									onChange={(v) => setNote(v.slice(0, 2000))}
									placeholder="e.g. Called, wants the demo on Tuesday morning"
									hint="Notes can't be edited or deleted"
									rows={2}
								/>
								<button
									type="button"
									className={cn(btn.secondary, "flex items-center gap-2 self-start")}
									disabled={pending || note.trim().length === 0}
									onClick={() =>
										run(() => addHotelApplicationNote(row, note.trim()), "Note added", (r) => {
											setNote("");
											updated(r);
										})
									}
								>
									<MessageSquarePlusIcon className="size-4" /> Add note
								</button>
							</div>
						)}
					</PanelSection>

					<PanelSection title="Sent from">
						<DetailList
							items={[
								{ label: "Address", value: row.ip ?? "—" },
								{ label: "Browser", value: <span className="break-all text-xs">{row.userAgent ?? "—"}</span> },
							]}
						/>
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}

/**
 * The wizard's reminder of the request a business came from (`/dashboard/onboarding/{id}?application=`): rooms and the rest of
 * what the owner told us, which the Set up a business panel has no field for.
 */
export function FromApplicationBanner({ application: a }: { application: HotelApplicationRow }) {
	return (
		<div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-brand/20 bg-brand-soft px-4 py-3 text-[13px] text-brand">
			<BuildingIcon className="size-4 shrink-0" />
			<span className="min-w-0 flex-1">
				From {a.ownerName}’s demo request: {applicationTypeLabel(a.businessType)}
				{a.rooms ? `, ${a.rooms} rooms` : ""}, {a.city}, {a.state}
				{a.marketerName ? ` · referred by ${a.marketerName}` : ""}
				{a.message ? ` · “${a.message.length > 120 ? `${a.message.slice(0, 120)}…` : a.message}”` : ""}
			</span>
			<Link href={`/dashboard/hotel-applications?app=${a.id}`} className="inline-flex items-center gap-1 font-semibold underline">
				Open the request <ArrowRightIcon className="size-3.5" />
			</Link>
		</div>
	);
}
