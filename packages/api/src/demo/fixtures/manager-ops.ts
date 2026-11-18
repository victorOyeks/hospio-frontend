import type { RepairRow } from "@hospio/api/data/types";
import { at, day } from "./hotel";

/** Extra sample data for the manager's Financials, Night audit and Tasks screens. */

export const demoBudget = [
	{ category: "Salaries & wages", spent: 33_000_000, budget: 33_000_000 },
	{ category: "Utilities & diesel", spent: 1_600_000, budget: 1_500_000 },
	{ category: "Food & drink supplies", spent: 1_400_000, budget: 1_500_000 },
	{ category: "Maintenance & repairs", spent: 900_000, budget: 1_000_000 },
	{ category: "OTA commissions & marketing", spent: 12_000_000, budget: 12_000_000 },
	{ category: "Housekeeping supplies", spent: 9_000_000, budget: 10_500_000 },
	{ category: "Taxes & levies", spent: 6_000_000, budget: 6_800_000 },
	{ category: "Other", spent: 3_000_000, budget: 6_800_000 },
];

export const demoIncomeSources = [
	{ source: "Rooms", amount: 144_000_000, pct: 76 },
	{ source: "Events & halls", amount: 27_000_000, pct: 14 },
	{ source: "Food & drinks", amount: 15_000_000, pct: 8 },
	{ source: "Laundry & other", amount: 3_000_000, pct: 2 },
];

export const demoBills = [
	{ name: "Power bill (prepaid meter)", due: day(8), amount: 480_000 },
	{ name: "Yaba Weave Textiles · linen", due: day(1), amount: 312_000, note: "Due on delivery" },
	{ name: "Spectranet", due: day(12), amount: 42_000 },
];

export const demoWeekRevenue = [-6, -5, -4, -3, -2, -1, 0].map((o, i) => ({ date: day(o), revenue: [1_098_000, 1_240_000, 980_500, 1_310_200, 1_485_500, 1_122_000, 1_232_000][i], expenses: [410_000, 520_000, 380_000, 445_000, 690_000, 300_000, 642_500][i] }));

export const demoMonth = { revenue: 189_000_000, lastMonth: 170_000_000, expenses: 122_000_000, budget: 129_000_000, netProfit: 67_500_000, margin: 36, takenToday: 6_950_000, unpaidGuests: 3, unpaidTotal: 640_000 };

export const demoExpenseCategories = ["Fuel & power", "Kitchen supplies", "Bar supplies", "Housekeeping", "Laundry", "Repairs", "Utilities", "Staff welfare", "Marketing", "Transport", "Office", "Other"];

/** Non-maintenance tasks for the board (housekeeping, front desk, store, the manager). */
export const demoTeamTasks: RepairRow[] = [
	{ id: "tk-1", title: "Clean before 2pm arrival", roomNumber: "A204", priority: "URGENT", status: "IN_PROGRESS", source: "Housekeeping", reportedBy: "Tosin Adewole", assignedTo: "Yewande Ajibola", createdAt: at(0, 8, 5), updates: [{ at: at(0, 9, 40), by: "Yewande Ajibola", note: "Started · bathroom first" }] },
	{ id: "tk-2", title: "Clean before arrival", roomNumber: "A118", priority: "HIGH", status: "ASSIGNED", source: "Housekeeping", reportedBy: "System", assignedTo: "Esther Nwafor", createdAt: at(0, 8, 5), updates: [] },
	{ id: "tk-3", title: "Extra pillows and a kettle", description: "Guest request · Chinwe Anyanwu", roomNumber: "A325", priority: "HIGH", status: "OPEN", source: "Front desk", reportedBy: "Tosin Adewole", assignedTo: "Esther Nwafor", createdAt: at(0, 10, 50), updates: [] },
	{ id: "tk-4", title: "Restock minibars on floor 2", area: "Floor 2 · 12 rooms", priority: "NORMAL", status: "OPEN", source: "Housekeeping", reportedBy: "Ebere Nwagbo", assignedTo: "Ebere Nwagbo", createdAt: at(0, 7, 30), updates: [] },
	{ id: "tk-5", title: "Replace 2 torn towels", area: "Housekeeping store", priority: "LOW", status: "WAITING_PARTS", source: "Store", reportedBy: "Yewande Ajibola", assignedTo: "Bolaji Fasanmi", createdAt: at(-1, 15, 0), updates: [{ at: at(-1, 16), by: "Bolaji Fasanmi", note: "Waiting on Threadline Linens delivery" }] },
	{ id: "tk-6", title: "Book the generator overhaul", description: "₦620,000 approved by Kayode Ashiru", area: "Generator house", priority: "NORMAL", status: "OPEN", source: "You", reportedBy: "Kayode Ashiru", assignedTo: "Dotun Alabede", createdAt: at(-1, 9, 0), updates: [] },
	{ id: "tk-7", title: "Deep clean after no-show", roomNumber: "A118", priority: "NORMAL", status: "DONE", source: "Housekeeping", reportedBy: "System", assignedTo: "Esther Nwafor", createdAt: at(0, 8, 0), doneAt: at(0, 11, 5), updates: [] },
	{ id: "tk-8", title: "Clean before 2pm arrival", roomNumber: "A210", priority: "NORMAL", status: "DONE", source: "Housekeeping", reportedBy: "System", assignedTo: "Yewande Ajibola", createdAt: at(0, 8, 0), doneAt: at(0, 10, 40), updates: [] },
	{ id: "tk-9", title: "Change TV remote batteries", roomNumber: "B124", priority: "LOW", status: "DONE", source: "Maintenance", reportedBy: "Bukola Oladiran", assignedTo: "Obinna Ezeugo", createdAt: at(0, 9, 0), doneAt: at(0, 9, 40), updates: [] },
];

export const demoTechnicians = ["Obinna Ezeugo", "Usman Garkuwa", "Pipeworks Plumbing (vendor)", "Frostline Cooling Ltd (vendor)"];
export const demoAreas = ["Lobby", "Restaurant", "Bar", "Pool", "Gym", "Generator house", "Roof tanks", "Floor 1 corridor", "Floor 2 corridor", "Floor 3 corridor", "Car park"];
