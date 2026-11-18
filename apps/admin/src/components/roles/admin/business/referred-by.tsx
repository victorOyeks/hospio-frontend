"use client";

import { MegaphoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	changeBusinessMarketer,
	loadBusinessMarketer,
	loadReferrerOptions,
} from "@hospio/api/actions/marketer-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BusinessMarketerData,
	MarketerChangeResult,
	MarketerProfileRow,
} from "@hospio/api/data/admin-types";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { Modal } from "@hospio/ui/shared/modal";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** "Nobody · direct" in the pickers; the API takes null. */
export const NOBODY = "__nobody";

/** The marketer profiles a business can be credited to (not ENDED), loaded once. */
export function useReferrers() {
	const [rows, setRows] = useState<MarketerProfileRow[] | null>(null);
	useEffect(() => {
		let alive = true;
		loadReferrerOptions().then((r) => {
			if (alive) setRows(r.ok ? r.data : []);
		});
		return () => {
			alive = false;
		};
	}, []);
	return rows;
}

export const referrerOptions = (rows: MarketerProfileRow[]) => [
	{ value: NOBODY, label: "Nobody · direct" },
	...rows.map((m) => ({
		value: m.id,
		label: m.fullName,
		hint: [
			m.referralCode,
			`${m.sharePct}% for ${m.months} months`,
			m.status === "PENDING" ? "not active yet" : undefined,
		]
			.filter(Boolean)
			.join(" · "),
	})),
];

/** Who referred the business (GET /platform/admin/businesses/{id}/marketer), loaded on the page. */
export function useBusinessMarketer(businessId: string, marketerId?: string) {
	const [data, setData] = useState<BusinessMarketerData | null>(null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		let alive = true;
		loadBusinessMarketer(businessId).then((r) => {
			if (!alive) return;
			if (r.ok) {
				setData(r.data);
				setError(null);
			} else setError(r.error);
		});
		return () => {
			alive = false;
		};
	}, [businessId, marketerId]);
	return { data, setData, error };
}

export function referredByText(d: BusinessMarketerData | null) {
	if (!d) return "…";
	if (!d.profileId) return "Direct (nobody)";
	return `${d.fullName ?? "A marketer"}${d.referralCode ? ` (${d.referralCode})` : ""}${d.status === "ENDED" ? " · ended" : ""}`;
}

/** The result of a change, in one sentence for the toast. */
export function changeMessage(r: MarketerChangeResult) {
	const to = r.toName ?? (r.toProfileId ? "the marketer" : "nobody");
	const opened = r.opened ? " · their agreement starts today" : "";
	const ended = r.ended.length
		? ` · ${r.fromName ?? "the old marketer"}'s agreement ended`
		: "";
	return `Referred by is now ${to}${ended}${opened}`;
}

/**
 * Business · Overview "Referred by": the marketer's name and code, with Change (PUT /platform/admin/businesses/{id}/marketer
 * with a reason; the old agreement ends and a live business opens the new one today).
 */
export function ReferredByValue({
	businessId,
	marketerId,
	editable,
	onChanged,
}: {
	businessId: string;
	marketerId?: string;
	editable: boolean;
	/** The business's new marketerId (undefined = nobody), so later edits send the right one. */
	onChanged: (marketerId: string | undefined) => void;
}) {
	const { data, error } = useBusinessMarketer(businessId, marketerId);
	const [open, setOpen] = useState(false);
	return (
		<span className="flex flex-wrap items-center gap-2">
			<span>{error ? "Couldn't load" : referredByText(data)}</span>
			{editable && (
				<button
					type="button"
					className={btn.link}
					onClick={() => setOpen(true)}
				>
					Change
				</button>
			)}
			<ChangeReferrerModal
				open={open}
				businessId={businessId}
				current={data?.profileId}
				onClose={() => setOpen(false)}
				onChanged={(r) => {
					setOpen(false);
					onChanged(r.toProfileId);
				}}
			/>
		</span>
	);
}

function ChangeReferrerModal({
	open,
	businessId,
	current,
	onClose,
	onChanged,
}: {
	open: boolean;
	businessId: string;
	current?: string;
	onClose: () => void;
	onChanged: (r: MarketerChangeResult) => void;
}) {
	const referrers = useReferrers();
	const { run, pending } = useAction();
	const [to, setTo] = useState("");
	const [reason, setReason] = useState("");
	useEffect(() => {
		if (!open) return;
		setTo(current ?? NOBODY);
		setReason("");
	}, [open, current]);
	const same = (to === NOBODY ? undefined : to) === current;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Change who referred this business"
			subtitle="Audit-logged · the marketer's commission follows the change"
			icon={MegaphoneIcon}
			size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || same || reason.trim().length < 5 || !to}
						onClick={() =>
							run(
								() =>
									changeBusinessMarketer(
										businessId,
										to === NOBODY ? null : to,
										reason,
									),
								changeMessage,
								onChanged,
							)
						}
					>
						Change
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Referred by"
					value={to}
					onChange={setTo}
					options={referrerOptions(referrers ?? [])}
					placeholder={referrers ? "Choose…" : "Loading marketers…"}
				/>
				<TextField
					label="Reason"
					value={reason}
					onChange={setReason}
					placeholder="The owner was introduced by Amaka, not Kunle"
					hint="At least 5 characters; kept in the audit log"
					required
				/>
				<WhatHappens
					items={[
						"The current marketer's agreement for this business ends today",
						"A live business opens the new marketer's agreement today, keeping its earning window",
						"Earlier commission lines stay with whoever earned them",
					]}
				/>
				{same && (
					<Note tone="info" className={cn("text-xs")}>
						Pick a different marketer (or Nobody) to change it.
					</Note>
				)}
			</div>
		</Modal>
	);
}
