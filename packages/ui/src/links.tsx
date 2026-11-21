import type { LucideIcon } from "lucide-react";
import {
	ScaleIcon,
	ActivityIcon,
	BarChart3Icon,
	BedDoubleIcon,
	BellIcon,
	BookOpenIcon,
	BuildingIcon,
	CalendarCheckIcon,
	CalendarDaysIcon,
	CheckCircle2Icon,
	ChefHatIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	CoinsIcon,
	CreditCardIcon,
	FileTextIcon,
	FolderIcon,
	HandshakeIcon,
	HeadsetIcon,
	HomeIcon,
	IdCardIcon,
	InboxIcon,
	LayoutGridIcon,
	MegaphoneIcon,
	MessageSquareIcon,
	MoonIcon,
	PackageIcon,
	PlugIcon,
	ReceiptIcon,
	SearchIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShirtIcon,
	SlidersHorizontalIcon,
	SprayCanIcon,
	TruckIcon,
	UserCircleIcon,
	UsersIcon,
	WalletIcon,
	WineIcon,
	WrenchIcon,
	UtensilsIcon,
} from "lucide-react";
import type { HotelRole } from "@hospio/api/roles";

export type NavLink = {
	title: string;
	url: string;
	icon: LucideIcon;
	/** A count shown on the link (the shell fills it): unpaid sales for the bar and kitchen, unread staff messages for the Inbox. */
	badge?: "unpaidSales" | "inbox" | "approvals" | "applications";
	/** Shown only to a housekeeping supervisor (Full access) or a manager, the rule the service applies. */
	supervisorOnly?: boolean;
	/** A heading the link sits under (admin portal); menus without groups show one flat list. */
	group?: string;
	/** Only these roles see the link; everyone with the menu when left out. */
	roles?: HotelRole[];
	/**
	 * Needs accommodation (rooms, stays, bookings, folios): hidden, and the page answers "Not used at a lounge", when the active
	 * location has none (hospio-backend docs/plan-venue-type.md).
	 */
	stay?: boolean;
};

/** Manager portal, in the order of the Figma sidebar. */
export const managerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "Departments", url: "/dashboard/departments", icon: LayoutGridIcon },
	{
		title: "Approvals",
		url: "/dashboard/approvals",
		icon: CheckCircle2Icon,
		badge: "approvals",
	},
	{ title: "Rooms", url: "/dashboard/rooms", icon: BuildingIcon, stay: true },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon, stay: true },
	{ title: "Folios", url: "/dashboard/folios", icon: ReceiptIcon, stay: true },
	{ title: "Staff", url: "/dashboard/staff", icon: IdCardIcon },
	{ title: "Financials", url: "/dashboard/financials", icon: BarChart3Icon },
	{ title: "Payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Hospio fees", url: "/dashboard/hospio-fees", icon: ReceiptIcon },
	{ title: "Billing & invoices", url: "/dashboard/billing", icon: FileTextIcon },
	{
		title: "Organizations",
		url: "/dashboard/organizations",
		icon: HandshakeIcon,
		stay: true,
	},
	{ title: "Night audit", url: "/dashboard/night-audit", icon: MoonIcon },
	{ title: "Messaging", url: "/dashboard/messaging", icon: MessageSquareIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Inventory", url: "/dashboard/inventory", icon: PackageIcon },
	{ title: "Menus", url: "/dashboard/menus", icon: BookOpenIcon },
	{ title: "Reports", url: "/dashboard/reports", icon: FolderIcon },
	{ title: "Tasks", url: "/dashboard/tasks", icon: ClipboardListIcon },
	{
		title: "Roles & Permissions",
		url: "/dashboard/roles",
		icon: ShieldCheckIcon,
	},
	{ title: "Activity log", url: "/dashboard/activity", icon: BookOpenIcon },
	{ title: "Hotel setup", url: "/dashboard/hotel-setup", icon: SettingsIcon },
];

export const ownerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "Hotels", url: "/dashboard/hotels", icon: BuildingIcon },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon, stay: true },
	{ title: "Staff", url: "/dashboard/staff", icon: IdCardIcon },
	{ title: "Financials", url: "/dashboard/financials", icon: BarChart3Icon },
	{ title: "Payments", url: "/dashboard/payments", icon: WalletIcon },
	{ title: "Hospio fees", url: "/dashboard/hospio-fees", icon: ReceiptIcon },
	{ title: "Billing & invoices", url: "/dashboard/billing", icon: FileTextIcon },
	{ title: "Reports", url: "/dashboard/reports", icon: FolderIcon },
	{ title: "Users", url: "/dashboard/users", icon: UsersIcon },
	{
		title: "Roles & Permissions",
		url: "/dashboard/roles",
		icon: ShieldCheckIcon,
	},
	{ title: "Operations", url: "/dashboard/operations", icon: ActivityIcon },
	{ title: "Inventory", url: "/dashboard/inventory", icon: PackageIcon },
	// The owner's staff threads live on Messaging (their Inbox), so the unread count shows here.
	{
		title: "Messaging",
		url: "/dashboard/messaging",
		icon: MessageSquareIcon,
		badge: "inbox",
	},
	{
		title: "Hotel setup",
		url: "/dashboard/hotel-setup",
		icon: SlidersHorizontalIcon,
	},
	{ title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
];

export const frontOfficeLinks: NavLink[] = [
	{ title: "Today", url: "/dashboard", icon: HomeIcon },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon, stay: true },
	{ title: "Rooms", url: "/dashboard/rooms", icon: BedDoubleIcon, stay: true },
	{ title: "Folios", url: "/dashboard/folios", icon: ReceiptIcon, stay: true },
	{ title: "Room service", url: "/dashboard/room-service", icon: UtensilsIcon, stay: true },
	{ title: "Guest laundry", url: "/dashboard/laundry", icon: ShirtIcon, stay: true },
	{ title: "Repairs", url: "/dashboard/repairs", icon: WrenchIcon },
	{ title: "Guests", url: "/dashboard/guests", icon: UsersIcon, stay: true },
	{ title: "Lost & found", url: "/dashboard/lost-found", icon: SearchIcon },
	{ title: "Messages", url: "/dashboard/messages", icon: MessageSquareIcon },
	{ title: "Payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const housekeepingLinks: NavLink[] = [
	{ title: "My rooms", url: "/dashboard", icon: SprayCanIcon },
	{
		title: "Inspect",
		url: "/dashboard/inspect",
		icon: ClipboardCheckIcon,
		supervisorOnly: true,
		stay: true,
	},
	{ title: "Lost & found", url: "/dashboard/lost-found", icon: SearchIcon },
	{ title: "Linen", url: "/dashboard/linen", icon: ShirtIcon },
	{ title: "Housekeeping store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "Repairs", url: "/dashboard/repairs", icon: WrenchIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const laundryLinks: NavLink[] = [
	{ title: "Jobs", url: "/dashboard", icon: ShirtIcon },
	{ title: "Linen", url: "/dashboard/linen", icon: TruckIcon },
	{ title: "Laundry store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const maintenanceLinks: NavLink[] = [
	{ title: "Work orders", url: "/dashboard", icon: WrenchIcon },
	{ title: "Preventive", url: "/dashboard/preventive", icon: CalendarDaysIcon },
	{ title: "Maintenance store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "Rooms out of order", url: "/dashboard/rooms", icon: BedDoubleIcon, stay: true },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const kitchenLinks: NavLink[] = [
	{ title: "Orders", url: "/dashboard", icon: ChefHatIcon },
	{
		title: "Sales",
		url: "/dashboard/sales",
		icon: CoinsIcon,
		badge: "unpaidSales",
	},
	{ title: "Menu", url: "/dashboard/menu", icon: BookOpenIcon },
	{ title: "Store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const barLinks: NavLink[] = [
	{ title: "Today", url: "/dashboard", icon: WineIcon },
	{ title: "Tabs", url: "/dashboard/tabs", icon: ReceiptIcon },
	{
		title: "Sales",
		url: "/dashboard/sales",
		icon: CoinsIcon,
		badge: "unpaidSales",
	},
	{ title: "Menu", url: "/dashboard/menu", icon: BookOpenIcon },
	{ title: "Stock", url: "/dashboard/stock", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

/** A waiter (hospio-backend docs/plan-venue-type.md, phase 3): the tabs they opened and what they sold. */
export const waiterLinks: NavLink[] = [
	{ title: "My tabs", url: "/dashboard", icon: ReceiptIcon },
	{ title: "My sales", url: "/dashboard/sales", icon: CoinsIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

/** A cashier: every open tab and sale to collect, the till and the receipts. */
export const cashierLinks: NavLink[] = [
	{ title: "To pay", url: "/dashboard", icon: ReceiptIcon },
	{
		title: "Sales",
		url: "/dashboard/sales",
		icon: CoinsIcon,
		badge: "unpaidSales",
	},
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const inventoryLinks: NavLink[] = [
	{ title: "Stores & stock", url: "/dashboard", icon: PackageIcon },
	{ title: "Requests", url: "/dashboard/requests", icon: ClipboardListIcon },
	{ title: "Purchase orders", url: "/dashboard/orders", icon: ReceiptIcon },
	{ title: "Deliveries", url: "/dashboard/deliveries", icon: TruckIcon },
	{ title: "Stock counts", url: "/dashboard/counts", icon: ClipboardCheckIcon },
	{ title: "Suppliers", url: "/dashboard/suppliers", icon: HandshakeIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const financeLinks: NavLink[] = [
	{ title: "Today's money", url: "/dashboard", icon: CoinsIcon },
	{ title: "Month", url: "/dashboard/month", icon: BarChart3Icon },
	{ title: "Expenses", url: "/dashboard/expenses", icon: ReceiptIcon },
	{ title: "Bills", url: "/dashboard/bills", icon: FileTextIcon },
	{ title: "Outlet sales", url: "/dashboard/sales", icon: WineIcon },
	{ title: "Tills", url: "/dashboard/tills", icon: WalletIcon },
	{ title: "Night audit", url: "/dashboard/night-audit", icon: MoonIcon },
	{
		title: "Organizations",
		url: "/dashboard/organizations",
		icon: HandshakeIcon,
		stay: true,
	},
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

/**
 * Admin portal menu, grouped so each kind of work has one home: customers (businesses, every hotel, onboarding), day-to-day
 * operations, money, growth and the platform itself. Integrations is for a Super admin only, System health for a Super admin
 * and Support; the rest is shown to every platform role and each page says what that role may change.
 */
export const adminLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon, group: "Overview" },
	{ title: "Businesses", url: "/dashboard/businesses", icon: BuildingIcon, group: "Customers" },
	{ title: "Locations", url: "/dashboard/hotels", icon: BedDoubleIcon, group: "Customers" },
	{
		title: "Onboarding",
		url: "/dashboard/onboarding",
		icon: ClipboardCheckIcon,
		group: "Customers",
	},
	{ title: "Support", url: "/dashboard/support", icon: HeadsetIcon, group: "Operations" },
	{ title: "Changes by Hospio360", url: "/dashboard/changes", icon: BookOpenIcon, group: "Operations" },
	{ title: "Fees & billing", url: "/dashboard/fees", icon: CoinsIcon, group: "Money" },
	{ title: "Payments & POS", url: "/dashboard/payments", icon: CreditCardIcon, group: "Money" },
	{
		title: "Hotel applications",
		url: "/dashboard/hotel-applications",
		icon: CalendarCheckIcon,
		group: "Growth",
		badge: "applications",
	},
	{ title: "Marketers", url: "/dashboard/marketers", icon: MegaphoneIcon, group: "Growth" },
	{
		title: "Integrations",
		url: "/dashboard/integrations",
		icon: PlugIcon,
		group: "Platform",
		roles: ["SUPER_ADMIN"],
	},
	{
		title: "System health",
		url: "/dashboard/system",
		icon: ActivityIcon,
		group: "Platform",
		roles: ["SUPER_ADMIN", "SUPPORT"],
	},
	{ title: "Settings", url: "/dashboard/settings", icon: SettingsIcon, group: "Platform" },
	{ title: "Legal documents", url: "/dashboard/legal", icon: ScaleIcon, group: "Platform" },
	{ title: "Admin team", url: "/dashboard/team", icon: UsersIcon, group: "Platform" },
];

export const marketerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "My businesses", url: "/dashboard/businesses", icon: BuildingIcon },
	{ title: "Commissions", url: "/dashboard/commissions", icon: CoinsIcon },
	{ title: "Refer a business", url: "/dashboard/refer", icon: MegaphoneIcon },
	{ title: "Profile", url: "/dashboard/profile", icon: UserCircleIcon },
];

export const linksByRole: Record<HotelRole, NavLink[]> = {
	OWNER: ownerLinks,
	MANAGER: managerLinks,
	FRONT_OFFICE: frontOfficeLinks,
	HOUSEKEEPING: housekeepingLinks,
	LAUNDRY: laundryLinks,
	MAINTENANCE: maintenanceLinks,
	KITCHEN: kitchenLinks,
	BAR: barLinks,
	INVENTORY: inventoryLinks,
	FINANCE: financeLinks,
	WAITER: waiterLinks,
	CASHIER: cashierLinks,
	SUPER_ADMIN: adminLinks,
	SUPPORT: adminLinks,
	FINANCE_ADMIN: adminLinks,
	MARKETER: marketerLinks,
};

/**
 * Pages that need accommodation for a role: its `stay` links (and everything under them) plus pages reached from a dashboard
 * rather than the menu. The shell answers "Not used at a lounge" on these when the active location has no rooms.
 */
const STAY_ONLY_EXTRA: Partial<Record<HotelRole, string[]>> = {
	// The front office's home is its arrivals and departures board.
	FRONT_OFFICE: ["/dashboard"],
};

export function stayOnlyPaths(role: HotelRole): string[] {
	return [
		...linksByRole[role].filter((l) => l.stay).map((l) => l.url),
		...(STAY_ONLY_EXTRA[role] ?? []),
	];
}

/** Whether `pathname` (as the browser shows it, /dashboard/…) is a stay-only page for this role. */
export function isStayOnlyPath(role: HotelRole, pathname: string): boolean {
	const path = pathname.split("?")[0].replace(/\/$/, "");
	// "/dashboard" (a home page) matches only itself, never every page under it.
	return stayOnlyPaths(role).some((p) => path === p || (p !== "/dashboard" && path.startsWith(`${p}/`)));
}
