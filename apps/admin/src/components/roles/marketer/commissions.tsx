"use client";

import {
	BanknoteIcon,
	CalendarIcon,
	CoinsIcon,
	FileTextIcon,
	RotateCwIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	loadMyStatement,
	queryMyStatement,
} from "@hospio/api/actions/marketer";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	LoadResult,
	MarketerMeData,
	MarketerStatementRow,
	MyStatementsData,
} from "@hospio/api/data/admin-types";
import { Note } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { TextareaField } from "@hospio/ui/shared/field";
import { nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { Loading, useLoaded } from "../admin/live";
import { AgreementTerms } from "./agreement";
import { BankDetailsCard } from "./bank";
import { monthLabel, naira2, statementMeaning } from "./shared";
import {
	StatementBody,
	StatementLinesTable,
	StatementPill,
} from "./statement-detail";

/**
 * Marketer — Commissions, statements first: GET /platform/marketer/statements (my statements and the lines waiting for
 * the next one), one statement in a panel (`?open=`) with Raise a query while it can be queried, and my bank details.
 */
export function MarketerCommissions({
	me: initialMe,
	result,
}: {
	me: MarketerMeData;
	result: LoadResult<MyStatementsData>;
}) {
	const router = useRouter();
	const [me, setMe] = useState(initialMe);
	useEffect(() => setMe(initialMe), [initialMe]);
	const [open, setOpen] = useQueryState("open");
	const p = me.profile;
	const { statements, nextStatement } = result.data;
	const nextNet = nextStatement.reduce((a, l) => a + l.net, 0);

	return (
		<>
			<PageHeader
				title="Commissions"
				subtitle={`${p.sharePct}% of the platform fee collected from each business you refer, for ${p.months} months · ${me.whtPct}% WHT deducted · a statement on the 5th, paid by the 15th`}
			/>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Next statement so far"
					value={nairaShort(me.totals.nextStatement || nextNet)}
					icon={CalendarIcon}
					hint="Statement on the 5th"
				/>
				<KpiCard
					label="Due to you"
					value={nairaShort(me.totals.due)}
					icon={CoinsIcon}
					hint="Approved statements are paid by the 15th"
				/>
				<KpiCard
					label="Paid so far"
					value={nairaShort(me.totals.paid)}
					icon={BanknoteIcon}
				/>
				<KpiCard
					label="Carried over"
					value={nairaShort(me.totals.carried)}
					icon={RotateCwIcon}
					hint={`Under ${naira2(me.minimumPayout).replace(".00", "")} · rolls into the next statement`}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_380px]">
				<SectionCard
					title="Statements"
					subtitle="One a month, made on the 5th for the month before"
					count={statements.length}
					flush
				>
					{!result.ok ? (
						<EmptyState
							title="Your statements didn't load"
							hint={result.error}
							className="mx-5 mb-5"
						>
							<button
								type="button"
								onClick={() => router.refresh()}
								className={cn(btn.secondary, btn.small, "mt-2")}
							>
								Try again
							</button>
						</EmptyState>
					) : statements.length === 0 ? (
						<EmptyState
							title="No statements yet"
							hint="Your first statement is made on the 5th after a fee is collected from a business you referred."
							className="mx-5 mb-5"
						/>
					) : (
						<StatementList rows={statements} onOpen={(id) => setOpen(id)} />
					)}
				</SectionCard>
				<div className="flex flex-col gap-4">
					<BankDetailsCard
						profile={p}
						onSaved={(profile) => setMe({ ...me, profile })}
					/>
					<SectionCard title="How you are paid" bodyClassName="pt-2">
						<AgreementTerms me={me} />
					</SectionCard>
				</div>
			</div>

			<SectionCard
				title="Next statement so far"
				subtitle={`Lines earned since your last statement · ${naira2(nextNet)} net so far`}
				bodyClassName="pt-2"
			>
				<StatementLinesTable
					lines={nextStatement}
					empty="Nothing yet: lines appear as fees are collected from the businesses you referred."
				/>
			</SectionCard>

			<MyStatementPanel id={open} onClose={() => void setOpen(null)} />
		</>
	);
}

function StatementList({
	rows,
	onOpen,
}: {
	rows: MarketerStatementRow[];
	onOpen: (id: string) => void;
}) {
	return (
		<ul className="divide-y divide-line border-t border-line">
			{rows.map((s) => (
				<li key={s.id}>
					<button
						type="button"
						onClick={() => onOpen(s.id)}
						className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-subtle/60"
					>
						<FileTextIcon className="size-4 shrink-0 text-ink-3" />
						<div className="min-w-0 flex-1">
							<p className="text-[13px] font-semibold text-ink">
								{monthLabel(s.month)}
							</p>
							<p className="truncate text-xs text-ink-3">
								{statementMeaning(s)}
							</p>
						</div>
						<span className="text-[13px] font-semibold text-ink">
							{naira2(s.payable)}
						</span>
						<StatementPill s={s} />
					</button>
				</li>
			))}
		</ul>
	);
}

function MyStatementPanel({
	id,
	onClose,
}: {
	id: string | null;
	onClose: () => void;
}) {
	const { data, setData, loading, error } = useLoaded(id, loadMyStatement);
	const { run, pending } = useAction();
	const [asking, setAsking] = useState(false);
	const [note, setNote] = useState("");
	useEffect(() => {
		setAsking(false);
		setNote("");
	}, [id]);
	const s = data?.statement;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={s ? `Statement · ${monthLabel(s.month)}` : "Statement"}
			subtitle={s ? `${s.lineCount} ${s.lineCount === 1 ? "line" : "lines"} · payable ${naira2(s.payable)}` : undefined}
			icon={FileTextIcon}
			width="lg"
			footer={
				s?.canQuery && !asking ? (
					<button
						type="button"
						className={btn.secondary}
						onClick={() => setAsking(true)}
					>
						Raise a query
					</button>
				) : asking && data ? (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setAsking(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || note.trim().length < 5}
							onClick={() =>
								run(
									() => queryMyStatement(data.statement.id, note.trim(), data),
									"Query sent to Hospio360",
									(d) => {
										setData(d);
										setAsking(false);
										setNote("");
									},
								)
							}
						>
							Send query
						</button>
					</>
				) : undefined
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{data && (
				<div className="flex flex-col gap-5">
					{asking && (
						<PanelSection title="Raise a query">
							<TextareaField
								label="What looks wrong?"
								value={note}
								onChange={setNote}
								placeholder="A day's fee from Ivory Court Hotels is missing…"
								hint="Hospio360 answers before approving the statement."
							/>
						</PanelSection>
					)}
					<StatementBody detail={data} />
				</div>
			)}
		</SidePanel>
	);
}
