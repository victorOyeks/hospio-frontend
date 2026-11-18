import { DeskTill } from "@/components/roles/shared-staff/desk-till";

export const dynamic = "force-dynamic";

/** Cashier · Till: the cashier's drawer. Cash the cashier takes, and a waiter's cash where waiters may take it, lands here. */
export default function CashierTillPage() {
	return <DeskTill desk="CASHIER" />;
}
