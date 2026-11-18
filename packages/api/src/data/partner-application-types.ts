/**
 * "Apply to be a partner" as the admin portal reads it (Marketers · Applications). Types only, so client
 * components can import them.
 */

export type PartnerApplicationStatus = "PENDING" | "APPROVED" | "DECLINED";

export const PARTNER_BUSINESS_KINDS = [
	{ value: "HOTEL", label: "Hotels" },
	{ value: "LOUNGE", label: "Lounges" },
	{ value: "BAR", label: "Bars" },
	{ value: "RESTAURANT", label: "Restaurants" },
] as const;

export const PARTNER_BUSINESS_COUNTS = [
	{ value: "1-2", label: "1–2" },
	{ value: "3-5", label: "3–5" },
	{ value: "6-10", label: "6–10" },
	{ value: "10+", label: "10+" },
] as const;

export type PartnerApplicationRow = {
	id: string;
	fullName: string;
	email: string;
	phone: string;
	city: string;
	state: string;
	/** HOTEL, LOUNGE, BAR, RESTAURANT. */
	businessKinds: string[];
	/** 1-2, 3-5, 6-10 or 10+. */
	businessCount: string;
	networkNote?: string;
	companyName?: string;
	status: PartnerApplicationStatus;
	createdAt: string;
	decidedAt?: string;
	decidedByName?: string;
	declineReason?: string;
	declineReasonShared: boolean;
	/** The marketer the approval made. */
	marketerProfileId?: string;
	marketerName?: string;
	ip?: string;
	userAgent?: string;
	rpaVersion?: string;
	privacyVersion?: string;
};

/** The approve form's defaults (Settings · Fees) and what the signed-in admin may do. */
export type PartnerReviewDefaults = {
	sharePct: number;
	months: number;
	/** Super admin and Support: the people who invite marketers. */
	canDecide: boolean;
	/** Super admin and Finance admin: a share or term other than the standard one. */
	canChangeTerms: boolean;
};

export const kindLabel = (k: string) =>
	PARTNER_BUSINESS_KINDS.find((x) => x.value === k)?.label ?? k;
export const countLabel = (c: string) =>
	PARTNER_BUSINESS_COUNTS.find((x) => x.value === c)?.label ?? c;
