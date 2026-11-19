import type { z } from "zod";
import type { MonthlyInvoice, MonthlyInvoiceRow } from "@hospio/api/api/routes-billing";

/**
 * Demo mode: one Hospio360 monthly invoice for Ivory Court Hotels (last month, due on the 8th) so Billing & invoices and the
 * admin Invoices tab can be walked through without the services. Made-up figures; nothing here is real.
 */

type Invoice = z.infer<typeof MonthlyInvoice>;
type Row = z.infer<typeof MonthlyInvoiceRow>;

function lastMonth() {
	const d = new Date();
	const m = new Date(d.getFullYear(), d.getMonth() - 1, 1);
	const month = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
	const label = m.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
	const thisMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
	return { month, label, thisMonth };
}

export function demoInvoice(): Invoice {
	const { month, label, thisMonth } = lastMonth();
	const platform = 63_450;
	const messages = 4_200;
	const devices = 25_000;
	const total = platform + messages + devices;
	return {
		id: "demo-hin-1",
		number: `HIN-${month.replace("-", "")}-0001`,
		businessId: "demo-business",
		businessName: "Ivory Court Hotels",
		month,
		monthLabel: label,
		issuedOn: `${thisMonth}-01`,
		dueOn: `${thisMonth}-08`,
		graceUntil: `${thisMonth}-11`,
		lastDay: `${thisMonth}-11`,
		restrictFrom: `${thisMonth}-12T05:00:00Z`,
		status: "DUE",
		displayStatus: "DUE",
		sections: { platform, messages, devices, carriedIn: 0, adjustments: 0 },
		vatPct: 0,
		vatAmount: 0,
		total,
		paidAmount: 0,
		outstanding: total,
		paidAt: null,
		paidVia: null,
		extendedUntil: null,
		extensionReason: null,
		extendedByName: null,
		restricted: false,
		restrictedAt: null,
		carriedIntoNumber: null,
		voidReason: null,
		reissueOfNumber: null,
		replacedByNumber: null,
		canPay: true,
		lines: [
			{
				id: "l1",
				section: "PLATFORM",
				hotelId: "demo-hotel-1",
				hotelName: "Ivory Court Ikeja",
				label: `Platform fee · ${label}`,
				detail: "1.5% of sales (VAT excluded)",
				baseAmount: 4_230_000,
				rate: 1.5,
				amount: platform,
				sourceType: "DAILY_FEES",
				sourceId: null,
				createdByName: null,
				createdAt: null,
			},
			{
				id: "l2",
				section: "MESSAGES",
				hotelId: "demo-hotel-1",
				hotelName: "Ivory Court Ikeja",
				label: `Guest messages · MSG-${month.replace("-", "")}-0001`,
				detail: "120 emails, 60 WhatsApp",
				baseAmount: null,
				rate: null,
				amount: messages,
				sourceType: "COMM_INVOICE",
				sourceId: null,
				createdByName: null,
				createdAt: null,
			},
			{
				id: "l3",
				section: "DEVICES",
				hotelId: "demo-hotel-1",
				hotelName: "Ivory Court Ikeja",
				label: "Devices · instalment 2 of 6",
				detail: null,
				baseAmount: null,
				rate: null,
				amount: devices,
				sourceType: "DEVICE_INVOICE",
				sourceId: null,
				createdByName: null,
				createdAt: null,
			},
		],
		payments: [],
		events: [
			{
				id: "e1",
				kind: "ISSUED",
				onDate: `${thisMonth}-01`,
				recipient: "owner@example.ng",
				outcome: "EMAILED",
				note: null,
				actorName: null,
				createdAt: null,
			},
		],
	};
}

export function demoInvoiceRow(): Row {
	const i = demoInvoice();
	return {
		id: i.id,
		number: i.number,
		businessId: i.businessId,
		businessName: i.businessName,
		month: i.month,
		monthLabel: i.monthLabel,
		issuedOn: i.issuedOn,
		dueOn: i.dueOn,
		lastDay: i.lastDay,
		status: i.status,
		displayStatus: i.displayStatus,
		sections: i.sections,
		total: i.total,
		paidAmount: i.paidAmount,
		outstanding: i.outstanding,
		restricted: i.restricted,
		extendedUntil: i.extendedUntil,
	};
}
