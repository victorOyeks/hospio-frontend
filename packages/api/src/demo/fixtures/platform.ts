import type { AdminUserRow, BusinessRow, FeeStatementRow, MarketerRow, OnboardingRow, PlatformChangeRow, TicketRow } from "@hospio/api/data/types";
import { at } from "./hotel";

export const demoBusinesses: BusinessRow[] = [
	{ id: "biz-1", name: "Ivory Court Hotels Ltd", ownerName: "Kayode Ashiru", ownerEmail: "kayode@ivorycourt.example.ng", stage: "LIVE", hotels: 4, rooms: 318, city: "Lagos", accountManager: "Rotimi Ayodele", health: 92, feeModel: "Per room / month", feeValue: 1500, mrr: 477000, since: "2024-01-10", lastActive: at(0, 11, 20), marketer: "Olumide Ogunmola", adoption: 88, openTickets: 1, dueFees: 0 },
	{ id: "biz-2", name: "Ferncrest Hotels", ownerName: "Mrs Folake Odebunmi", ownerEmail: "folake@ferncrest.example.ng", stage: "LIVE", hotels: 2, rooms: 96, city: "Lagos", accountManager: "Rotimi Ayodele", health: 74, feeModel: "Per room / month", feeValue: 1500, mrr: 144000, since: "2024-06-02", lastActive: at(0, 9, 5), marketer: "Olumide Ogunmola", adoption: 61, openTickets: 2, dueFees: 144000 },
	{ id: "biz-3", name: "Tamarind Lodge Abuja", ownerName: "Alhaji Garba Maikano", ownerEmail: "garba@tamarindlodge.example.ng", stage: "AT_RISK", hotels: 1, rooms: 40, city: "Abuja", accountManager: "Chiamaka Ugwoke", health: 38, feeModel: "% of room revenue", feeValue: 2, mrr: 52000, since: "2025-02-14", lastActive: at(-9, 15), adoption: 22, openTickets: 3, dueFees: 104000 },
	{ id: "biz-4", name: "Sandbar Bay Resort", ownerName: "Chief Udoka Onyeabor", ownerEmail: "udoka@sandbarbay.example.ng", stage: "ONBOARDING", hotels: 1, rooms: 72, city: "Calabar", accountManager: "Chiamaka Ugwoke", health: 65, feeModel: "Per room / month", feeValue: 1500, mrr: 0, since: "2026-10-20", lastActive: at(-1, 13), marketer: "Adanna Okorie", adoption: 10, openTickets: 0, dueFees: 0 },
	{ id: "biz-5", name: "Coalcrest Inn Enugu", ownerName: "Dr Somto Okwuosa", ownerEmail: "somto@coalcrestinn.example.ng", stage: "HANDED_OVER", hotels: 1, rooms: 28, city: "Enugu", accountManager: "Chiamaka Ugwoke", health: 80, feeModel: "Per room / month", feeValue: 1200, mrr: 33600, since: "2026-09-30", lastActive: at(0, 8, 15), marketer: "Adanna Okorie", adoption: 45, openTickets: 1, dueFees: 0 },
	{ id: "biz-6", name: "Kurmi Gate Hotel", ownerName: "Hajiya Asmau Ringim", ownerEmail: "asmau@kurmigate.example.ng", stage: "LEAD", hotels: 1, rooms: 55, city: "Kano", accountManager: "Rotimi Ayodele", health: 0, feeModel: "—", feeValue: 0, mrr: 0, since: "2026-11-01", adoption: 0, openTickets: 0, dueFees: 0 },
	{ id: "biz-7", name: "Creekside PH", ownerName: "Mr Soye Dagogo", ownerEmail: "soye@creekside.example.ng", stage: "SUSPENDED", hotels: 1, rooms: 36, city: "Port Harcourt", accountManager: "Rotimi Ayodele", health: 12, feeModel: "Per room / month", feeValue: 1500, mrr: 0, since: "2024-11-11", lastActive: at(-45, 10), adoption: 30, openTickets: 0, dueFees: 162000 },
];

export const demoMarketers: MarketerRow[] = [
	{ id: "mk-1", fullName: "Olumide Ogunmola", email: "olumide.ogunmola@example.com", phone: "0800 000 0027", status: "ACTIVE", sharePct: 10, months: 12, businesses: 2, earnedTotal: 684000, due: 62100, joined: "2024-01-05" },
	{ id: "mk-2", fullName: "Adanna Okorie", email: "adanna.okorie@example.com", phone: "0800 000 0032", status: "ACTIVE", sharePct: 10, months: 12, businesses: 2, earnedTotal: 33600, due: 3360, joined: "2026-08-20" },
	{ id: "mk-3", fullName: "Idris Bature", email: "idris.b@example.com", phone: "0800 000 0040", status: "PENDING", sharePct: 10, months: 12, businesses: 0, earnedTotal: 0, due: 0, joined: "2026-11-04" },
	{ id: "mk-4", fullName: "Remi Odebiyi", email: "remi.o@example.com", phone: "0800 000 0044", status: "ENDED", sharePct: 8, months: 6, businesses: 1, earnedTotal: 97200, due: 0, joined: "2024-09-01" },
];

export const demoTickets: TicketRow[] = [
	{ id: "tk-4412", businessName: "Ivory Court Hotels Ltd", subject: "Change check-out time to 11am", body: "Our check-out has always been 11am but the system says 12pm. Please change it for Ikeja.", priority: "NORMAL", status: "RESOLVED", openedBy: "Dotun Alabede", openedAt: at(-1, 14), assignedTo: "Chiamaka Ugwoke", resolution: "Changed to 11:00 · hotel notified" },
	{ id: "tk-4418", businessName: "Ferncrest Hotels", subject: "POS payments not showing", body: "Moniepoint terminal at the bar takes the card but nothing appears in Payments.", priority: "HIGH", status: "IN_PROGRESS", openedBy: "Folake Odebunmi", openedAt: at(0, 8, 40), assignedTo: "Rotimi Ayodele" },
	{ id: "tk-4419", businessName: "Ferncrest Hotels", subject: "Add a new room type", body: "We want a 'Family room' type at ₦55,000.", priority: "LOW", status: "OPEN", openedBy: "Folake Odebunmi", openedAt: at(0, 10, 2) },
	{ id: "tk-4415", businessName: "Tamarind Lodge Abuja", subject: "Staff can't sign in on tablet", body: "Housekeeping tablet says 'no role'.", priority: "URGENT", status: "OPEN", openedBy: "Garba Maikano", openedAt: at(-2, 9, 15), assignedTo: "Chiamaka Ugwoke" },
	{ id: "tk-4416", businessName: "Tamarind Lodge Abuja", subject: "Invoice looks wrong", body: "We were charged for 40 rooms but only 32 are in use.", priority: "NORMAL", status: "OPEN", openedBy: "Garba Maikano", openedAt: at(-2, 9, 30) },
	{ id: "tk-4417", businessName: "Tamarind Lodge Abuja", subject: "Request training", body: "New front desk staff need a walkthrough.", priority: "LOW", status: "OPEN", openedBy: "Garba Maikano", openedAt: at(-1, 11) },
	{ id: "tk-4420", businessName: "Coalcrest Inn Enugu", subject: "WhatsApp messages not delivered", body: "Confirmation messages show as sent but guests don't get them.", priority: "HIGH", status: "OPEN", openedBy: "Somto Okwuosa", openedAt: at(0, 9, 50) },
];

export const demoFeeStatements: FeeStatementRow[] = [
	{ id: "fs-1", businessName: "Ivory Court Hotels Ltd", month: "2026-10", base: 318, fee: 477000, paid: 477000, status: "PAID" },
	{ id: "fs-2", businessName: "Ferncrest Hotels", month: "2026-10", base: 96, fee: 144000, paid: 0, status: "DUE" },
	{ id: "fs-3", businessName: "Tamarind Lodge Abuja", month: "2026-10", base: 2600000, fee: 52000, paid: 0, status: "OVERDUE" },
	{ id: "fs-4", businessName: "Tamarind Lodge Abuja", month: "2026-09", base: 2600000, fee: 52000, paid: 0, status: "OVERDUE" },
	{ id: "fs-5", businessName: "Coalcrest Inn Enugu", month: "2026-10", base: 28, fee: 33600, paid: 33600, status: "PAID" },
	{ id: "fs-6", businessName: "Creekside PH", month: "2026-08", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-7", businessName: "Creekside PH", month: "2026-07", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-8", businessName: "Creekside PH", month: "2026-06", base: 36, fee: 54000, paid: 0, status: "OVERDUE" },
	{ id: "fs-9", businessName: "Ivory Court Hotels Ltd", month: "2026-09", base: 318, fee: 477000, paid: 477000, status: "PAID" },
	{ id: "fs-10", businessName: "Ferncrest Hotels", month: "2026-09", base: 96, fee: 144000, paid: 144000, status: "PAID" },
];

export const demoPlatformChanges: PlatformChangeRow[] = [
	{ id: "pc-1", businessName: "Ivory Court Hotels Ltd", area: "Hotel setup · Ivory Court Ikeja", description: "Check-out time 12:00 → 11:00", reason: "Ticket #4412", madeBy: "Chiamaka Ugwoke", at: at(-1, 16), undoUntil: at(6, 16) },
	{ id: "pc-2", businessName: "Ferncrest Hotels", area: "Payments · terminals", description: "Re-linked bar POS MP-0091", reason: "Ticket #4418", madeBy: "Rotimi Ayodele", at: at(0, 9, 30), undoUntil: at(7, 9, 30) },
	{ id: "pc-3", businessName: "Tamarind Lodge Abuja", area: "Users", description: "Reset password for garba@tamarindlodge.example.ng", reason: "Owner locked out", madeBy: "Chiamaka Ugwoke", at: at(-5, 10), undoUntil: at(2, 10) },
	{ id: "pc-4", businessName: "Coalcrest Inn Enugu", area: "Hotel setup · Rooms", description: "Added room type 'Twin' ₦22,000", reason: "Onboarding", madeBy: "Chiamaka Ugwoke", at: at(-12, 14), undoUntil: at(-5, 14), undone: true },
];

const ADMIN_STEPS = ["business", "owner", "fee", "hotels", "rooms", "template", "people", "connections", "golive", "handover"];
export const demoOnboarding: OnboardingRow[] = [
	{ id: "ob-1", businessId: "biz-4", businessName: "Sandbar Bay Resort", source: "BACK_OFFICE", step: 5, totalSteps: 10, completedSteps: ADMIN_STEPS.slice(0, 4), assignedTo: "Chiamaka Ugwoke", assignedToId: "au-3", startedAt: at(-19, 10), updatedAt: at(-1, 13), status: "IN_PROGRESS", nextAction: "Import rooms from the owner's spreadsheet", data: { business: { name: "Sandbar Bay Resort", city: "Calabar" }, owner: { ownerName: "Chief Udoka Onyeabor", ownerEmail: "udoka@sandbarbay.example.ng" }, fee: { feeModel: "PER_ROOM_NIGHT", feeValue: 1500 }, hotels: { hotelIds: ["h-bluereef-1"] } } },
	{ id: "ob-2", businessId: "biz-5", businessName: "Coalcrest Inn Enugu", source: "BACK_OFFICE", step: 10, totalSteps: 10, completedSteps: ADMIN_STEPS, assignedTo: "Chiamaka Ugwoke", assignedToId: "au-3", startedAt: at(-40, 10), updatedAt: at(-8, 10), status: "DONE", nextAction: "—", data: {} },
	{ id: "ob-3", businessId: "biz-6", businessName: "Kurmi Gate Hotel", source: "BACK_OFFICE", step: 1, totalSteps: 10, completedSteps: [], assignedTo: "Rotimi Ayodele", assignedToId: "au-2", startedAt: at(-7, 10), updatedAt: at(-7, 10), status: "IN_PROGRESS", nextAction: "Owner to sign the agreement", data: {} },
];

export const demoAdminUsers: AdminUserRow[] = [
	{ id: "au-1", fullName: "Seyi Hospio", email: "seyi@hospio360.com", role: "SUPER_ADMIN", status: "ACTIVE", lastSignIn: at(0, 8), twoStep: true },
	{ id: "au-2", fullName: "Rotimi Ayodele", email: "rotimi@hospio360.com", role: "SUPPORT", status: "ACTIVE", lastSignIn: at(0, 9, 28), twoStep: true },
	{ id: "au-3", fullName: "Chiamaka Ugwoke", email: "chiamaka@hospio360.com", role: "SUPPORT", status: "ACTIVE", lastSignIn: at(0, 7, 50), twoStep: true },
	{ id: "au-4", fullName: "Gbolahan Ajose", email: "gbolahan@hospio360.com", role: "FINANCE_ADMIN", status: "ACTIVE", lastSignIn: at(-1, 17), twoStep: false },
	{ id: "au-5", fullName: "Nkem Obidike", email: "nkem@hospio360.com", role: "SUPPORT", status: "PAUSED", lastSignIn: at(-30, 12), twoStep: true },
];
