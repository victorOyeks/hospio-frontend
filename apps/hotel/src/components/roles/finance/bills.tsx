"use client";

import { PlusIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { Note } from "@hospio/ui/shared/detail-list";
import { naira } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { useListParams } from "@hospio/ui/shared/list-params";
import { btn } from "@hospio/ui/shared/ui";
import type {
	BillRow,
	ExpenseCategoryRow,
	OwedView,
} from "@hospio/api/data/ml-types";
import type { PageResult } from "@hospio/api/data/paging";
import {
	BillPanel,
	BillsTab,
	OwedToSuppliers,
} from "../shared-staff/budgets-bills";

/**
 * Finance · Bills: what the hotel owes suppliers and utilities. Supplier bills arrive by themselves when the store receives a
 * delivery (hospio-backend docs/inventory-stores.md, Supplier bills); Finance with Can edit adds and pays bills, View only reads
 * them. Owed to suppliers groups them per supplier; `?bill=` opens one (the Record expense hint links here).
 */
export function FinanceBillsScreen({
	bills,
	owed,
	categories,
	canWrite,
}: {
	bills: PageResult<BillRow>;
	owed: OwedView | null;
	categories: ExpenseCategoryRow[];
	canWrite: boolean;
}) {
	const list$ = useListParams({ extra: ["owed", "tab"] });
	const [billId, setBillId] = useQueryState("bill");
	const [open, setOpen] = useState<BillRow | null>(null);
	const [adding, setAdding] = useState(false);
	const page = bills.data;
	useEffect(() => {
		if (!billId) return;
		const b = page.content.find((x) => x.id === billId);
		if (b) setOpen(b);
	}, [billId, page.content]);
	const totals = page.totals ?? {};
	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Bills"
				subtitle={`Supplier and utility bills · ${totalLine(totals)}`}
			>
				{canWrite && (
					<Button className={btn.primary} onClick={() => setAdding(true)}>
						<PlusIcon className="size-4" /> Add bill
					</Button>
				)}
			</PageHeader>
			{!canWrite && (
				<Note tone="info">
					View only: you can see the bills; a manager, the owner or Finance
					with Can edit adds and pays them.
				</Note>
			)}
			<OwedToSuppliers
				owed={owed}
				onPick={(payee) => list$.set({ q: payee, status: null })}
			/>
			<BillsTab result={bills} onOpen={setOpen} />
			<BillPanel
				bill={open}
				adding={adding}
				categories={categories}
				canWrite={canWrite}
				onClose={() => {
					setOpen(null);
					setAdding(false);
					if (billId) void setBillId(null);
				}}
			/>
		</div>
	);
}

function totalLine(t: Record<string, unknown>) {
	const n = (k: string) => naira(Number(t[k] ?? 0));
	return `${n("unpaid")} to pay · ${n("overdue")} overdue · ${n("paidThisMonth")} paid this month`;
}
