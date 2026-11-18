import type { LucideIcon } from "lucide-react";
import {
	BedDoubleIcon,
	BriefcaseIcon,
	ChefHatIcon,
	CoinsIcon,
	ConciergeBellIcon,
	HandPlatterIcon,
	HeadsetIcon,
	LayoutDashboardIcon,
	MegaphoneIcon,
	PackageIcon,
	ReceiptIcon,
	ShieldAlertIcon,
	SprayCanIcon,
	WashingMachineIcon,
	WineIcon,
	WrenchIcon,
} from "lucide-react";

/** The roles the backend issues. Owner and manager are hotel-wide; the rest are the modules; the last four are Hospio360. */
export const HOTEL_ROLES = [
	"OWNER",
	"MANAGER",
	"FRONT_OFFICE",
	"HOUSEKEEPING",
	"LAUNDRY",
	"MAINTENANCE",
	"KITCHEN",
	"BAR",
	"INVENTORY",
	"FINANCE",
	"WAITER",
	"CASHIER",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
] as const;

export type HotelRole = (typeof HOTEL_ROLES)[number];

export function isHotelRole(value: string): value is HotelRole {
	return (HOTEL_ROLES as readonly string[]).includes(value);
}

/** Where each role lives. `/dashboard/*` is rewritten to this prefix by the middleware. */
export const rolePaths: Record<HotelRole, string> = {
	OWNER: "/hotel-owner",
	MANAGER: "/manager",
	FRONT_OFFICE: "/front-desk",
	HOUSEKEEPING: "/housekeeping",
	LAUNDRY: "/laundry",
	MAINTENANCE: "/maintenance",
	KITCHEN: "/kitchen",
	BAR: "/bar",
	INVENTORY: "/inventory",
	FINANCE: "/financials",
	WAITER: "/waiter",
	CASHIER: "/cashier",
	SUPER_ADMIN: "/admin",
	SUPPORT: "/admin",
	FINANCE_ADMIN: "/admin",
	MARKETER: "/marketer",
};

export const roleLabels: Record<HotelRole, string> = {
	OWNER: "Hotel owner",
	MANAGER: "Manager",
	FRONT_OFFICE: "Front office",
	HOUSEKEEPING: "Housekeeping",
	LAUNDRY: "Laundry",
	MAINTENANCE: "Maintenance",
	KITCHEN: "Kitchen",
	BAR: "Bar",
	INVENTORY: "Inventory",
	FINANCE: "Finance",
	WAITER: "Waiter",
	CASHIER: "Cashier",
	SUPER_ADMIN: "Super admin",
	SUPPORT: "Support",
	FINANCE_ADMIN: "Finance admin",
	MARKETER: "Marketer",
};

export const roleDescriptions: Record<HotelRole, string> = {
	OWNER: "Every hotel in your business, approvals and reports",
	MANAGER: "Run this hotel: rooms, bookings, staff, money",
	FRONT_OFFICE: "Arrivals, departures, folios and payments",
	HOUSEKEEPING: "Rooms to clean, inspections, linen and minibar",
	LAUNDRY: "Guest laundry and hotel linen",
	MAINTENANCE: "Repairs, scheduled jobs and spare parts",
	KITCHEN: "Orders, tickets and the menu",
	BAR: "Sales, tabs and bar stock",
	INVENTORY: "Stores, stock, orders and deliveries",
	FINANCE: "Today's money, expenses, tills and night audit",
	WAITER: "Take orders, open tabs and serve tables",
	CASHIER: "Take payments, keep the till and print receipts",
	SUPER_ADMIN: "Everything on the platform",
	SUPPORT: "Onboarding, support and hotel setup",
	FINANCE_ADMIN: "Fees, statements and marketer commissions",
	MARKETER: "Businesses you referred and your commissions",
};

export const roleIcons: Record<HotelRole, LucideIcon> = {
	OWNER: BriefcaseIcon,
	MANAGER: LayoutDashboardIcon,
	FRONT_OFFICE: ConciergeBellIcon,
	HOUSEKEEPING: SprayCanIcon,
	LAUNDRY: WashingMachineIcon,
	MAINTENANCE: WrenchIcon,
	KITCHEN: ChefHatIcon,
	BAR: WineIcon,
	INVENTORY: PackageIcon,
	FINANCE: CoinsIcon,
	WAITER: HandPlatterIcon,
	CASHIER: ReceiptIcon,
	SUPER_ADMIN: ShieldAlertIcon,
	SUPPORT: HeadsetIcon,
	FINANCE_ADMIN: CoinsIcon,
	MARKETER: MegaphoneIcon,
};

/** Roles that use the desktop web app. Staff roles sign in on the tablets. */
export const DESKTOP_ROLES: HotelRole[] = [
	"OWNER",
	"MANAGER",
	"FRONT_OFFICE",
	"INVENTORY",
	"FINANCE",
	"SUPER_ADMIN",
	"SUPPORT",
	"FINANCE_ADMIN",
	"MARKETER",
];

export const PLATFORM_ROLES: HotelRole[] = ["SUPER_ADMIN", "SUPPORT", "FINANCE_ADMIN"];

export { BedDoubleIcon };

// ---- What each role allows, by level ------------------------------------------------------------

/**
 * One module of a role: what View only allows, what Can edit adds and what Full adds on top. Levels are
 * cumulative (Full includes Can edit includes View only). Taken from the services' guards, not from the
 * designs: `@access.has(ROLE)` is View only, `@access.atLeast(ROLE,'EDIT')` Can edit, `atLeast(ROLE,'FULL')`
 * or a FULL check in the service is Full. Managers and the owner pass every one of these checks.
 */
export type RolePermissionModule = { key: string; name: string; view: string[]; edit: string[]; full: string[] };

export const ROLE_PERMISSIONS: Partial<Record<HotelRole, RolePermissionModule[]>> = {
	FRONT_OFFICE: [
		// reservation BookingController.create/change/checkIn/checkOut atLeast EDIT; cancel atLeast FULL
		{ key: "bookings", name: "Bookings & guests", view: ["See bookings, arrivals and guests"], edit: ["Create and change bookings", "Check guests in and out", "Add and edit guests"], full: ["Cancel a booking"] },
		// folio FolioController.charge/send/discount EDIT (discount goes for approval); moveLines FULL
		{ key: "folios", name: "Folios", view: ["See folios and balances"], edit: ["Post charges", "Email a folio", "Offer a discount (a manager approves it)"], full: ["Move charges between folios"] },
		{ key: "rooms", name: "Rooms", view: ["See room status and cleaning tasks"], edit: ["Set a room's status", "Rush a room clean"], full: [] },
		{ key: "services", name: "Laundry, repairs and room service", view: ["See laundry orders, work orders and the order board"], edit: ["Take laundry orders and charge them to the room", "Raise and comment on work orders", "Take room-service orders"], full: [] },
	],
	HOUSEKEEPING: [
		// housekeeping HousekeepingService.requireSupervisor (FULL) for assign/reassign/inspect
		{ key: "rooms", name: "Rooms", view: ["Their own cleaning tasks", "Report problems, minibar, lost & found"], edit: ["Set a room's status"], full: ["Assign, reassign and inspect rooms (supervisor)", "See every cleaning task"] },
		{ key: "linen", name: "Linen", view: ["See linen batches"], edit: ["Send soiled linen to the laundry"], full: [] },
		{ key: "repairs", name: "Work orders", view: ["See work orders"], edit: ["Raise, reopen and comment on work orders"], full: [] },
		{ key: "stock", name: "Stock", view: ["See stores and stock"], edit: ["Use or waste stock", "Ask the store for stock", "Run a stock count"], full: [] },
	],
	LAUNDRY: [
		{ key: "orders", name: "Guest laundry", view: ["See orders and the price list"], edit: ["Create orders and move them along", "Charge to the room or mark paid", "Cancel an order"], full: ["See laundry revenue"] },
		// LaundryService: closing a batch that came back short needs FULL
		{ key: "linen", name: "Hotel linen", view: ["See linen batches"], edit: ["Receive linen and give it back"], full: ["Close a batch that came back short"] },
		{ key: "stock", name: "Stock", view: ["See stores and stock"], edit: ["Use or waste stock", "Ask the store for stock", "Run a stock count"], full: [] },
	],
	MAINTENANCE: [
		// maintenance WorkOrderAccess: technician (EDIT) runs own jobs; supervisor (FULL) assigns and runs any
		{ key: "work-orders", name: "Work orders", view: ["See work orders, assets and scheduled jobs"], edit: ["Raise work orders", "Take an unassigned job and run their own jobs"], full: ["Assign jobs to anyone and run any job (supervisor)", "See maintenance spend"] },
		// MaintenanceService.requireSupervisor: assets and schedules need FULL
		{ key: "assets", name: "Assets & scheduled jobs", view: ["See assets and scheduled jobs"], edit: [], full: ["Add and edit assets and scheduled jobs", "Pause or delete a scheduled job"] },
		{ key: "rooms", name: "Rooms", view: [], edit: ["Take a room out of order and back into service"], full: [] },
		{ key: "stock", name: "Stock", view: ["See stores and stock"], edit: ["Use or waste stock", "Ask the store for stock", "Run a stock count"], full: [] },
	],
	KITCHEN: [
		// fnb OutletAccess: kitchen outlets only; cancelling a sent item needs FULL
		{ key: "orders", name: "Orders & tickets", view: ["See the order board and the kitchen's sales", "Works every outlet, or only the ones a manager picked for them"], edit: ["Take orders and move tickets along", "Charge an order to a room", "Split a bill equally, by item or by amount; each part is paid its own way", "Give a discount up to the limit when Hotel setup lists kitchen staff; otherwise, above the limit or for a complimentary item, a manager approves", "Ask a manager to void an item already sent, or a sale", "Add a tip when a sale is paid, where the location records tips"], full: ["Cancel an item already sent"] },
		{ key: "menu", name: "Menu", view: ["See the menu"], edit: ["Mark an item available or 86'd", "Change a price"], full: ["Add and edit categories, items and happy hours"] },
		{ key: "stock", name: "Stock", view: ["See stores and stock"], edit: ["Use or waste stock", "Ask the store for stock", "Run a stock count"], full: [] },
	],
	BAR: [
		{ key: "orders", name: "Orders & tabs", view: ["See the order board and the bar's sales", "Works every outlet, or only the ones a manager picked for them"], edit: ["Take orders and move them along", "Charge a tab to a room", "Split a bill equally, by item or by amount; each part is paid its own way", "Give a discount up to the limit (unless Hotel setup takes bar staff off the list); above the limit or for a complimentary item, a manager approves", "Ask a manager to void an item already sent, or a sale", "Add a tip when a sale is paid, where the location records tips"], full: ["Cancel an item already sent"] },
		{ key: "menu", name: "Menu", view: ["See the menu"], edit: ["Mark an item available or 86'd", "Change a price"], full: ["Add and edit categories, items and happy hours"] },
		{ key: "stock", name: "Stock", view: ["See stores and stock"], edit: ["Use or waste stock", "Ask the store for stock", "Run a stock count"], full: [] },
	],
	// fnb OutletAccess (docs/plan-venue-type.md, phase 3): every outlet of the location; a waiter works the orders they opened.
	WAITER: [
		{ key: "orders", name: "Orders & tabs", view: ["See the tabs and sales they opened", "Works every outlet, or only the ones a manager picked for them"], edit: ["Open a tab or order at a table and add items", "Split a bill equally, by item or by amount; each part is paid its own way", "Ask a manager for a discount, a complimentary item or a void; give a discount up to the limit only when Hotel setup lists waiters", "Send to the kitchen or bar and mark items served", "Move a tab to another table", "Take off an item before it is sent", "Charge their tab to a room (hotels)"], full: ["See and work every waiter's tabs (head waiter)"] },
		{ key: "payments", name: "Payments", view: [], edit: ["Take payment for their own tabs, only when Hotel setup allows waiters to take payment", "Cash only when allowed too; it goes into the cashier's till", "Add a tip when a sale is paid, where the location records tips"], full: ["Take payment for any waiter's tab, when waiters may take payment"] },
		{ key: "menu", name: "Menu", view: ["See the menu and prices"], edit: [], full: [] },
	],
	// payment PaymentService: cashier desk and till; fnb: sees every order, rings nothing up
	CASHIER: [
		{ key: "payments", name: "Payments", view: ["See every open tab and sale at the outlets", "Works every outlet, or only the ones a manager picked for them"], edit: ["Take payment for any open tab or sale (cash, card, transfer)", "Split a bill equally, by item or by amount; each part is paid its own way", "Give a discount up to the limit (unless Hotel setup takes cashiers off the list); above the limit or for a complimentary item, a manager approves", "Ask a manager to void an item already sent, or a sale", "Add a tip when a sale is paid, where the location records tips", "Charge a sale to a room (hotels)", "Print or resend a receipt"], full: [] },
		{ key: "till", name: "Till", view: ["See the cashier till"], edit: ["Open and close the till, pay in and out", "Hand the till over"], full: [] },
		{ key: "menu", name: "Menu", view: ["See the menu and prices"], edit: [], full: [] },
	],
	INVENTORY: [
		// inventory InventoryController STORE (EDIT); adjust needs FULL
		{ key: "stock", name: "Stores & stock", view: ["See movements, value and usage"], edit: ["Add and edit stores and items", "Transfer stock", "Issue or decline team requests"], full: ["Correct a stock level"] },
		{ key: "purchasing", name: "Purchasing", view: ["See suppliers, purchase orders and deliveries"], edit: ["Add suppliers", "Create, submit and close purchase orders", "Receive deliveries"], full: [] },
		{ key: "counts", name: "Counts", view: [], edit: ["Start, submit or cancel a count"], full: [] },
	],
	FINANCE: [
		{ key: "money", name: "Money", view: ["See today's money, income, sales and budgets"], edit: ["Match a payment", "Resend a receipt"], full: [] },
		{ key: "expenses", name: "Expenses & tills", view: ["See expenses and every till"], edit: ["Mark an expense paid", "Open or close any till", "Bank cash and record deposits"], full: [] },
		// finance NightAuditService: checklist and close day need FULL
		{ key: "audit", name: "Night audit", view: ["See the audit and past audits"], edit: [], full: ["Tick the checklist and close the day"] },
		{ key: "organizations", name: "Corporate accounts", view: [], edit: ["Send statements and reminders", "Raise invoices and record payments"], full: [] },
	],
};

/** What only a manager (or the owner) can do, whatever level a role holds: `@access.manager()` and the services' manager checks. */
export const MANAGER_ONLY_ACTIONS = [
	"Approve or decline refunds; resolve disputes",
	"Void a folio line; a manager's discount applies at once",
	"Late checkout, special or complimentary prices, check-in without payment",
	"Hotel setup: room types, rooms, areas and prices",
	"Add staff, give and change roles, pause access, reset passwords",
	"Decide approvals; rota, leave and budgets",
	"Close the day with open tabs or unsettled orders",
	"Approve a stock count; outlets, tables and laundry prices",
	"Cancel (void) an order that was sent; waiters and cashiers never void what was sent",
	"Approve a void, a discount above the limit or a complimentary item, from the dashboard or with their own PIN on the staff member's device; give any discount themselves",
	"Choose the outlets a waiter, cashier, bar or kitchen person works; set who gives discounts and whether tips are recorded",
];
