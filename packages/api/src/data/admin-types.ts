/**
 * The shapes the admin portal and the marketer portal render. They follow platform-service and
 * payment-service (hospio-backend/docs/admin-portal.md); `data/admin.ts` maps the API (or the demo
 * fixtures) onto them so the screens never see the difference. Money in naira, dates ISO strings.
 */

import type { Delivery } from "@hospio/api/api/routes-admin";
import type { AdminUserRow, PlatformChangeRow } from "./types";

export type { Delivery };

export { emptyPage, type Paged } from "./paging";

/** Anything that may carry the messages the platform would have sent. */
export type WithDeliveries<T> = T & { deliveries?: Delivery[] };

// ---- dashboard -----------------------------------------------------------------------------------

export type AlertRow = {
	id: string;
	businessId?: string;
	businessName: string;
	hotelId?: string;
	kind: string;
	title: string;
	detail: string;
	tone: "danger" | "warning" | "grey";
	at: string;
};

export type AdminChangeRow = PlatformChangeRow & {
	businessId: string;
	hotelId?: string;
	beforeJson?: string;
	afterJson?: string;
};

export type AdminActivityRow = {
	id: string;
	at: string;
	by: string;
	action: string;
	target: string;
	eventType: string;
	businessId?: string;
};

export type OverviewData = {
	businesses: { total: number; byStage: Record<string, number> };
	hotels: number;
	rooms: number;
	mrr: number;
	dueFees: number;
	overdueFees: number;
	openTickets: number;
	onboardingInProgress: number;
	readyForHandover: number;
	alerts: AlertRow[];
	recentChanges: AdminChangeRow[];
	recentActivity: AdminActivityRow[];
	health: { good: number; watch: number; atRisk: number };
};

export type HealthRow = {
	businessId: string;
	score: number;
	factors: Record<string, unknown>;
	computedAt?: string;
};

export type UsageData = {
	businessId: string;
	activeUsers7d: number;
	activeUsers30d: number;
	bookings30d: number;
	payments30d: number;
	messages30d: number;
	weeks: {
		weekStart: string;
		bookings: number;
		payments: number;
		messages: number;
	}[];
	features: Record<string, boolean>;
};

export type HotelOverviewData = {
	hotelId: string;
	businessId?: string;
	name: string;
	managerName?: string;
	rooms: number;
	occupiedRooms: number;
	occupancyPct: number;
	arrivalsToday: number;
	departuresToday: number;
	openFolios: number;
	paymentsTodayCount: number;
	paymentsTodayGross: number;
};

// ---- team ----------------------------------------------------------------------------------------

export type TeamMemberRow = AdminUserRow & {
	userId: string;
	phone: string;
	grantId?: string;
	inviteStatus: "PENDING" | "ACCEPTED" | "EXPIRED" | "NONE";
	mustChangePassword: boolean;
};

// ---- fees ----------------------------------------------------------------------------------------

export type FeeStatementStatus = "DUE" | "PART_PAID" | "PAID" | "OVERDUE";
export type FeeLineRow = {
	hotelId?: string;
	hotelName: string;
	base: number;
	fee: number;
};
export type FeePaymentRow = {
	id: string;
	amount: number;
	paidOn?: string;
	reference?: string;
	recordedBy: string;
};
export type FeeStatementItem = {
	id: string;
	businessId: string;
	businessName: string;
	month: string;
	baseAmount: number;
	feeAmount: number;
	paidAmount: number;
	outstanding: number;
	status: FeeStatementStatus;
	dueOn?: string;
	sentAt?: string;
	lines: FeeLineRow[];
	payments: FeePaymentRow[];
	createdAt?: string;
};
export type FeeRuleRow = {
	id: string;
	businessId: string;
	model: string;
	value: number;
	startsOn?: string;
	endsOn?: string;
	addendumRef?: string;
};
export type GenerateStatementsResult = {
	created: number;
	skipped: number;
	notes: string[];
};

// ---- payments ------------------------------------------------------------------------------------

export type SettlementStatus = "PENDING" | "SETTLED" | "FAILED";
export type SettlementItem = {
	id: string;
	businessId: string;
	businessName: string;
	hotelId?: string;
	provider: string;
	periodDate: string;
	gross: number;
	providerFees: number;
	hmsShare: number;
	net: number;
	paymentCount: number;
	status: SettlementStatus;
	settledAt?: string;
	payoutBatchId?: string;
	failureReason?: string;
};
export type PayoutBatchStatus = "PROCESSING" | "PAID" | "PART_FAILED";
export type PayoutBatchItem = {
	id: string;
	ref: string;
	createdBy: string;
	status: PayoutBatchStatus;
	total: number;
	businessCount: number;
	settlementCount: number;
	paidAt?: string;
	paidOn?: string;
	paidReference?: string;
	createdAt: string;
};
export type PayoutBatchDetail = {
	batch: PayoutBatchItem;
	settlements: SettlementItem[];
};
export type FailedPayoutItem = {
	id: string;
	settlementId?: string;
	payoutBatchId?: string;
	businessId: string;
	businessName: string;
	amount: number;
	bankLabel: string;
	reason: string;
	attempts: number;
	lastTriedAt?: string;
	resolvedAt?: string;
};
export type PaymentSummaryData = {
	gross: number;
	count: number;
	byProvider: { provider: string; gross: number; count: number }[];
	byHotel: { hotelId: string; gross: number; count: number }[];
};
export type AdminPaymentRow = {
	id: string;
	reference: string;
	guestName: string;
	method: string;
	amount: number;
	status: string;
	providerRef?: string;
	description: string;
	takenBy: string;
	createdAt: string;
	bookingId?: string;
	folioId?: string;
	terminalId?: string;
};
export type RunSettlementsResult = {
	date?: string;
	created: number;
	skipped: number;
};
export type RetryPayoutResult = {
	failedPayoutId: string;
	attempts: number;
	resolved: boolean;
};

// ---- support -------------------------------------------------------------------------------------

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type TicketItem = {
	id: string;
	businessId: string;
	businessName: string;
	hotelId?: string;
	subject: string;
	body: string;
	priority: TicketPriority;
	status: TicketStatus;
	openedBy?: string;
	openedByName: string;
	openedAt: string;
	assignedTo?: string;
	assignedToName?: string;
	resolution?: string;
	resolvedAt?: string;
	lastActivityAt?: string;
};
export type TicketCommentItem = {
	id: string;
	authorId?: string;
	authorName: string;
	body: string;
	internal: boolean;
	createdAt: string;
};
export type TicketDetailData = {
	ticket: TicketItem;
	comments: TicketCommentItem[];
};

// ---- marketers -----------------------------------------------------------------------------------

export type MarketerStatus = "PENDING" | "ACTIVE" | "ENDED";
export type MarketerProfileRow = {
	id: string;
	userId?: string;
	fullName: string;
	email: string;
	phone: string;
	status: MarketerStatus;
	sharePct: number;
	months: number;
	bankName?: string;
	bankAccount?: string;
	bankAccountName?: string;
	joined: string;
	endedAt?: string;
	referralCode?: string;
	businesses: number;
	earnedTotal: number;
	due: number;
	/** Referred businesses per stage (LIVE, ONBOARDING…), every stage counted. */
	byStage?: Record<string, number>;
	/** The Referral Partner Agreement the marketer accepted (version, when, who). */
	agreementVersion?: string;
	agreementAcceptedAt?: string;
	agreementAcceptedName?: string;
	agreementAccepted?: boolean;
	/** Bank details: when saved, why they last changed, and finance's check (cleared by every save). */
	bankSavedAt?: string;
	bankChangeNote?: string;
	bankCheckedAt?: string;
	bankCheckedByName?: string;
	bankChecked?: boolean;
};
export type MarketerAgreementRow = {
	id: string;
	businessId: string;
	profileId?: string;
	fullName?: string;
	sharePct: number;
	months: number;
	whtPct: number;
	status: string;
	startedOn?: string;
	endedOn?: string;
	/** The earning window: from the business's first collected fee, for `months` months (null until then). */
	windowStart?: string;
	windowEnd?: string;
	endedReason?: string;
};
export type ReferralStage =
	| "LEAD"
	| "CONTACTED"
	| "ONBOARDING"
	| "LIVE"
	| "LOST";
export type ReferralItem = {
	id: string;
	profileId?: string;
	hotelName: string;
	ownerName: string;
	phone: string;
	email?: string;
	city: string;
	stage: ReferralStage;
	note?: string;
	businessId?: string;
	sentAt: string;
	updatedAt?: string;
};
/** ACCRUED (waiting for the next statement), ON_STATEMENT, PAID; DUE and WAITING on lines from before statements. */
export type CommissionStatus =
	| "ACCRUED"
	| "ON_STATEMENT"
	| "PAID"
	| "DUE"
	| "WAITING"
	| string;
export type CommissionLine = {
	id: string;
	businessId?: string;
	profileId?: string;
	marketerName: string;
	businessName: string;
	month: string;
	baseAmount: number;
	gross: number;
	wht: number;
	net: number;
	status: CommissionStatus;
	paidOn?: string;
	paidReference?: string;
	/** DAILY_FEE (a day's collected fee) or CLAWBACK (a refund of one); empty on old monthly lines. */
	source?: string;
	feeDate?: string;
	earnedOn?: string;
	sharePct?: number;
	whtPct?: number;
	statementId?: string;
	note?: string;
};
export type MarketerDetailData = {
	profile: MarketerProfileRow;
	agreements: MarketerAgreementRow[];
	referrals: ReferralItem[];
	commissions: CommissionLine[];
	earnedTotal: number;
	due: number;
	paid: number;
	businesses: number;
	byStage: Record<string, number>;
	nextStatement: StatementLineItem[];
	statements: MarketerStatementRow[];
	currentAgreementVersion: string;
};

// ---- marketer statements ---------------------------------------------------------------------------

/** A read the screen shows with its error (and an empty value) when the service refused. */
export type LoadResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string; data: T };

export type MarketerStatementStatus =
	| "DRAFT"
	| "QUERIED"
	| "APPROVED"
	| "PAID"
	| "CARRIED_OVER";
export const STATEMENT_STATUSES: MarketerStatementStatus[] = [
	"DRAFT",
	"QUERIED",
	"APPROVED",
	"PAID",
	"CARRIED_OVER",
];
/** One commission line: a day's collected fee (or a clawback when a collected fee was refunded). */
export type StatementLineItem = {
	id: string;
	businessId?: string;
	businessName: string;
	hotelId?: string;
	source: "DAILY_FEE" | "CLAWBACK" | string;
	feeDate?: string;
	earnedOn?: string;
	month?: string;
	/** Negative on a clawback. */
	feeCollected: number;
	sharePct: number;
	gross: number;
	whtPct: number;
	wht: number;
	net: number;
	status: string;
	note?: string;
};
export type StatementBusinessGroupItem = {
	businessId?: string;
	businessName: string;
	feesCollected: number;
	gross: number;
	wht: number;
	net: number;
	lines: number;
};
/** A marketer's monthly statement, made on the 5th for the month before. */
export type MarketerStatementRow = {
	id: string;
	profileId?: string;
	marketerName: string;
	marketerEmail?: string;
	/** yyyy-MM */
	month: string;
	status: MarketerStatementStatus;
	lineCount: number;
	feesCollected: number;
	gross: number;
	/** Zero or negative. */
	clawback: number;
	wht: number;
	net: number;
	carriedIn: number;
	payable: number;
	minimumPayout: number;
	carriedToMonth?: string;
	queryUntil?: string;
	canQuery: boolean;
	queryNote?: string;
	queriedAt?: string;
	queryAnswer?: string;
	approvedAt?: string;
	approvedByName?: string;
	paidAmount?: number;
	paidReference?: string;
	paidOn?: string;
	paidRecordedName?: string;
	paidEmailSentAt?: string;
	bankName?: string;
	bankAccount?: string;
	bankAccountName?: string;
	bankChecked: boolean;
	createdAt?: string;
	/** An ENDED marketer's last statement: open lines and carried balances, paid whatever the amount. */
	finalStatement?: boolean;
};
export type MarketerStatementDetail = {
	statement: MarketerStatementRow;
	businesses: StatementBusinessGroupItem[];
	lines: StatementLineItem[];
	carriedFrom: MarketerStatementRow[];
};
export type MarketerStatementList = {
	statements: MarketerStatementRow[];
	counts: Record<string, number>;
	/** Payable per status. */
	totals: Record<string, number>;
};
export type MyStatementsData = {
	statements: MarketerStatementRow[];
	nextStatement: StatementLineItem[];
	minimumPayout: number;
};
export type StatementRunResult = {
	month: string;
	made: number;
	carriedOver: number;
	skipped: number;
	notes: string[];
};
/** Who referred a business, with its marketer agreements. */
export type BusinessMarketerData = {
	businessId: string;
	profileId?: string;
	fullName?: string;
	referralCode?: string;
	status?: string;
	agreements: MarketerAgreementRow[];
};
export type MarketerChangeResult = {
	businessId: string;
	fromProfileId?: string;
	fromName?: string;
	toProfileId?: string;
	toName?: string;
	ended: MarketerAgreementRow[];
	opened?: MarketerAgreementRow;
};
export type MarketerLoginData = {
	userId: string;
	temporaryPassword?: string;
	temporaryPasswordExpiresAt?: string;
	inviteToken?: string;
	inviteExpiresAt?: string;
};
export type MarketerInvitedData = WithDeliveries<{
	profile: MarketerProfileRow;
	login?: MarketerLoginData;
}>;

/** The marketer portal's own view. */
export type MarketerMeData = {
	profile: MarketerProfileRow;
	totals: {
		earnedTotal: number;
		due: number;
		paid: number;
		businesses: number;
		referrals: number;
		/** Net of the lines waiting for the next statement. */
		nextStatement: number;
		/** Statements under the minimum payout, rolling into the next. */
		carried: number;
		byStage: Record<string, number>;
	};
	currentAgreementVersion: string;
	agreementAccepted: boolean;
	minimumPayout: number;
	whtPct: number;
};
export type MarketerBusinessItem = {
	id: string;
	name: string;
	city: string;
	stage: string;
	hotels: number;
	since?: string;
	sharePct: number;
	lastMonthShare: number;
	lastMonth?: string;
	/** The marketer's agreement for the business: ACTIVE, ENDED, or none yet (not live). */
	agreementStatus?: string;
	agreementStartedOn?: string;
	agreementEndedOn?: string;
	/** Null until the business's first fee is collected. */
	windowStart?: string;
	windowEnd?: string;
	months: number;
	earnedNet: number;
};
export type CommissionStatementData = {
	month: string;
	marketerName: string;
	gross: number;
	wht: number;
	net: number;
	text: string;
};

// ---- settings ------------------------------------------------------------------------------------

export type SettingsGroup = "general" | "fees" | "security";
export type PlatformSettingsData = Record<
	SettingsGroup,
	Record<string, unknown>
>;
export type IntegrationItem = {
	key: string;
	name: string;
	kind: string;
	/** TEST_MODE: a test provider is in force, so nothing real happens (e.g. nothing is charged). */
	status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "NOT_CONFIGURED" | "TEST_MODE";
	detail: string;
	lastCheck?: string;
	/** The service that made the check. */
	checkedBy?: string;
};

/** Integrations page: one provider's keys (GET/PUT /platform/admin/integrations). */
export type IntegrationGroup = "EMAIL" | "MESSAGING" | "PAYMENTS" | "POS" | "FEE_DEBIT";
export type IntegrationFieldType = "TEXT" | "SECRET" | "URL" | "NUMBER" | "BOOLEAN";
export type IntegrationFieldView = {
	key: string;
	label: string;
	type: IntegrationFieldType;
	hint: string | null;
	/** Masked for a SECRET; null when nothing is saved in the portal. */
	value: string | null;
	saved: boolean;
};
export type IntegrationCard = {
	provider: string;
	label: string;
	group: IntegrationGroup;
	testable: boolean;
	updatedByName: string | null;
	updatedAt: string | null;
	fields: IntegrationFieldView[];
};
/** The Integrations page: editable cards (or why they didn't load) and the server's connection checks. */
export type IntegrationsData =
	| { ok: true; cards: IntegrationCard[]; status: IntegrationItem[] }
	| { ok: false; error: string; status: IntegrationItem[] };

// ---- hotels across businesses --------------------------------------------------------------------

/** How a hotel's Hospio fee is collected, as the Hotels list shows it (fee-collection, money roles only). */
export type HotelCollectionSummary = {
	provider: string | null;
	debitEnabled: boolean;
	posPaused: boolean;
	/** The hotel has complete POS keys for at least one provider. */
	keysIn: boolean;
	/** Every provider with complete keys (a hotel can hold Moniepoint and OPay side by side). */
	providers?: string[];
	debitConfigured: boolean;
};

/** One hotel on the flat Hotels page, with its business and (for money roles) its fee state. */
export type HotelDirectoryRow = {
	id: string;
	name: string;
	businessId: string;
	businessName: string;
	stage: string;
	city: string;
	address: string;
	rooms: number;
	/** The location's kind (HOTEL, LOUNGE, BAR, RESTAURANT, CLUB) and whether it has rooms (docs/plan-venue-type.md). */
	venueType: string;
	hasAccommodation: boolean;
	timezone: string;
	status: string;
	/** Null when not loaded (Support can't read fee collection) or the call failed. */
	collection: HotelCollectionSummary | null;
	lastFee: { date: string; fee: number; status: string } | null;
};

// ---- support access --------------------------------------------------------------------------------

export type SupportAccessGrantItem = {
	id: string;
	adminId?: string;
	adminName: string;
	businessId: string;
	reason: string;
	createdAt?: string;
	expiresAt?: string;
	expired: boolean;
};
