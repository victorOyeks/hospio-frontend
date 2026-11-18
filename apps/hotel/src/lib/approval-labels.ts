import type { SaleRequestView } from "@hospio/api/actions/bill";

/**
 * Readable names for approvals. Requests from the floor (hospio-backend docs/plan-venue-type.md, phase 4) are platform approvals
 * of kind VOID, DISCOUNT or COMPLIMENTARY from the FNB module; any kind not listed reads as its code in words.
 */
const KIND: Record<string, string> = {
	VOID: "Void",
	DISCOUNT: "Discount",
	COMPLIMENTARY: "Complimentary",
};
const SOURCE: Record<string, string> = { FNB: "Restaurant & bar" };

const words = (code: string) => {
	const s = code.toLowerCase().replace(/_/g, " ");
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export const approvalKindLabel = (kind: string) => KIND[kind] ?? words(kind);
export const approvalSourceLabel = (module: string) => SOURCE[module] ?? words(module);

/** A void, discount or complimentary item asked for from an outlet screen. */
export const isFloorApproval = (kind: string) => kind in KIND;

/** What approving a request from the floor does, for the "what happens" list. */
export function floorApprovalEffects(kind: string): string[] | null {
	const late = "If the sale was paid or closed in the meantime nothing changes, and the request says so";
	switch (kind) {
		case "VOID":
			return ["The item or sale is cancelled on the bill and listed in the Voids & discounts report under your name", late];
		case "DISCOUNT":
			return ["The discount comes off the bill at once and the person who asked is told", late];
		case "COMPLIMENTARY":
			return ["The item is given free on the bill, with its worth in the Voids & discounts report", late];
		default:
			return null;
	}
}

/** One dashboard line for a request from the floor: who, what, which sale and where. */
export function floorRequestTitle(r: SaleRequestView): string {
	const what = r.summary?.trim() || approvalKindLabel(r.kind.replace(/_(LINE|BILL|SALE)$/, "").replace(/^COMP$/, "COMPLIMENTARY"));
	return `${r.requestedByName ?? "Someone"}: ${what}${r.orderNumber ? ` on ${r.orderNumber}` : ""}${r.outletName ? ` at ${r.outletName}` : ""}`;
}
