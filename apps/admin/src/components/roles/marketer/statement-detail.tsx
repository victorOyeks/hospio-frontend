"use client";

import type {
	MarketerStatementDetail,
	MarketerStatementRow,
	StatementLineItem,
} from "@hospio/api/data/admin-types";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { fmtLongDate, fmtWhen } from "@hospio/ui/shared/format";
import { PanelSection } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	monthLabel,
	naira2,
	statementLabel,
	statementMeaning,
	statementTone,
} from "./shared";

export function StatementPill({ s }: { s: MarketerStatementRow }) {
	return (
		<span className="inline-flex flex-wrap items-center gap-1">
			<StatusPill tone={statementTone[s.status] ?? "grey"}>
				{statementLabel[s.status] ?? s.status}
			</StatusPill>
			{s.finalStatement && (
				<StatusPill tone="warning">Final statement</StatusPill>
			)}
		</span>
	);
}

/** A statement's money, top to bottom: gross, clawback, WHT, net, carried in, payable. */
export function StatementTotals({ s }: { s: MarketerStatementRow }) {
	return (
		<TotalsList
			rows={[
				{ label: "Fees collected", value: naira2(s.feesCollected) },
				{ label: "Your commission (gross)", value: naira2(s.gross) },
				...(s.clawback
					? [
							{
								label: "Clawback (refunded fees)",
								value: naira2(s.clawback),
								tone: "danger" as const,
							},
						]
					: []),
				{ label: "Withholding tax", value: naira2(-s.wht) },
				{ label: "Net", value: naira2(s.net) },
				...(s.carriedIn
					? [{ label: "Carried in from earlier", value: naira2(s.carriedIn) }]
					: []),
				{ label: "Payable", value: naira2(s.payable), strong: true },
			]}
		/>
	);
}

/** Commission lines as a compact table: date, business, fee, share, WHT, net; clawbacks marked. */
export function StatementLinesTable({
	lines,
	showBusiness = true,
	empty = "No lines.",
}: {
	lines: StatementLineItem[];
	showBusiness?: boolean;
	empty?: string;
}) {
	if (lines.length === 0) return <p className="text-sm text-ink-3">{empty}</p>;
	return (
		<div className="overflow-x-auto rounded-xl border border-line">
			<table className="w-full text-left">
				<thead>
					<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-3 py-2">Fee day</th>
						{showBusiness && <th className="px-3 py-2">Business</th>}
						<th className="px-3 py-2 text-right">Fee collected</th>
						<th className="px-3 py-2 text-right">Share</th>
						<th className="px-3 py-2 text-right">WHT</th>
						<th className="px-3 py-2 text-right">Net</th>
					</tr>
				</thead>
				<tbody>
					{lines.map((l) => (
						<tr
							key={l.id}
							className="border-b border-line text-[13px] last:border-b-0"
						>
							<td className="px-3 py-2">
								{l.feeDate ? fmtLongDate(l.feeDate) : (l.month ?? "—")}
								{l.source === "CLAWBACK" && (
									<StatusPill tone="danger" dot={false} className="ml-2">
										clawback
									</StatusPill>
								)}
								{l.note && <p className="text-xs text-ink-3">{l.note}</p>}
							</td>
							{showBusiness && (
								<td className="px-3 py-2">{l.businessName}</td>
							)}
							<td className="px-3 py-2 text-right text-ink-2">
								{naira2(l.feeCollected)}
							</td>
							<td className="px-3 py-2 text-right">
								{naira2(l.gross)}
								<span className="text-xs text-ink-3"> · {l.sharePct}%</span>
							</td>
							<td className="px-3 py-2 text-right text-ink-3">
								{naira2(-l.wht)}
							</td>
							<td className="px-3 py-2 text-right font-semibold">
								{naira2(l.net)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * One statement's body (marketer portal and admin): what its status means, the money, lines per business, the query and
 * its answer, the payment and statements carried into it. Actions live in the caller's footer.
 */
export function StatementBody({
	detail,
	admin = false,
}: {
	detail: MarketerStatementDetail;
	admin?: boolean;
}) {
	const s = detail.statement;
	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center gap-2 text-[13px] text-ink-2">
				<StatementPill s={s} />
				<span>{statementMeaning(s)}</span>
			</div>
			<StatementTotals s={s} />
			{s.queryNote && (
				<PanelSection title="Query">
					<Note tone="warning">
						<span className="font-semibold">
							{admin ? `${s.marketerName} asked` : "You asked"}
							{s.queriedAt ? ` (${fmtWhen(s.queriedAt)})` : ""}:
						</span>{" "}
						{s.queryNote}
					</Note>
					{s.queryAnswer && (
						<Note tone="info">
							<span className="font-semibold">Hospio360 answered:</span>{" "}
							{s.queryAnswer}
						</Note>
					)}
				</PanelSection>
			)}
			{(s.approvedAt || s.paidOn) && (
				<PanelSection title="Approval and payment">
					<DetailList
						columns={2}
						items={[
							{
								label: "Approved",
								value: s.approvedAt
									? `${fmtLongDate(s.approvedAt)}${s.approvedByName ? ` · ${s.approvedByName}` : ""}`
									: "—",
							},
							{
								label: "Paid",
								value: s.paidOn
									? `${naira2(s.paidAmount ?? s.payable)} on ${fmtLongDate(s.paidOn)}`
									: "Not yet",
							},
							{ label: "Reference", value: s.paidReference ?? "—" },
							...(admin
								? [
										{
											label: "Recorded by",
											value: s.paidRecordedName ?? "—",
										},
									]
								: []),
						]}
					/>
				</PanelSection>
			)}
			{admin && (
				<PanelSection title="Pay to">
					<DetailList
						columns={2}
						items={[
							{
								label: "Account",
								value: s.bankName
									? `${s.bankName} · ${s.bankAccount ?? "—"} · ${s.bankAccountName ?? "—"}`
									: "No bank details",
							},
							{
								label: "Bank details",
								value: s.bankChecked ? (
									<StatusPill tone="success">Checked</StatusPill>
								) : (
									<StatusPill tone="warning">Not checked</StatusPill>
								),
							},
						]}
					/>
				</PanelSection>
			)}
			{detail.businesses.length > 0 && (
				<PanelSection title="By business">
					<TotalsList
						rows={detail.businesses.map((b) => ({
							label: `${b.businessName} · ${b.lines} ${b.lines === 1 ? "line" : "lines"} · fees ${naira2(b.feesCollected)}`,
							value: naira2(b.net),
						}))}
					/>
				</PanelSection>
			)}
			<PanelSection title={`Lines · ${detail.lines.length}`}>
				<StatementLinesTable lines={detail.lines} />
			</PanelSection>
			{detail.carriedFrom.length > 0 && (
				<PanelSection title="Carried in">
					<TotalsList
						rows={detail.carriedFrom.map((c) => ({
							label: `${monthLabel(c.month)} statement (under the minimum)`,
							value: naira2(c.payable),
						}))}
					/>
				</PanelSection>
			)}
		</div>
	);
}
