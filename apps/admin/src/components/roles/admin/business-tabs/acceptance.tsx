"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportBusinessAcceptances, recordLinksShared } from "@hospio/api/actions/legal";
import { useAction } from "@hospio/api/actions/use-action";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { emptyLinksShared, LinksSharedFields, linksSharedReady } from "@hospio/ui/shared/links-shared";
import type { LegalRecord } from "@hospio/api/api/routes-legal";
import { Note } from "@hospio/ui/shared/detail-list";
import { CHANNEL_LABELS, LegalRecordsTable } from "@hospio/ui/shared/legal-records";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { btn } from "@hospio/ui/shared/ui";
import { BusinessTabHeader } from "./nav";

const OWNER_DOCS = ["TERMS", "PRIVACY", "DPA", "DEBIT"];

/**
 * Business · Acceptance (hospio-backend docs/legal-acceptance.md): who accepted which version of which document, when, from where and
 * how; the back office's note of how the links were shared; the CSV export. Records are append-only.
 */
export function AcceptanceTab({
	businessId,
	businessName,
	records,
	error,
}: {
	businessId: string;
	businessName: string;
	records: LegalRecord[];
	error: string | null;
}) {
	const [busy, setBusy] = useState(false);
	const router = useRouter();
	const [sharing, setSharing] = useState(false);
	const [links, setLinks] = useState(emptyLinksShared);
	const { run, pending } = useAction();
	const accepted = records.filter((r) => r.event === "ACCEPTED");
	const ownerDone = OWNER_DOCS.every((k) => accepted.some((r) => r.docKey === k && r.role === "OWNER"));
	const shared = records.find((r) => r.event === "LINKS_SHARED");

	async function exportCsv() {
		setBusy(true);
		const r = await exportBusinessAcceptances(businessId);
		setBusy(false);
		if (!r.ok) {
			toast.error(r.error);
			return;
		}
		const blob = new Blob([`﻿${r.data.text}`], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = r.data.name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="acceptance"
				subtitle="Terms, privacy, data processing, the monthly invoice agreement (older records: daily debit authority), staff and device terms: who accepted which version, when and how"
			>
				<button type="button" className={btn.secondary} onClick={() => setSharing(true)}>
					Record links shared
				</button>
				<button type="button" className={btn.secondary} onClick={() => void exportCsv()} disabled={busy || records.length === 0}>
					<DownloadIcon className="size-4" /> Export CSV
				</button>
			</BusinessTabHeader>
			{error && <Note tone="danger">{error}</Note>}
			<Note tone={ownerDone ? "success" : "warning"}>
				{ownerDone
					? "The owner has accepted the Terms, Privacy Policy, Data Processing Terms and the monthly invoice agreement."
					: "The owner hasn't accepted all of the Terms, Privacy Policy, Data Processing Terms and the monthly invoice agreement yet: they are asked at their next sign-in."}
				{shared ? ` Links shared by ${shared.recordedByName ?? "Hospio360"} (${CHANNEL_LABELS[shared.channel ?? ""] ?? shared.channel}, ${shared.sharedOn}).` : ""}
			</Note>
			<SectionCard title="Records" subtitle="Newest first. Records are never changed or removed." flush>
				<LegalRecordsTable records={records} empty="No acceptances yet" />
			</SectionCard>
			<ConfirmModal
				open={sharing}
				onOpenChange={setSharing}
				title="Record how the legal links were shared"
				subtitle={`With ${businessName}'s owner. This is a note, not an acceptance.`}
				confirmLabel="Record"
				pending={pending}
				confirmDisabled={!linksSharedReady(links)}
				onConfirm={() =>
					void run(
						() => recordLinksShared(businessId, { channel: links.channel, sharedOn: links.sharedOn, note: links.note.trim() || undefined }),
						"Recorded how the links were shared",
						() => {
							setSharing(false);
							setLinks(emptyLinksShared());
							router.refresh();
						},
					)
				}
			>
				<LinksSharedFields value={links} onChange={setLinks} />
			</ConfirmModal>
		</>
	);
}
