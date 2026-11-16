import { describe, expect, test } from "bun:test";
import { type BookingRow, stayBill, withPayment } from "./types";

const stay = (over: Partial<BookingRow> = {}) =>
	({ totalAmount: 70000, paid: 0, status: "CHECKED_IN", priceKind: "NORMAL", ...over }) as BookingRow;

describe("stayBill", () => {
	test("before the folio, the booking is the bill", () => {
		expect(stayBill(stay({ status: "BOOKED", paid: 20000 }))).toEqual({ total: 70000, paid: 20000, balance: 50000, fromFolio: false });
	});
	test("with a folio, its total (extras and tax in), payments and balance are the bill", () => {
		const b = stay({ bill: { total: 87650, paid: 87650, balance: 0 } });
		expect(stayBill(b)).toEqual({ total: 87650, paid: 87650, balance: 0, fromFolio: true });
	});
	test("a cancelled booking shows what was paid as credit", () => {
		expect(stayBill(stay({ status: "CANCELLED", paid: 5000 })).balance).toBe(-5000);
	});
	test("a payment moves paid and the folio balance together", () => {
		const b = withPayment(stay({ bill: { total: 87650, paid: 0, balance: 87650 } }), 87650);
		expect(b.paid).toBe(87650);
		expect(b.bill).toEqual({ total: 87650, paid: 87650, balance: 0 });
	});
});
