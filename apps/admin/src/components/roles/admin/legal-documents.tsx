"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishLegalVersion } from "@hospio/api/actions/legal";
import { useAction } from "@hospio/api/actions/use-action";
import type { LegalVersion } from "@hospio/api/api/routes-legal";
import { Checkbox } from "@hospio/ui/primitives/checkbox";
import { Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, cell, tableHead, tableRow } from "@hospio/ui/shared/ui";
import { lagosToday } from "@hospio/ui/shared/links-shared";

const KEYS: { value: string; label: string }[] = [
	{ value: "TERMS", label: "Terms of Service" },
	{ value: "PRIVACY", label: "Privacy Policy" },
	{ value: "DPA", label: "Data Processing Terms" },
	{ value: "DEBIT", label: "Fees and monthly invoice" },
	{ value: "DEVICES", label: "Devices & equipment terms" },
	{ value: "SUPPORT", label: "Support & services" },
	{ value: "RPA", label: "Referral partner terms" },
	{ value: "STAFF", label: "Staff terms of use" },
];

/**
 * The versions of each legal document. The newest version whose effective date has passed is in force; people who accept that
 * document are asked to accept it at their next sign-in. A material change needs 30 days' notice (people see it as "Coming").
 */
export function LegalDocumentsScreen({ versions, error, canPublish }: { versions: LegalVersion[]; error: string | null; canPublish: boolean }) {
	const router = useRouter();
	const { run, pending } = useAction();
	const [open, setOpen] = useState(false);
	const [key, setKey] = useState("");
	const [version, setVersion] = useState("");
	const [from, setFrom] = useState(lagosToday());
	const [material, setMaterial] = useState(false);
	const [summary, setSummary] = useState("");
	const now = Date.now();
	const inForce = new Set<string>();
	const status = (v: LegalVersion) => {
		if (new Date(v.effectiveFrom).getTime() > now) return "Coming";
		if (inForce.has(v.docKey)) return "Replaced";
		inForce.add(v.docKey);
		return "In force";
	};
	return (
		<>
			<PageHeader
				title="Legal documents"
				subtitle="The versions people accept online. A new version is asked for at each person's next sign-in from its effective date."
			>
				{canPublish && (
					<button type="button" className={btn.primary} onClick={() => setOpen(true)}>
						Publish a new version
					</button>
				)}
			</PageHeader>
			{error && <Note tone="danger">{error}</Note>}
			<Note tone="info">
				The text lives on hospio360.com/legal. Publish a new version here only after the page has the new text; a material change
				needs 30 days&apos; notice.
			</Note>
			<SectionCard title="Versions" flush>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] text-left">
						<thead>
							<tr className={tableHead}>
								<th className={cell}>Document</th>
								<th className={cell}>Version</th>
								<th className={cell}>Effective</th>
								<th className={cell}>Status</th>
								<th className={cell}>Change</th>
							</tr>
						</thead>
						<tbody>
							{versions.map((v) => {
								const s = status(v);
								return (
									<tr key={v.id} className={tableRow}>
										<td className={cell}>
											<a href={`https://hospio360.com/legal/${v.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
												{v.title}
											</a>
										</td>
										<td className={cell}>{v.version}</td>
										<td className={cell}>{fmtWhen(v.effectiveFrom)}</td>
										<td className={cell}>
											<StatusPill tone={s === "In force" ? "success" : s === "Coming" ? "info" : "grey"}>{s}</StatusPill>
										</td>
										<td className={`${cell} text-[12px] text-ink-3`}>
											{v.material ? "Material · " : ""}
											{v.summary ?? "—"}
											{v.createdByName ? ` · ${v.createdByName}` : ""}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</SectionCard>
			<ConfirmModal
				open={open}
				onOpenChange={setOpen}
				title="Publish a new version"
				subtitle="Everyone who accepts this document is asked to accept the new version from its effective date"
				confirmLabel="Publish"
				pending={pending}
				confirmDisabled={!key || version.trim().length < 2}
				onConfirm={() =>
					void run(
						() => publishLegalVersion({ key, version: version.trim(), effectiveFrom: from, material, summary: summary.trim() || undefined }),
						"New version published",
						() => {
							setOpen(false);
							router.refresh();
						},
					)
				}
			>
				<div className="flex flex-col gap-3">
					<SelectField label="Document" value={key} onChange={setKey} options={KEYS} required />
					<TextField label="Version" value={version} onChange={setVersion} placeholder="e.g. TOS-2027-01" />
					<TextField label="Effective from" type="date" value={from} onChange={setFrom} />
					<TextField label="What changed (shown to people)" value={summary} onChange={setSummary} placeholder="e.g. Clause 5: new daily statement time" />
					<div className="flex items-center gap-2 text-[13px] text-ink">
						<Checkbox id="legal-material" checked={material} onCheckedChange={(v) => setMaterial(v === true)} />
						<label htmlFor="legal-material">Material change (30 days&apos; notice)</label>
					</div>
				</div>
			</ConfirmModal>
		</>
	);
}
