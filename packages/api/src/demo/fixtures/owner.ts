/**
 * Owner-portal sample data: the business across its four hotels. Numbers line up with
 * demoHotelSummaries (occupancy, managers) in ./hotel.
 */
import type { OwnerHotelRow, PortalUserRow } from "@hospio/api/data/types";
import { BUSINESS_ID, at, day, demoHotelSummaries } from "./hotel";

/** Kept for the owner screens; the row type now lives in data/types as OwnerHotelRow. */
export type OwnerHotelFinance = OwnerHotelRow;

const ids = demoHotelSummaries.map((h) => h.id);

export const ownerHotels: OwnerHotelRow[] = [
	{ hotelId: ids[0], name: "Ivory Court Ikeja", city: "Lagos", code: "#001", rooms: 120, occupancy: 84, manager: "Dotun Alabede", status: "ACTIVE", revenueToday: 1232000, revenueMonth: 67500000, expensesMonth: 43200000, payrollMonth: 12400000, revenueLastMonth: 61900000, onShift: 14, scheduled: 16, openIssues: 5, lastAction: "Checked in Adaeze Ibekwe · B110", lastAt: at(0, 11, 24), health: 92, posProvider: "Moniepoint", grossSettled: 48200000, posFees: 361500, nextPayout: day(1), nextPayoutAmount: 1980000, phone: "0800 000 0003", email: "ikeja@ivorycourt.example.ng" },
	{ hotelId: ids[1], name: "Ivory Court Lekki", city: "Lagos", code: "#002", rooms: 86, occupancy: 71, manager: "Oluchi Mbanefo", status: "ACTIVE", revenueToday: 840500, revenueMonth: 41200000, expensesMonth: 29800000, payrollMonth: 8900000, revenueLastMonth: 39600000, onShift: 10, scheduled: 11, openIssues: 3, lastAction: "Generator repair quote raised", lastAt: at(0, 9, 0), health: 78, posProvider: "Moniepoint", grossSettled: 30100000, posFees: 225750, nextPayout: day(1), nextPayoutAmount: 1210000, phone: "0800 000 0004", email: "lekki@ivorycourt.example.ng" },
	{ hotelId: ids[2], name: "Ivory Court Abuja", city: "Abuja", code: "#003", rooms: 64, occupancy: 62, manager: "Kabiru Shuaibu", status: "ACTIVE", revenueToday: 512000, revenueMonth: 24800000, expensesMonth: 19900000, payrollMonth: 6200000, revenueLastMonth: 26100000, onShift: 7, scheduled: 8, openIssues: 2, lastAction: "Night audit closed", lastAt: at(0, 0, 50), health: 66, posProvider: "OPay", grossSettled: 17600000, posFees: 132000, nextPayout: day(2), nextPayoutAmount: 720000, phone: "0800 000 0005", email: "abuja@ivorycourt.example.ng" },
	{ hotelId: ids[3], name: "Ivory Court Port Harcourt", city: "Port Harcourt", code: "#004", rooms: 48, occupancy: 55, manager: "Precious Ekanem", status: "RENOVATION", revenueToday: 318000, revenueMonth: 14300000, expensesMonth: 15100000, payrollMonth: 4600000, revenueLastMonth: 16900000, onShift: 5, scheduled: 6, openIssues: 6, lastAction: "Floor 2 closed for painting", lastAt: at(-1, 15, 10), health: 41, posProvider: "OPay", grossSettled: 9800000, posFees: 73500, nextPayout: day(2), nextPayoutAmount: 410000, phone: "0800 000 0006", email: "ph@ivorycourt.example.ng" },
];

export const ownerBusiness = {
	name: "Ivory Court Hotels Ltd",
	ownerName: "Kayode Ashiru",
	email: "kayode@ivorycourt.example.ng",
	phone: "0800 000 0003",
	address: "7 Oba Akinjobi Way, Ikeja GRA, Lagos",
	rcNumber: "RC 1203944",
	currency: "NGN",
	vat: 7.5,
	serviceCharge: 0,
	spendLimit: 500000,
	discountLimit: 50000,
	managerExpenseLimit: 20000,
};

/** Last 12 months, all branches, in naira. */
export const ownerTrend = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((month, i) => {
	const revenue = [152, 128, 121, 139, 131, 136, 142, 149, 151, 158, 144, 148][i] * 1_000_000;
	const expenses = Math.round(revenue * [0.72, 0.78, 0.8, 0.74, 0.76, 0.75, 0.73, 0.72, 0.71, 0.7, 0.75, 0.73][i]);
	return { month, revenue, expenses, profit: revenue - expenses };
});

/** 30 days of revenue across the business. */
export const ownerDaily = Array.from({ length: 30 }, (_, i) => {
	const d = day(i - 29);
	const base = 4_200_000 + ((i * 37) % 11) * 180_000;
	const weekend = new Date(d).getDay() === 5 || new Date(d).getDay() === 6 ? 1.22 : 1;
	return { date: d, revenue: Math.round(base * weekend) };
});

export const ownerBudgets = [
	{ category: "Salaries & wages", budget: 33000000, spent: 32100000 },
	{ category: "Utilities & diesel", budget: 18000000, spent: 21300000 },
	{ category: "Food & drink supplies", budget: 19000000, spent: 17400000 },
	{ category: "Maintenance & repairs", budget: 13500000, spent: 12500000 },
	{ category: "OTA commissions & marketing", budget: 9800000, spent: 9300000 },
	{ category: "Housekeeping supplies", budget: 8200000, spent: 7650000 },
	{ category: "Taxes & levies", budget: 5300000, spent: 5100000 },
	{ category: "Other", budget: 4500000, spent: 2550000 },
];

export const ownerRevenueSources = [
	{ source: "Rooms", amount: 115400000, share: 78, change: 7 },
	{ source: "Food & drinks", amount: 20700000, share: 14, change: 11 },
	{ source: "Events & halls", amount: 7400000, share: 5, change: 22 },
	{ source: "Laundry & other", amount: 4300000, share: 3, change: -3 },
];

export const ownerPayMix = [
	{ method: "Card / POS", pct: 46 },
	{ method: "Transfer", pct: 31 },
	{ method: "Cash", pct: 12 },
	{ method: "Online (OTA)", pct: 11 },
];

export type PayrollRow = { id: string; name: string; role: string; hotel: string; salary: number; allowances: number; deductions: number; net: number; status: "PAID" | "PENDING" | "ON_HOLD" };
export const ownerPayroll: PayrollRow[] = [
	{ id: "py-1", name: "Dotun Alabede", role: "General manager", hotel: "Ivory Court Ikeja", salary: 650000, allowances: 80000, deductions: 52000, net: 678000, status: "PAID" },
	{ id: "py-2", name: "Oluchi Mbanefo", role: "General manager", hotel: "Ivory Court Lekki", salary: 600000, allowances: 70000, deductions: 48000, net: 622000, status: "PAID" },
	{ id: "py-3", name: "Kabiru Shuaibu", role: "General manager", hotel: "Ivory Court Abuja", salary: 520000, allowances: 60000, deductions: 41600, net: 538400, status: "PAID" },
	{ id: "py-4", name: "Precious Ekanem", role: "General manager", hotel: "Ivory Court Port Harcourt", salary: 480000, allowances: 50000, deductions: 38400, net: 491600, status: "PENDING" },
	{ id: "py-5", name: "Tosin Adewole", role: "Front desk lead", hotel: "Ivory Court Ikeja", salary: 220000, allowances: 20000, deductions: 17600, net: 222400, status: "PAID" },
	{ id: "py-6", name: "Ebere Nwagbo", role: "Housekeeping supervisor", hotel: "Ivory Court Ikeja", salary: 180000, allowances: 15000, deductions: 14400, net: 180600, status: "PAID" },
	{ id: "py-7", name: "Wale Akinbode", role: "Accountant", hotel: "Ivory Court Ikeja", salary: 260000, allowances: 20000, deductions: 20800, net: 259200, status: "PAID" },
	{ id: "py-8", name: "Rukayat Oyelade", role: "Head chef", hotel: "Ivory Court Ikeja", salary: 240000, allowances: 25000, deductions: 19200, net: 245800, status: "PAID" },
	{ id: "py-9", name: "Obinna Ezeugo", role: "Technician", hotel: "Ivory Court Ikeja", salary: 160000, allowances: 15000, deductions: 12800, net: 162200, status: "PAID" },
	{ id: "py-10", name: "Ijeoma Nwabueze", role: "Room attendant", hotel: "Ivory Court Ikeja", salary: 90000, allowances: 8000, deductions: 7200, net: 90800, status: "ON_HOLD" },
];

export type { PortalUserRow };

const grant = (id: string, role: string, hotelId?: string, paused = false): PortalUserRow["grants"][number] => ({ id, role, level: "FULL", hotelId, paused });
const pu = (u: { id: string; fullName: string; email: string; phone: string; role: PortalUserRow["role"]; hotels: string[]; hotelIds: string[]; status: PortalUserRow["status"]; twoStep: boolean; lastSignIn?: string }): PortalUserRow => ({
	...u,
	userId: u.id,
	businessId: BUSINESS_ID,
	level: "FULL",
	hotel: u.hotels[0],
	grants: u.hotelIds.length ? u.hotelIds.map((h, i) => grant(`${u.id}-g${i}`, u.role, h, u.status === "PAUSED")) : [grant(`${u.id}-g0`, u.role, undefined, u.status === "PAUSED")],
	inviteStatus: u.status === "INVITED" ? "PENDING" : "ACCEPTED",
	mustChangePassword: u.status === "INVITED",
	createdAt: "2024-01-10T09:00:00Z",
});

export const ownerPortalUsers: PortalUserRow[] = [
	pu({ id: "pu-1", fullName: "Kayode Ashiru", email: "kayode@ivorycourt.example.ng", phone: "0800 000 0003", role: "OWNER", hotels: ["All hotels"], hotelIds: [], status: "ACTIVE", twoStep: true, lastSignIn: at(0, 7, 10) }),
	pu({ id: "pu-2", fullName: "Dotun Alabede", email: "dotun@ivorycourt.example.ng", phone: "0800 000 0004", role: "MANAGER", hotels: ["Ivory Court Ikeja"], hotelIds: [ids[0]], status: "ACTIVE", twoStep: false, lastSignIn: at(0, 6, 55) }),
	pu({ id: "pu-3", fullName: "Oluchi Mbanefo", email: "oluchi@ivorycourt.example.ng", phone: "0800 000 0023", role: "MANAGER", hotels: ["Ivory Court Lekki"], hotelIds: [ids[1]], status: "ACTIVE", twoStep: true, lastSignIn: at(0, 8, 20) }),
	pu({ id: "pu-4", fullName: "Kabiru Shuaibu", email: "kabiru@ivorycourt.example.ng", phone: "0800 000 0024", role: "MANAGER", hotels: ["Ivory Court Abuja"], hotelIds: [ids[2]], status: "ACTIVE", twoStep: true, lastSignIn: at(-1, 19, 5) }),
	pu({ id: "pu-5", fullName: "Precious Ekanem", email: "precious@ivorycourt.example.ng", phone: "0800 000 0025", role: "MANAGER", hotels: ["Ivory Court Port Harcourt"], hotelIds: [ids[3]], status: "ACTIVE", twoStep: true, lastSignIn: at(-2, 10, 40) }),
	pu({ id: "pu-6", fullName: "Wale Akinbode", email: "wale@ivorycourt.example.ng", phone: "0800 000 0015", role: "FINANCE", hotels: ["Ivory Court Ikeja", "Ivory Court Lekki"], hotelIds: [ids[0], ids[1]], status: "ACTIVE", twoStep: true, lastSignIn: at(0, 8, 1) }),
	pu({ id: "pu-7", fullName: "Bunmi Adeoye", email: "bunmi.adeoye@ivorycourt.example.ng", phone: "0800 000 0026", role: "FINANCE", hotels: ["All hotels"], hotelIds: [], status: "INVITED", twoStep: false }),
];

export const ownerManagerThreads = [
	{ id: "mt-1", kind: "STAFF" as const, name: "Oluchi Mbanefo", contact: "Manager · Ivory Court Lekki", channel: "IN_APP" as const, subject: "Generator repair", lastAt: at(0, 9, 2), unread: 1, preview: "Quote is ₦410,000 · can you approve today?", messages: [
		{ id: "mm-1", direction: "IN" as const, by: "Oluchi Mbanefo", at: at(0, 9, 2), body: "Good morning sir. The generator quote is ₦410,000, sent for approval. Can you approve today? We are on the small gen." },
	] },
	{ id: "mt-2", kind: "STAFF" as const, name: "Precious Ekanem", contact: "Manager · Ivory Court Port Harcourt", channel: "IN_APP" as const, subject: "Renovation update", lastAt: at(-1, 15, 20), unread: 0, preview: "Floor 2 painting done by Friday", messages: [
		{ id: "mm-2", direction: "OUT" as const, by: "Kayode Ashiru", at: at(-1, 14, 0), body: "How is floor 2 going?" },
		{ id: "mm-3", direction: "IN" as const, by: "Precious Ekanem", at: at(-1, 15, 20), body: "Painting done by Friday, rooms back on sale Monday." },
	] },
	{ id: "mt-3", kind: "STAFF" as const, name: "All managers", contact: "4 people", channel: "IN_APP" as const, subject: "Detty December pricing", lastAt: at(-3, 10, 0), unread: 0, preview: "Please send your December rate proposals by Friday", messages: [
		{ id: "mm-4", direction: "OUT" as const, by: "Kayode Ashiru", at: at(-3, 10, 0), body: "Please send your December rate proposals by Friday. Suites at ₦150,000 minimum." },
	] },
];

export const ownerWorthALook = [
	{ id: "w-1", tone: "danger" as const, title: "Ivory Court Port Harcourt is losing money", detail: "−₦800k this month · occupancy only 55%", area: "Financials", href: "/dashboard/financials?tab=pnl" },
	{ id: "w-2", tone: "warning" as const, title: "Utilities & diesel is 18% over budget", detail: "₦21.3M vs ₦18M · diesel price up again", area: "Expenses", href: "/dashboard/financials?tab=expenses" },
	{ id: "w-3", tone: "info" as const, title: "₦7.5M unpaid by organizations", detail: "Lagoon Freight ₦2.98M overdue 12 days · Deltaline ₦1.6M part paid", area: "Organizations", href: "/dashboard/financials?tab=organizations" },
	{ id: "w-4", tone: "warning" as const, title: "2 portal users have no 2-step login", detail: "Dotun Alabede · Bunmi Adeoye (invite waiting)", area: "Users", href: "/dashboard/users" },
	{ id: "w-5", tone: "info" as const, title: "₦1.3M diesel order needs your approval", detail: "PO-0229 · Ivory Court Ikeja · Obinna Ezeugo", area: "Approvals", href: "/dashboard?open=ap-4" },
];
