"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BanknoteIcon,
	CheckIcon,
	CoinsIcon,
	FileTextIcon,
	PlayIcon,
	RotateCwIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
	approveMarketerStatement,
	exportMarketerStatements,
	loadMarketerStatement,
	recordMarketerStatementPayment,
	runMarketerStatements,
} from "@hospio/api/actions/marketer-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	LoadResult,
	MarketerStatementDetail,
	MarketerStatementList,
	MarketerStatementRow,
} from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextareaField, TextField } from "@hospio/ui/shared/field";
import { nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	ExportButton,
	FilterSelect,
	Toolbar,
} from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	monthLabel,
	naira2,
	statementLabel,
	statementMeaning,
} from "../marketer/shared";
import { StatementBody, StatementPill } from "../marketer/statement-detail";
import { Loading, monthOptions, useFilterParam, useLoaded } from "./live";

const STATUS_TABS = ["DRAFT", "QUERIED", "APPROVED", "PAID", "CARRIED_OVER"];

/** The month before this one (yyyy-MM): the statements the job makes on the 5th. */
function previousMonth() {
	const d = new Date();
	d.setDate(1);
	d.setMonth(d.getMonth() - 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function saveText(text: string, name: string) {
	const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Admin · Marketers → Statements (Super admin and Finance admin): GET /platform/admin/marketer-statements by month and
 * status (`?smonth=&sstatus=&sprofile=`), counts and payable per status, the CSV export, Make statements (Super admin) and
 * one statement in a panel (`?statement=`) to approve or record its payment.
 */
export function MarketerStatementsTab({
	role,
	result,
	onChanged,
}: {
	role: AdminRole;
	result: LoadResult<MarketerStatementList>;
	onChanged: () => void;
}) {
	const [month, setMonth] = useFilterParam("smonth");
	const [status, setStatus] = useFilterParam("sstatus");
	const [profile, setProfile] = useFilterParam("sprofile");
	const [open, setOpen] = useQueryState("statement");
	const [making, setMaking] = useState(false);
	const { run, pending } = useAction();
	const { statements, counts, totals } = result.data;
	const superAdmin = role === "SUPER_ADMIN";

	const columns: ColumnDef<MarketerStatementRow, unknown>[] = [
		{
			accessorKey: "month",
			header: "Month",
			cell: ({ row }) => monthLabel(row.original.month),
		},
		{
			accessorKey: "marketerName",
			header: "Marketer",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.marketerName}
					secondary={row.original.marketerEmail}
				/>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<TwoLine
					primary={<StatementPill s={row.original} />}
					secondary={statementMeaning(row.original)}
				/>
			),
		},
		{ accessorKey: "lineCount", header: "Lines" },
		{
			accessorKey: "gross",
			header: "Gross",
			cell: ({ row }) => naira2(row.original.gross),
		},
		{
			accessorKey: "wht",
			header: "WHT",
			cell: ({ row }) => (
				<span className="text-ink-3">{naira2(-row.original.wht)}</span>
			),
		},
		{
			accessorKey: "payable",
			header: "Payable",
			cell: ({ row }) => (
				<span className="font-semibold">{naira2(row.original.payable)}</span>
			),
		},
		{
			accessorKey: "bankChecked",
			header: "Bank",
			cell: ({ row }) =>
				row.original.bankChecked ? (
					<StatusPill dot={false} tone="success">
						checked
					</StatusPill>
				) : (
					<StatusPill dot={false} tone="warning">
						to check
					</StatusPill>
				),
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="To approve"
					value={nairaShort((totals.DRAFT ?? 0) + (totals.QUERIED ?? 0))}
					icon={CheckIcon}
					hint={`${(counts.DRAFT ?? 0) + (counts.QUERIED ?? 0)} statements · ${counts.QUERIED ?? 0} queried`}
				/>
				<KpiCard
					label="To pay"
					value={nairaShort(totals.APPROVED ?? 0)}
					icon={CoinsIcon}
					hint={`${counts.APPROVED ?? 0} approved · pay by the 15th`}
				/>
				<KpiCard
					label="Paid"
					value={nairaShort(totals.PAID ?? 0)}
					icon={BanknoteIcon}
					hint={`${counts.PAID ?? 0} statements`}
				/>
				<KpiCard
					label="Carried over"
					value={nairaShort(totals.CARRIED_OVER ?? 0)}
					icon={RotateCwIcon}
					hint="Under the minimum · rolls into the next"
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "ALL", label: "All", count: counts.all ?? 0 },
							...STATUS_TABS.map((k) => ({
								key: k,
								label: statementLabel[k] ?? k,
								count: counts[k] ?? 0,
							})),
						]}
						value={status || "ALL"}
						onChange={(k) => setStatus(k === "ALL" ? null : k)}
					/>
				}
				right={
					<>
						<FilterSelect
							value={month}
							onChange={setMonth}
							all="All months"
							options={monthOptions(14)}
						/>
						{profile && (
							<button
								type="button"
								className={cn(btn.secondary, btn.small)}
								onClick={() => setProfile(null)}
							>
								All marketers
							</button>
						)}
						<ExportButton
							label="Export CSV"
							onClick={() =>
								run(
									() =>
										exportMarketerStatements({
											month: month || undefined,
											status: status || undefined,
										}),
									"Statements exported",
									(f) => saveText(f.text, f.name),
								)
							}
						/>
						{superAdmin && (
							<button
								type="button"
								className={cn(btn.primary, "flex items-center gap-2")}
								onClick={() => setMaking(true)}
							>
								<PlayIcon className="size-4" /> Make statements
							</button>
						)}
					</>
				}
			/>
			{profile && (
				<Note tone="info">
					Showing one marketer's statements
					{statements[0] ? ` (${statements[0].marketerName})` : ""}.
				</Note>
			)}
			<DataTable
				columns={columns}
				data={statements}
				pageSize={25}
				onRowClick={(r) => void setOpen(r.id)}
				emptyTitle="No statements"
				emptyHint="Statements are made on the 5th for the month before; a Super admin can also make them now."
				error={result.ok ? undefined : result.error}
			/>

			<StatementPanel
				id={open}
				onClose={() => void setOpen(null)}
				onChanged={onChanged}
			/>
			<MakeStatementsModal
				open={making}
				onClose={() => setMaking(false)}
				pending={pending}
				onMake={(m) =>
					run(
						() => runMarketerStatements(m),
						(r) =>
							`${monthLabel(r.month)}: ${r.made} made, ${r.carriedOver} carried over, ${r.skipped} skipped${r.notes.length ? ` · ${r.notes.join("; ")}` : ""}`,
						() => {
							setMaking(false);
							onChanged();
						},
					)
				}
			/>
		</div>
	);
}

function MakeStatementsModal({
	open,
	onClose,
	onMake,
	pending,
}: {
	open: boolean;
	onClose: () => void;
	onMake: (month: string) => void;
	pending: boolean;
}) {
	const [month, setMonth] = useState(previousMonth());
	useEffect(() => {
		if (open) setMonth(previousMonth());
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Make statements"
			subtitle="The job does this on the 5th for the month before; run it now for a month that has ended"
			icon={FileTextIcon}
			size="confirm"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || !/^\d{4}-\d{2}$/.test(month)}
						onClick={() => onMake(month)}
					>
						Make statements
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Month"
					type="month"
					value={month}
					onChange={setMonth}
					hint={`Default: ${monthLabel(previousMonth())}. The current month works on staging only.`}
				/>
				<WhatHappens
					items={[
						"Each marketer with lines in the month gets a statement (Ready, 7 days to query)",
						"Under ₦5,000 is carried over into their next statement",
						"Statements already made for the month are skipped",
					]}
				/>
			</div>
		</Modal>
	);
}

function StatementPanel({
	id,
	onClose,
	onChanged,
}: {
	id: string | null;
	onClose: () => void;
	onChanged: () => void;
}) {
	const { data, setData, loading, error } = useLoaded(
		id,
		loadMarketerStatement,
	);
	const [approving, setApproving] = useState(false);
	const [paying, setPaying] = useState(false);
	const s = data?.statement;
	const done = (d: MarketerStatementDetail) => {
		setData(d);
		setApproving(false);
		setPaying(false);
		onChanged();
	};
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={s ? `${s.marketerName} · ${monthLabel(s.month)}` : "Statement"}
			subtitle={
				s ? `${s.lineCount} lines · payable ${naira2(s.payable)}` : undefined
			}
			icon={FileTextIcon}
			width="lg"
			footer={
				s && (s.status === "DRAFT" || s.status === "QUERIED") ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => setApproving(true)}
					>
						{s.status === "QUERIED" ? "Answer and approve" : "Approve"}
					</button>
				) : s?.status === "APPROVED" ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => setPaying(true)}
					>
						Record payment
					</button>
				) : undefined
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{data && s && (
				<div className="flex flex-col gap-4">
					{!s.bankChecked &&
						(s.status === "DRAFT" || s.status === "QUERIED") && (
							<Note tone="warning">
								{s.marketerName}'s bank details aren't checked yet: check them on
								their profile (Marketers → open → Bank details → Mark checked)
								before approving.
							</Note>
						)}
					<StatementBody detail={data} admin />
				</div>
			)}
			{data && (
				<>
					<ApproveModal
						open={approving}
						detail={data}
						onClose={() => setApproving(false)}
						onDone={done}
					/>
					<PaymentModal
						open={paying}
						detail={data}
						onClose={() => setPaying(false)}
						onDone={done}
					/>
				</>
			)}
		</SidePanel>
	);
}

function ApproveModal({
	open,
	detail,
	onClose,
	onDone,
}: {
	open: boolean;
	detail: MarketerStatementDetail;
	onClose: () => void;
	onDone: (d: MarketerStatementDetail) => void;
}) {
	const s = detail.statement;
	const queried = s.status === "QUERIED";
	const { run, pending } = useAction();
	const [answer, setAnswer] = useState("");
	useEffect(() => {
		if (open) setAnswer("");
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Approve ${s.marketerName}'s ${monthLabel(s.month)} statement?`}
			subtitle={`Payable ${naira2(s.payable)} · to be paid by the 15th`}
			icon={CheckIcon}
			size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || (queried && answer.trim().length < 2)}
						onClick={() =>
							run(
								() =>
									approveMarketerStatement(
										s.id,
										answer.trim() || undefined,
										detail,
									),
								"Statement approved",
								onDone,
							)
						}
					>
						Approve
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				{queried && s.queryNote && (
					<Note tone="warning">
						<span className="font-semibold">{s.marketerName} asked:</span>{" "}
						{s.queryNote}
					</Note>
				)}
				<TextareaField
					label={queried ? "Your answer (required)" : "Note (optional)"}
					value={answer}
					onChange={setAnswer}
					placeholder={
						queried
							? "The missing day was a fee carried over to the 3rd; it is on this statement…"
							: undefined
					}
					hint={
						queried
							? "The marketer sees the answer on the statement."
							: undefined
					}
				/>
				{!s.bankChecked && (
					<Note tone="warning">
						The bank details aren't checked: the server will refuse until they
						are.
					</Note>
				)}
			</div>
		</Modal>
	);
}

function PaymentModal({
	open,
	detail,
	onClose,
	onDone,
}: {
	open: boolean;
	detail: MarketerStatementDetail;
	onClose: () => void;
	onDone: (d: MarketerStatementDetail) => void;
}) {
	const s = detail.statement;
	const { run, pending } = useAction();
	const today = new Date().toISOString().slice(0, 10);
	const [reference, setReference] = useState("");
	const [paidOn, setPaidOn] = useState(today);
	const [amount, setAmount] = useState("");
	useEffect(() => {
		if (!open) return;
		setReference("");
		setPaidOn(new Date().toISOString().slice(0, 10));
		setAmount(s.payable.toFixed(2));
	}, [open, s.payable]);
	const value = Number(amount.replace(/,/g, ""));
	const amountError =
		amount && Math.abs(value - s.payable) > 0.004
			? `The payment must be the whole payable, ${naira2(s.payable)}`
			: undefined;
	const dateError = paidOn > today ? "The date can't be in the future" : undefined;
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Record payment to ${s.marketerName}`}
			subtitle={`${monthLabel(s.month)} statement · ${s.bankName ?? "—"} ${s.bankAccount ?? ""} · ${s.bankAccountName ?? ""}`}
			icon={BanknoteIcon}
			size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={
							pending ||
							!reference.trim() ||
							!paidOn ||
							!!amountError ||
							!!dateError ||
							!amount
						}
						onClick={() =>
							run(
								() =>
									recordMarketerStatementPayment(
										s.id,
										{ reference: reference.trim(), paidOn, amount: value },
										detail,
									),
								`${naira2(value)} recorded · ${s.marketerName} is emailed`,
								onDone,
							)
						}
					>
						Record {naira2(s.payable)}
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Bank transfer reference"
					value={reference}
					onChange={setReference}
					placeholder="GTB-…"
					required
				/>
				<TextField
					label="Paid on"
					type="date"
					value={paidOn}
					onChange={setPaidOn}
					error={dateError}
					required
				/>
				<TextField
					label="Amount (₦)"
					value={amount}
					onChange={setAmount}
					error={amountError}
					hint="The whole payable; part payments aren't recorded"
					required
				/>
				<Note tone="info">
					WHT ({naira2(s.wht)}) is remitted to FIRS; the marketer gets an email
					with the payment.
				</Note>
			</div>
		</Modal>
	);
}
