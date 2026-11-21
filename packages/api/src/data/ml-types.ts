/** Rows for expense categories, budgets, bills and receipts (plain module: server loaders and client screens share them). */

export type ExpenseCategoryRow = {
	id: string;
	code: string;
	label: string;
	active: boolean;
};
export type BudgetRow = {
	category: string;
	label: string;
	budget: number;
	spent: number;
	left: number;
	pct: number | null;
};
export type BudgetView = {
	month: string;
	rows: BudgetRow[];
	totals: { budget: number; spent: number; left: number };
};
export type BillRow = {
	id: string;
	payee: string;
	category: string;
	categoryLabel: string;
	amount: number;
	dueDate: string;
	repeats: "NONE" | "WEEKLY" | "MONTHLY";
	status: "UNPAID" | "PAID" | "CANCELLED";
	overdue: boolean;
	note?: string;
	paidAt?: string;
	paidBy?: string;
	paidFrom?: string;
	expenseId?: string;
	createdBy?: string;
	createdAt?: string;
	/** A supplier bill made from a delivery received in Inventory. */
	supplierId?: string;
	deliveryId?: string;
	purchaseOrderId?: string;
	invoiceNumber?: string;
};
/** Owed to suppliers: one row per payee. */
export type SupplierOwedRow = {
	payee: string;
	supplierId?: string;
	bills: number;
	total: number;
	overdueBills: number;
	overdue: number;
	oldestDue?: string;
	lastPaidAt?: string;
};
export type OwedView = {
	status: "UNPAID" | "OVERDUE" | "PAID";
	suppliers: SupplierOwedRow[];
	total: number;
	overdue: number;
	bills: number;
};
/** A delivery's bill as the store sees it. */
export type DeliveryBillRow = {
	id: string;
	status: "UNPAID" | "PAID" | "CANCELLED";
	overdue: boolean;
	amount: number;
	dueDate: string;
	paidAt?: string;
	paidFrom?: string;
};
export type ReceiptRow = {
	number: string;
	issuedAt?: string;
	paymentId: string;
	amount: number;
	method: string;
	reference?: string;
	takenBy?: string;
	role?: string;
	guestName?: string;
	guestPhone?: string;
	guestEmail?: string;
	description?: string;
	orderId?: string;
	folioId?: string;
	bookingId?: string;
	paidAt?: string;
	sentTo?: string;
};
