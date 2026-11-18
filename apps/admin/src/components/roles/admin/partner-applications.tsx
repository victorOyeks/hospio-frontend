"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BanIcon, CheckIcon, FileUserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { declinePartnerApplication } from "@hospio/api/actions/partner-applications";
import { useAction } from "@hospio/api/actions/use-action";
import {
	countLabel,
	kindLabel,
	type PartnerApplicationRow,
	type PartnerApplicationStatus,
	type PartnerReviewDefaults,
} from "@hospio/api/data/partner-application-types";
import type { PageResult } from "@hospio/api/data/paging";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { TextareaField, ToggleField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtWhen } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { type PillTone, StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { useFilterParam, usePageParam } from "./live";
import { ReadOnlyNote } from "./shared";

const statusMeta: Record<
	PartnerApplicationStatus,
	{ label: string; tone: PillTone }
> = {
	PENDING: { label: "Waiting", tone: "warning" },
	APPROVED: { label: "Approved", tone: "success" },
	DECLINED: { label: "Declined", tone: "grey" },
};

const knows = (a: PartnerApplicationRow) =>
	`${a.businessKinds.map(kindLabel).join(", ") || "—"} · ${countLabel(a.businessCount)}`;

/** The search and status filter of the Applications tab (`?aq=&astatus=`), for the Marketers toolbar. */
export function PartnerApplicationFilters() {
	const [status, setStatus] = useFilterParam("astatus");
	const [q, setQ] = useFilterParam("aq");
	const [, setPage] = usePageParam();
	const [text, setText] = useState(q);
	useEffect(() => setText(q), [q]);
	// The list is searched by the server: wait for a pause in typing before asking.
	useEffect(() => {
		if (text.trim() === q) return;
		const t = setTimeout(() => {
			setQ(text.trim());
			setPage(0);
		}, 350);
		return () => clearTimeout(t);
	}, [text, q, setQ, setPage]);
	return (
		<>
			<FilterSelect
				value={status}
				onChange={(v) => {
					setStatus(v);
					setPage(0);
				}}
				all="Any status"
				options={[
					{ value: "PENDING", label: "Waiting" },
					{ value: "APPROVED", label: "Approved" },
					{ value: "DECLINED", label: "Declined" },
				]}
			/>
			<SearchBox
				value={text}
				onChange={setText}
				placeholder="Search applications…"
			/>
		</>
	);
}

/**
 * Admin · Marketers · Applications: what people sent from the landing site's "Apply to be a partner" form
 * (GET /platform/admin/partner-applications, a page at a time), a detail panel, Approve (opens the invite form
 * prefilled; the parent runs it) and Decline with a reason. Super admin and Support decide; others read.
 */
export function PartnerApplicationsTab({
	result,
	opened,
	defaults,
	openId,
	onOpen,
	onApprove,
	onChanged,
}: {
	result: PageResult<PartnerApplicationRow>;
	/** The application named in the URL (`?app=`) when it isn't on this page, e.g. from the bell. */
	opened: PartnerApplicationRow | null;
	defaults: PartnerReviewDefaults;
	openId: string | null;
	onOpen: (id: string | null) => void;
	onApprove: (a: PartnerApplicationRow) => void;
	onChanged: () => void;
}) {
	const [status, setStatus] = useFilterParam("astatus");
	const [q, setQ] = useFilterParam("aq");
	const [, setPage] = usePageParam();
	const [declining, setDeclining] = useState<PartnerApplicationRow | null>(
		null,
	);
	const page = result.data;
	const current =
		(openId &&
			(page.content.find((a) => a.id === openId) ??
				(opened?.id === openId ? opened : null))) ||
		null;

	const columns: ColumnDef<PartnerApplicationRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Applicant",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.fullName}
					secondary={row.original.email}
				/>
			),
		},
		{
			accessorKey: "city",
			header: "Where",
			cell: ({ row }) => (
				<span>
					{row.original.city}, {row.original.state}
				</span>
			),
		},
		{
			accessorKey: "businessKinds",
			header: "Knows",
			cell: ({ row }) => <span>{knows(row.original)}</span>,
		},
		{
			accessorKey: "createdAt",
			header: "Applied",
			cell: ({ row }) => (
				<span className="text-ink-3">{fmtAgo(row.original.createdAt)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusMeta[row.original.status].tone}>
					{statusMeta[row.original.status].label}
				</StatusPill>
			),
		},
	];

	return (
		<>
			<DataTable
				columns={columns}
				data={page.content}
				server={{ page, onPage: setPage }}
				onRowClick={(a) => onOpen(a.id)}
				emptyTitle="No applications"
				emptyHint="People apply from the Partner program page on the Hospio360 website; each one lands here for review."
				filtered={Boolean(status || q)}
				onClearFilters={() => {
					setStatus(null);
					setQ(null);
					setPage(0);
				}}
				error={result.ok ? null : result.error}
				onRetry={onChanged}
			/>

			<SidePanel
				open={Boolean(current)}
				onOpenChange={(o) => !o && onOpen(null)}
				title={current?.fullName ?? "Application"}
				subtitle={
					current
						? `Applied ${fmtWhen(current.createdAt)} · ${current.city}, ${current.state}`
						: undefined
				}
				icon={FileUserIcon}
				width="md"
				footer={
					current?.status === "PENDING" && defaults.canDecide ? (
						<>
							<button
								type="button"
								className={cn(btn.secondary, "flex items-center gap-2")}
								onClick={() => setDeclining(current)}
							>
								<BanIcon className="size-4" /> Decline
							</button>
							<button
								type="button"
								className={cn(btn.primary, "flex items-center gap-2")}
								onClick={() => onApprove(current)}
							>
								<CheckIcon className="size-4" /> Approve
							</button>
						</>
					) : (
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onOpen(null)}
						>
							Close
						</button>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						<div className="flex items-center gap-2">
							<StatusPill tone={statusMeta[current.status].tone}>
								{statusMeta[current.status].label}
							</StatusPill>
							{current.decidedAt && (
								<span className="text-xs text-ink-3">
									{current.decidedByName ?? "Hospio360"} ·{" "}
									{fmtWhen(current.decidedAt)}
								</span>
							)}
						</div>
						{current.status === "PENDING" && !defaults.canDecide && (
							<ReadOnlyNote>
								Only a super admin or support can approve or decline.
							</ReadOnlyNote>
						)}
						{current.status === "APPROVED" && current.marketerProfileId && (
							<Note tone="success">
								Invited as a marketer:{" "}
								<Link
									href={`/dashboard/marketers?open=${current.marketerProfileId}`}
									className="font-semibold underline"
								>
									{current.marketerName ?? "open the marketer"}
								</Link>
							</Note>
						)}
						{current.status === "DECLINED" && current.declineReason && (
							<Note tone="warning">
								<span className="font-semibold">Why it was declined: </span>
								{current.declineReason}
								<span className="mt-1 block text-xs opacity-80">
									{current.declineReasonShared
										? "This reason was included in the email to the applicant."
										: "The applicant was not given this reason."}
								</span>
							</Note>
						)}
						<PanelSection title="Applicant">
							<DetailList
								items={[
									{ label: "Full name", value: current.fullName },
									{ label: "Email", value: current.email },
									{ label: "Phone", value: current.phone },
									{
										label: "City / state",
										value: `${current.city}, ${current.state}`,
									},
									...(current.companyName
										? [{ label: "Company", value: current.companyName }]
										: []),
								]}
							/>
						</PanelSection>
						<PanelSection title="Their network">
							<DetailList
								items={[
									{
										label: "Businesses they know",
										value: current.businessKinds.map(kindLabel).join(", "),
									},
									{
										label: "Roughly how many",
										value: countLabel(current.businessCount),
									},
								]}
							/>
							{current.networkNote ? (
								<p className="whitespace-pre-wrap break-words rounded-xl bg-subtle px-4 py-3 text-[13px] text-ink">
									{current.networkNote}
								</p>
							) : (
								<p className="text-xs text-ink-3">
									They didn’t add anything about their network.
								</p>
							)}
						</PanelSection>
						<PanelSection title="What they read and ticked">
							<DetailList
								items={[
									{
										label: "Referral partner terms",
										value: current.rpaVersion ?? "—",
									},
									{
										label: "Privacy Policy",
										value: current.privacyVersion ?? "—",
									},
									{ label: "Sent from", value: current.ip ?? "—" },
									{
										label: "Browser",
										value: (
											<span className="break-all text-xs">
												{current.userAgent ?? "—"}
											</span>
										),
									},
								]}
							/>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<DeclineModal
				application={declining}
				onClose={() => setDeclining(null)}
				onDone={() => {
					setDeclining(null);
					onChanged();
				}}
			/>
		</>
	);
}

function DeclineModal({
	application,
	onClose,
	onDone,
}: {
	application: PartnerApplicationRow | null;
	onClose: () => void;
	onDone: () => void;
}) {
	const { run, pending } = useAction();
	const [reason, setReason] = useState("");
	const [share, setShare] = useState(false);
	useEffect(() => {
		if (application) {
			setReason("");
			setShare(false);
		}
	}, [application]);
	const ok = reason.trim().length >= 5 && reason.trim().length <= 500;
	return (
		<Modal
			open={Boolean(application)}
			onOpenChange={(o) => !o && onClose()}
			title={`Decline ${application?.fullName ?? "application"}?`}
			subtitle="They get a polite email; the reason stays with the application"
			icon={BanIcon}
			size="confirm"
			tone="danger"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.danger}
						disabled={!ok || pending}
						onClick={() =>
							application &&
							run(
								() =>
									declinePartnerApplication(application, {
										reason: reason.trim(),
										shareReason: share,
									}),
								`${application.fullName}'s application declined`,
								onDone,
							)
						}
					>
						Decline application
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextareaField
					label="Why is it declined?"
					value={reason}
					onChange={(v) => setReason(v.slice(0, 500))}
					placeholder="e.g. Outside the cities we cover for now"
					hint={`${reason.trim().length}/500 · kept with the application and in Changes by Hospio360`}
					rows={3}
				/>
				<ToggleField
					label="Include this reason in the email"
					hint="Off: the email only says we can’t take the application forward"
					checked={share}
					onChange={setShare}
				/>
				<WhatHappens
					tone="danger"
					items={[
						`${application?.email ?? "The applicant"} is emailed that we can’t take the application forward${share ? ", with the reason above" : ""}`,
						"They can apply again later",
						"No marketer login is created",
					]}
				/>
			</div>
		</Modal>
	);
}
