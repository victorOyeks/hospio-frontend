"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ClockIcon,
	CoinsIcon,
	PencilIcon,
	ReceiptIcon,
	SendIcon,
	SparklesIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
	generateStatements,
	loadFeeRules,
	loadStatement,
	recordFeePayment,
	saveFeeRule,
	sendFeeStatement,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	FeeRuleRow,
	FeeStatementItem,
	GenerateStatementsResult,
	Paged,
} from "@hospio/api/data/admin-types";
import { feeModelLabels } from "@hospio/api/data/mappers/tenant";
import type { BusinessRow } from "@hospio/api/data/types";
import {
	FeeLockField,
	feeLockValue,
	showFeeLockError,
	useFeeLock,
} from "./business/fee-lock";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	MoneyField,
	SelectField,
	TextField,
} from "@hospio/ui/shared/field";
import {
	fmtLongDate,
	fmtWhen,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	Loading,
	monthOptions,
	thisMonth,
	useFilterParam,
	useLoaded,
	ServerPager,
	usePageParam,
	useRefresh,
} from "./live";
import { DevicesTab } from "./devices/devices-admin";
import { DailyFeesTab } from "./fees-daily";
import { InvoicesTab } from "./invoices";
import { GuestMessageBilling } from "./guest-messages";
import { can, ReadOnlyNote, StagePill } from "./shared";

const statusTone = {
	DUE: "warning",
	PART_PAID: "info",
	PAID: "success",
	OVERDUE: "danger",
} as const;
const statusLabel = {
	DUE: "Due",
	PART_PAID: "Part paid",
	PAID: "Paid",
	OVERDUE: "Overdue",
} as const;
const monthLabel = (m: string) => {
	const [y, mo] = m.split("-").map(Number);
	return new Date(y, (mo ?? 1) - 1, 1).toLocaleDateString("en-GB", {
		month: "long",
		year: "numeric",
	});
};

/**
 * Admin — D1 · Fees & billing (Figma 3305:3841): statements from GET /platform/admin/fees/statements,
 * filtered and paged on the server; the panel (D4) loads lines and payments; Record payment (D5), Send
 * statement, Generate this month and the fee model (D2/D3) write to platform-service.
 */
export function FeesScreen({
	role,
	statements,
	open: openStatements,
	monthly,
	businesses,
}: {
	role: AdminRole;
	statements: Paged<FeeStatementItem>;
	open: FeeStatementItem[];
	monthly: FeeStatementItem[];
	businesses: BusinessRow[];
}) {
	const [tab, setTab] = useFilterParam("status");
	const [month, setMonth] = useFilterParam("month");
	const [biz, setBiz] = useFilterParam("businessId");
	const [, setPage] = usePageParam();
	const [open, setOpen] = useQueryState("open");
	const [model, setModel] = useQueryState("model");
	const [generate, setGenerate] = useState(false);
	const [search, setSearch] = useState("");
	const { refresh } = useRefresh();
	const money = can.money(role);
	// One page, four jobs: each has its own tab in the URL (`?view=`) so Back and shared links land on it. Daily fees and
	// guest-message billing are read by the money roles only (the services refuse Support).
	const views = [
		{ key: "invoices", label: "Invoices" },
		...(money ? [{ key: "daily", label: "Daily fees" }] : []),
		{ key: "rules", label: "Fee rules" },
		{ key: "statements", label: "Statements", count: openStatements.length || undefined },
		...(money ? [{ key: "messages", label: "Guest messages" }] : []),
		{ key: "devices", label: "Devices" },
	];
	const [viewParam, setView] = useQueryState("view", parseAsString.withOptions({ history: "push", scroll: false }));
	const defaultView = "invoices";
	const view = views.some((v) => v.key === viewParam) ? (viewParam as string) : defaultView;
	const active = tab || "ALL";
	const due = openStatements.reduce((a, s) => a + s.outstanding, 0);
	const overdue = openStatements
		.filter((s) => s.status === "OVERDUE")
		.reduce((a, s) => a + s.outstanding, 0);
	const collected = monthly.reduce((a, s) => a + s.paidAmount, 0);
	const mrr = monthly.reduce((a, s) => a + s.feeAmount, 0);
	const bizName = useMemo(
		() => new Map(businesses.map((b) => [b.id, b])),
		[businesses],
	);

	const columns: ColumnDef<FeeStatementItem, unknown>[] = [
		{
			accessorKey: "businessName",
			header: "Business",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.businessName}
					secondary={bizName.get(row.original.businessId)?.feeModel ?? ""}
				/>
			),
		},
		{
			accessorKey: "month",
			header: "Month",
			cell: ({ row }) => monthLabel(row.original.month),
		},
		{
			accessorKey: "baseAmount",
			header: "Base",
			cell: ({ row }) => (
				<span className="text-ink-2">{naira(row.original.baseAmount)}</span>
			),
		},
		{
			accessorKey: "feeAmount",
			header: "Fee",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.feeAmount)}</span>
			),
		},
		{
			accessorKey: "paidAmount",
			header: "Paid",
			cell: ({ row }) => naira(row.original.paidAmount),
		},
		{
			accessorKey: "outstanding",
			header: "Balance",
			cell: ({ row }) => (
				<span
					className={cn(
						row.original.outstanding > 0 && "font-semibold text-danger",
					)}
				>
					{naira(row.original.outstanding)}
				</span>
			),
		},
		{
			accessorKey: "dueOn",
			header: "Due",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{row.original.dueOn ? fmtLongDate(row.original.dueOn) : "—"}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone[row.original.status]}>
					{statusLabel[row.original.status]}
				</StatusPill>
			),
		},
	];

	return (
		<>
			<PageHeader
				title="Fees & billing"
				subtitle="What businesses pay Hospio360: one monthly invoice each (platform fee, guest messages, devices), the daily fee behind it, fee rules and statements"
			>
				{money && view === "statements" && (
					<button
						type="button"
						onClick={() => setGenerate(true)}
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<SparklesIcon className="size-4" /> Generate this month
					</button>
				)}
			</PageHeader>
			{!money && (
				<ReadOnlyNote>
					Support can see invoices, statements and fee rules. Daily fees, recording payments,
					extensions, credit notes, voids, sending statements and fee rules are for Finance admin.
				</ReadOnlyNote>
			)}
			<PillTabs
				tabs={views}
				value={view}
				onChange={(k) => void setView(k === defaultView ? null : k)}
			/>
			{view === "invoices" && <InvoicesTab role={role} businesses={businesses} />}
			{view === "daily" && <DailyFeesTab role={role} businesses={businesses} />}
			{view === "rules" && (
				<FeeRulesTab
					businesses={businesses}
					money={money}
					onChange={(id) => void setModel(id)}
				/>
			)}
			{view === "messages" && <GuestMessageBilling />}
			{view === "devices" && <DevicesTab money={money} superAdmin={role === "SUPER_ADMIN"} />}
			{view === "statements" && (
				<>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<KpiCard
							label="Due now"
							value={nairaShort(due)}
							icon={ClockIcon}
							hint={plural(openStatements.length, "open statement")}
						/>
						<KpiCard
							label="Overdue"
							value={nairaShort(overdue)}
							icon={AlertTriangleIcon}
							pill={
								overdue > 0 ? (
									<StatusPill tone="danger">
										{openStatements.filter((s) => s.status === "OVERDUE").length}
									</StatusPill>
								) : undefined
							}
						/>
						<KpiCard
							label={`Collected · ${monthLabel(thisMonth()).split(" ")[0]}`}
							value={nairaShort(collected)}
							icon={CheckCircle2Icon}
							hint={plural(monthly.length, "statement")}
						/>
						<KpiCard
							label="Monthly fees (MRR)"
							value={nairaShort(mrr)}
							icon={CoinsIcon}
							hint="This month's statements"
						/>
					</div>
					<Toolbar
						left={
							<PillTabs
								tabs={[
									{ key: "ALL", label: "All" },
									{ key: "DUE", label: "Due" },
									{ key: "PART_PAID", label: "Part paid" },
									{ key: "OVERDUE", label: "Overdue" },
									{ key: "PAID", label: "Paid" },
								]}
								value={active}
								onChange={(k) => {
									setTab(k === "ALL" ? null : k);
									setPage(0);
								}}
							/>
						}
						right={
							<>
								<FilterSelect
									value={month}
									onChange={(v) => {
										setMonth(v);
										setPage(0);
									}}
									all="All months"
									options={monthOptions(14)}
								/>
								<FilterSelect
									value={biz}
									onChange={(v) => {
										setBiz(v);
										setPage(0);
									}}
									all="All businesses"
									options={businesses.map((b) => ({ value: b.id, label: b.name }))}
								/>
								<SearchBox
									value={search}
									onChange={setSearch}
									placeholder="Search this page…"
								/>
							</>
						}
					/>
					<DataTable
						columns={columns}
						data={statements.content}
						search={search}
						pageSize={statements.size}
						footer={<ServerPager bare page={statements} onPage={setPage} />}
						onRowClick={(s) => setOpen(s.id)}
						emptyTitle="No statements"
						emptyHint={
							money
								? "Generate this month's statements from the button above."
								: undefined
						}
					/>
				</>
			)}

			<StatementPanel
				id={open}
				business={bizName}
				canPay={money}
				onClose={() => void setOpen(null)}
				onChanged={refresh}
			/>
			<FeeModelModal
				open={!!model}
				onOpenChange={(o) => !o && void setModel(null)}
				businesses={businesses}
				initial={model ?? ""}
				onSaved={refresh}
			/>
			<GenerateModal
				open={generate}
				onOpenChange={setGenerate}
				businesses={businesses}
				defaultMonth={month || thisMonth()}
				onDone={refresh}
			/>
		</>
	);
}

/**
 * Fees & billing → Fee rules: how each business is charged, with Change opening the fee rule form for that business. The
 * defaults for new businesses are in Settings.
 */
function FeeRulesTab({
	businesses,
	money,
	onChange,
}: {
	businesses: BusinessRow[];
	money: boolean;
	onChange: (businessId: string) => void;
}) {
	const [search, setSearch] = useState("");
	return (
		<>
			<Toolbar
				left={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Search a business…"
					/>
				}
				right={
					<Link href="/dashboard/settings?tab=fees" className={btn.secondary}>
						Defaults for new businesses
					</Link>
				}
			/>
			<DataTable
				data={businesses}
				search={search}
				onRowClick={money ? (b) => onChange(b.id) : undefined}
				columns={[
					{
						accessorKey: "name",
						header: "Business",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={row.original.city || "—"}
							/>
						),
					},
					{
						accessorKey: "stage",
						header: "Stage",
						cell: ({ row }) => <StagePill stage={row.original.stage} />,
					},
					{ accessorKey: "feeModel", header: "Fee model" },
					{
						accessorKey: "feeValue",
						header: "Fee",
						cell: ({ row }) =>
							row.original.feeValue
								? row.original.feeModel.includes("%")
									? `${row.original.feeValue}%`
									: naira(row.original.feeValue)
								: "—",
					},
					{
						id: "change",
						header: "",
						cell: () =>
							money ? (
								<span className="flex items-center gap-1 text-[13px] font-semibold text-brand">
									<PencilIcon className="size-[14px]" /> Change
								</span>
							) : null,
					},
				]}
				emptyTitle="No businesses yet"
				emptyHint="A business gets its fee rule when it is set up under Businesses."
			/>
		</>
	);
}

function StatementPanel({
	id,
	business,
	canPay,
	onClose,
	onChanged,
}: {
	id: string | null;
	business: Map<string, BusinessRow>;
	canPay: boolean;
	onClose: () => void;
	onChanged: () => void;
}) {
	const {
		data: statement,
		setData,
		loading,
		error,
	} = useLoaded(id, loadStatement);
	const { run, pending } = useAction();
	const [pay, setPay] = useState(false);
	const [amount, setAmount] = useState<number | "">("");
	const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
	const [ref, setRef] = useState("");
	const biz = statement ? business.get(statement.businessId) : undefined;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={
				statement
					? `${statement.businessName} · ${monthLabel(statement.month)}`
					: "Statement"
			}
			subtitle={
				statement ? (
					<span className="flex items-center gap-2">
						Fee statement{" "}
						<StatusPill tone={statusTone[statement.status]}>
							{statusLabel[statement.status]}
						</StatusPill>
						{statement.sentAt ? (
							<span>· sent {fmtWhen(statement.sentAt)}</span>
						) : null}
					</span>
				) : undefined
			}
			icon={ReceiptIcon}
			width="md"
			footerInfo={
				statement
					? statement.outstanding > 0
						? `${naira(statement.outstanding)} outstanding`
						: "Settled"
					: undefined
			}
			footer={
				statement && (
					<>
						{canPay && (
							<button
								type="button"
								className={cn(btn.secondary, "flex items-center gap-2")}
								disabled={pending}
								onClick={() =>
									run(
										() =>
											withDeliveries(
												sendFeeStatement(statement.id, statement),
												`Statement for ${statement.businessName}`,
											),
										"Statement sent",
										(r) => {
											setData({ ...statement, sentAt: r.sentAt });
											onChanged();
										},
									)
								}
							>
								<SendIcon className="size-4" />{" "}
								{statement.sentAt ? "Send again" : "Send statement"}
							</button>
						)}
						{statement.outstanding > 0 && canPay && (
							<button
								type="button"
								className={btn.primary}
								onClick={() => {
									setAmount(statement.outstanding);
									setPay(true);
								}}
							>
								Record payment
							</button>
						)}
					</>
				)
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{statement && (
				<div className="flex flex-col gap-5">
					<DetailList
						columns={2}
						items={[
							{ label: "Owner", value: biz?.ownerName ?? "—" },
							{ label: "Fee model", value: biz?.feeModel ?? "—" },
							{
								label: "Due date",
								value: statement.dueOn ? fmtLongDate(statement.dueOn) : "—",
							},
							{ label: "Account manager", value: biz?.accountManager ?? "—" },
						]}
					/>
					<PanelSection title="Lines">
						<TotalsList
							rows={[
								...statement.lines.map((l) => ({
									label: `${l.hotelName} · base ${naira(l.base)}`,
									value: naira(l.fee),
								})),
								{
									label: "Fee",
									value: naira(statement.feeAmount),
									strong: statement.lines.length > 0,
								},
								{
									label: "Paid",
									value: naira(statement.paidAmount),
									tone: "success" as const,
								},
								{
									label: "Balance",
									value: naira(statement.outstanding),
									strong: true,
									tone:
										statement.outstanding > 0 ? ("danger" as const) : undefined,
								},
							]}
						/>
					</PanelSection>
					<PanelSection title="Payments">
						{statement.payments.length === 0 ? (
							<p className="text-sm text-ink-3">Nothing recorded yet.</p>
						) : (
							<ul className="divide-y divide-line rounded-xl border border-line">
								{statement.payments.map((p) => (
									<li
										key={p.id}
										className="flex items-center gap-3 px-4 py-[10px]"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{naira(p.amount)}
											</p>
											<p className="text-xs text-ink-3">
												{p.paidOn ? fmtLongDate(p.paidOn) : "—"} ·{" "}
												{p.reference || "no reference"} · {p.recordedBy}
											</p>
										</div>
									</li>
								))}
							</ul>
						)}
					</PanelSection>
					{statement.status === "OVERDUE" && (
						<Note tone="danger">
							Overdue. The business is flagged on the dashboard; Support may
							suspend it after repeated misses.
						</Note>
					)}
				</div>
			)}

			<Modal
				open={pay}
				onOpenChange={setPay}
				title="Record fee payment"
				subtitle={
					statement
						? `${statement.businessName} · ${monthLabel(statement.month)}`
						: undefined
				}
				icon={CoinsIcon}
				size="form"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setPay(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!amount || pending || !statement}
							onClick={() =>
								statement &&
								run(
									() =>
										recordFeePayment(
											statement.id,
											{
												amount: Number(amount),
												paidOn: paidOn || undefined,
												reference: ref || undefined,
											},
											statement,
										),
									`${naira(Number(amount))} recorded`,
									(s) => {
										setData(s);
										setPay(false);
										setRef("");
										onChanged();
									},
								)
							}
						>
							Record {amount ? naira(Number(amount)) : ""}
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<MoneyField
						label="Amount received"
						value={amount}
						onChange={setAmount}
						hint={
							statement ? `Balance ${naira(statement.outstanding)}` : undefined
						}
					/>
					<TextField
						label="Received on"
						type="date"
						value={paidOn}
						onChange={setPaidOn}
					/>
					<TextField
						label="Reference"
						value={ref}
						onChange={setRef}
						placeholder="Bank reference or settlement id"
					/>
				</div>
			</Modal>
		</SidePanel>
	);
}

function FeeModelModal({
	open,
	onOpenChange,
	businesses,
	initial,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businesses: BusinessRow[];
	initial: string;
	onSaved: () => void;
}) {
	const { run, pending } = useAction();
	const [bizId, setBizId] = useState(initial || businesses[0]?.id || "");
	const [rules, setRules] = useState<FeeRuleRow[] | null>(null);
	// One fee model (a share of daily sales, billed on the monthly invoice): a rule only sets the rate.
	const model = "PERCENT_OF_SALES";
	// Fee lock: the platform default unless a signed addendum says otherwise.
	const lock = useFeeLock(null, null);
	const { reset } = lock;
	const [from, setFrom] = useState(`${thisMonth()}-01`);
	useEffect(() => {
		if (initial) setBizId(initial);
	}, [initial]);
	useEffect(() => {
		if (!open || !bizId) return;
		setRules(null);
		loadFeeRules(bizId).then((r) => {
			if (!r.ok) return;
			setRules(r.data);
			// Newest first (GET /fees/rules is ordered by startsOn, latest first).
			const current = r.data[0];
			const b = businesses.find((x) => x.id === bizId);
			const onSales = (current?.model ?? b?.feeModelKey) === model;
			reset(
				onSales ? (current?.value ?? b?.feeValue ?? null) : null,
				onSales ? (current?.addendumRef ?? b?.feeAddendumRef) : null,
			);
		});
	}, [open, bizId, businesses]);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Fee rate"
			subtitle="A share of each day's sales, billed on the business's Hospio360 monthly invoice · a new rate applies from the date given"
			icon={PencilIcon}
			size="form"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || !bizId || !from}
						onClick={() => {
							const fee = feeLockValue(lock);
							if (!fee) return;
							run(
								async () => {
									const saved = await saveFeeRule({
										businessId: bizId,
										model,
										value: fee.feeValue,
										startsOn: from,
										feeAddendumRef: fee.feeAddendumRef,
									});
									if (!saved.ok) showFeeLockError(lock, saved.error);
									return saved;
								},
								"Fee rate saved",
								() => {
									onOpenChange(false);
									onSaved();
								},
							);
						}}
					>
						Save rate
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Business"
					value={bizId}
					onChange={setBizId}
					options={businesses.map((b) => ({
						value: b.id,
						label: b.name,
						hint: `${b.rooms} rooms · ${b.feeModel}`,
					}))}
				/>
				{rules === null ? (
					<Loading label="Loading current rules…" />
				) : rules.length > 0 ? (
					<PanelSection title="Rules so far">
						<ul className="divide-y divide-line rounded-xl border border-line text-[13px]">
							{rules.map((r) => (
								<li
									key={r.id}
									className="flex items-center justify-between px-4 py-2"
								>
									<span>{feeModelLabels[r.model] ?? r.model}</span>
									<span className="text-ink-2">
										{r.model === "PER_ROOM_NIGHT"
											? naira(r.value)
											: `${r.value}%`}{" "}
										· from {r.startsOn ? fmtLongDate(r.startsOn) : "—"}
										{r.endsOn ? ` to ${fmtLongDate(r.endsOn)}` : ""}
										{r.addendumRef ? ` · addendum ${r.addendumRef}` : ""}
									</span>
								</li>
							))}
						</ul>
					</PanelSection>
				) : (
					<Note tone="info">
						No fee rule yet. The business is not charged until one starts.
					</Note>
				)}
				<FeeLockField lock={lock} />
				<TextField
					label="Applies from"
					type="date"
					value={from}
					onChange={setFrom}
				/>
			</div>
		</Modal>
	);
}

function GenerateModal({
	open,
	onOpenChange,
	businesses,
	defaultMonth,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	businesses: BusinessRow[];
	defaultMonth: string;
	onDone: () => void;
}) {
	const { run, pending } = useAction();
	const [month, setMonth] = useState(defaultMonth);
	const [bizId, setBizId] = useState("");
	const [result, setResult] = useState<GenerateStatementsResult | null>(null);
	useEffect(() => {
		if (open) {
			setMonth(defaultMonth);
			setResult(null);
		}
	}, [open, defaultMonth]);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title="Generate statements"
			subtitle="One statement per live business for the month, from its fee model; businesses that already have one are skipped"
			icon={SparklesIcon}
			size="form"
			footer={
				result ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => onOpenChange(false)}
					>
						Done
					</button>
				) : (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !month}
							onClick={() =>
								run(
									() =>
										generateStatements({
											month,
											businessId: bizId || undefined,
										}),
									"Statements generated",
									(r) => {
										setResult(r);
										onDone();
									},
								)
							}
						>
							Generate
						</button>
					</>
				)
			}
		>
			{result ? (
				<div className="flex flex-col gap-3">
					<TotalsList
						rows={[
							{ label: "Created", value: result.created, tone: "success" },
							{ label: "Skipped", value: result.skipped },
						]}
					/>
					{result.notes.length > 0 && (
						<ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-2">
							{result.notes.map((note) => (
								<li key={note}>{note}</li>
							))}
						</ul>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<SelectField
						label="Month"
						value={month}
						onChange={setMonth}
						options={monthOptions(6)}
					/>
					<SelectField
						label="Only this business"
						value={bizId}
						onChange={setBizId}
						placeholder="Every live business"
						options={businesses.map((b) => ({ value: b.id, label: b.name }))}
						hint="Leave empty for every LIVE and AT_RISK business."
					/>
				</div>
			)}
		</Modal>
	);
}
