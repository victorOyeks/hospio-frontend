import type { LegalDoc, LegalRecord } from "@hospio/api/api/routes-legal";
import { fmtWhen } from "@hospio/ui/shared/format";
import { cell, tableHead, tableRow } from "@hospio/ui/shared/ui";

/** Acceptance records (hospio-backend docs/legal-acceptance.md), for the owner's profile and the admin's Acceptance tab. */

export const METHOD_LABELS: Record<string, string> = {
	SELF_SIGN_UP: "Self sign-up",
	FIRST_SIGN_IN: "First sign-in",
	HANDOVER: "Handover",
	RE_ACCEPTANCE: "New version",
	PORTAL: "Partner portal",
	DEVICE_PACKAGE: "Device package",
	BACK_OFFICE: "Back office",
};

export const CHANNEL_LABELS: Record<string, string> = {
	WHATSAPP: "WhatsApp",
	EMAIL: "Email",
	SMS: "SMS",
	IN_PERSON: "In person",
	PHONE_CALL: "Phone call",
	OTHER: "Other",
};

const ROLE_LABELS: Record<string, string> = { OWNER: "Owner", MARKETER: "Referral partner" };
const roleLabel = (r?: string | null) =>
	r
		? r
				.split(",")
				.map((x) => ROLE_LABELS[x] ?? x.charAt(0) + x.slice(1).toLowerCase().replace(/_/g, " "))
				.join(", ")
		: "—";

/** "Chrome on macOS" from a user agent (short; the full one is in the CSV). */
export function browserOf(ua?: string | null): string {
	if (!ua) return "—";
	const b = /Edg\//.test(ua)
		? "Edge"
		: /Firefox\//.test(ua)
			? "Firefox"
			: /Chrome\//.test(ua)
				? "Chrome"
				: /Safari\//.test(ua)
					? "Safari"
					: /^curl\//.test(ua)
						? "curl"
						: "Browser";
	const os = /iPhone|iPad/.test(ua)
		? "iOS"
		: /Android/.test(ua)
			? "Android"
			: /Windows/.test(ua)
				? "Windows"
				: /Mac OS X|Macintosh/.test(ua)
					? "macOS"
					: /Linux/.test(ua)
						? "Linux"
						: null;
	return os ? `${b} on ${os}` : b;
}

export function LegalRecordsTable({ records, empty = "No records yet" }: { records: LegalRecord[]; empty?: string }) {
	if (records.length === 0) return <p className="px-5 py-6 text-[13px] text-ink-3">{empty}</p>;
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[820px] text-left" data-testid="legal-records">
				<thead>
					<tr className={tableHead}>
						<th className={cell}>When</th>
						<th className={cell}>Who</th>
						<th className={cell}>Document</th>
						<th className={cell}>How</th>
						<th className={cell}>From</th>
					</tr>
				</thead>
				<tbody>
					{records.map((r) => (
						<tr key={r.id} className={tableRow}>
							<td className={`${cell} whitespace-nowrap text-[13px]`}>{fmtWhen(r.at)}</td>
							<td className={`${cell} text-[13px]`}>
								{r.event === "LINKS_SHARED" ? (
									<>
										<span className="font-medium text-ink">{r.recordedByName ?? "Hospio360"}</span>
										<span className="block text-[12px] text-ink-3">Hospio360 (shared the links)</span>
									</>
								) : (
									<>
										<span className="font-medium text-ink">{r.userName ?? "—"}</span>
										<span className="block text-[12px] text-ink-3">
											{roleLabel(r.role)}
											{r.userEmail ? ` · ${r.userEmail}` : ""}
										</span>
									</>
								)}
							</td>
							<td className={`${cell} text-[13px]`}>
								{r.title} <span className="text-ink-3">· {r.version}</span>
								{r.reference ? <span className="block text-[12px] text-ink-3">Package {r.reference.slice(0, 8)}</span> : null}
							</td>
							<td className={`${cell} text-[13px]`}>
								{r.event === "LINKS_SHARED" ? (
									<>
										Links shared by {CHANNEL_LABELS[r.channel ?? ""] ?? r.channel}
										{r.sharedOn ? ` on ${r.sharedOn}` : ""}
										{r.note ? <span className="block text-[12px] text-ink-3">{r.note}</span> : null}
									</>
								) : (
									<>Ticked · {METHOD_LABELS[r.method] ?? r.method}</>
								)}
							</td>
							<td className={`${cell} text-[12px] text-ink-3`}>
								{r.ip ?? "—"}
								<span className="block">{browserOf(r.userAgent)}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** The person's documents: version in force, accepted or not, and what is announced for later. */
export function MyDocuments({ required, pending, upcoming }: { required: LegalDoc[]; pending: LegalDoc[]; upcoming: LegalDoc[] }) {
	return (
		<ul className="divide-y divide-line">
			{required.map((d) => {
				const due = pending.some((p) => p.key === d.key);
				return (
					<li key={d.key} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
						<a href={d.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
							{d.title}
						</a>
						<span className={due ? "text-warning" : "text-ink-3"}>
							{d.version} · {due ? "to accept" : "accepted"}
						</span>
					</li>
				);
			})}
			{upcoming.map((d) => (
				<li key={`up-${d.key}`} className="px-5 py-3 text-[13px] text-ink-2">
					Coming: <span className="font-medium">{d.title}</span> {d.version} takes effect on {fmtWhen(d.effectiveFrom)}
					{d.summary ? ` · ${d.summary}` : ""}.{" "}
					<a href={d.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
						Read it
					</a>
				</li>
			))}
		</ul>
	);
}
