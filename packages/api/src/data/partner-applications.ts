import "server-only";

import { api, errorMessage } from "@hospio/api/api/client";
import type { PartnerApplication } from "@hospio/api/api/routes-partner";
import { withSession } from "@hospio/api/api/server";
import { live } from "./live";
import type {
	PartnerApplicationRow,
	PartnerApplicationStatus,
	PartnerReviewDefaults,
} from "./partner-application-types";
import {
	failedPage,
	type PageResult,
	slicePage,
	toPaged,
} from "./paging";

/**
 * Marketers · Applications (platform-service `/admin/partner-applications`, hospio-backend docs/plan-marketers.md):
 * the applications sent from the landing site's "Apply to be a partner" form, a page at a time.
 */

const statusOf = (s: string): PartnerApplicationStatus =>
	s === "APPROVED" || s === "DECLINED" ? s : "PENDING";

export const toPartnerApplicationRow = (
	a: PartnerApplication,
): PartnerApplicationRow => ({
	id: a.id,
	fullName: a.fullName,
	email: a.email,
	phone: a.phone ?? "",
	city: a.city ?? "",
	state: a.state ?? "",
	businessKinds: a.businessKinds ?? [],
	businessCount: a.businessCount ?? "",
	networkNote: a.networkNote ?? undefined,
	companyName: a.companyName ?? undefined,
	status: statusOf(a.status),
	createdAt: a.createdAt ?? "",
	decidedAt: a.decidedAt ?? undefined,
	decidedByName: a.decidedByName ?? undefined,
	declineReason: a.declineReason ?? undefined,
	declineReasonShared: a.declineReasonShared ?? false,
	marketerProfileId: a.marketerProfileId ?? undefined,
	marketerName: a.marketerName ?? undefined,
	ip: a.ip ?? undefined,
	userAgent: a.userAgent ?? undefined,
	rpaVersion: a.rpaVersion ?? undefined,
	privacyVersion: a.privacyVersion ?? undefined,
});

/** Demo mode: two made-up applications, so the tab has something to show. */
const demoApplications: PartnerApplicationRow[] = [
	{
		id: "pa-demo-1",
		fullName: "Ngozi Adebanjo",
		email: "ngozi@example.com",
		phone: "+2348000000101",
		city: "Ikeja",
		state: "Lagos",
		businessKinds: ["HOTEL", "LOUNGE"],
		businessCount: "3-5",
		networkNote: "I supply drinks to lounges and small hotels on the mainland.",
		companyName: "Adebanjo Supplies",
		status: "PENDING",
		createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
		declineReasonShared: false,
		rpaVersion: "RPA-2026-11",
		privacyVersion: "PRIV-2026-11",
	},
	{
		id: "pa-demo-2",
		fullName: "Tunde Bassey",
		email: "tunde@example.com",
		phone: "+2348000000102",
		city: "Uyo",
		state: "Akwa Ibom",
		businessKinds: ["RESTAURANT"],
		businessCount: "1-2",
		status: "DECLINED",
		createdAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
		decidedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
		decidedByName: "Demo Admin",
		declineReason: "Outside the cities we cover for now",
		declineReasonShared: false,
	},
];

export const partnerApplicationsData = {
	/** GET /platform/admin/partner-applications: newest first; `counts` per status, and `pendingTotal` for the tab's badge. */
	list: async (
		query: { status?: string; q?: string; page?: number; size?: number } = {},
	): Promise<PageResult<PartnerApplicationRow>> => {
		if (!live("platform")) {
			const rows = demoApplications.filter(
				(a) =>
					(!query.status || a.status === query.status) &&
					(!query.q ||
						`${a.fullName} ${a.email} ${a.city}`
							.toLowerCase()
							.includes(query.q.toLowerCase())),
			);
			const count = (s: string) =>
				demoApplications.filter((a) => a.status === s).length;
			return {
				ok: true,
				data: slicePage(rows, query.page, query.size, {
					counts: {
						all: demoApplications.length,
						PENDING: count("PENDING"),
						APPROVED: count("APPROVED"),
						DECLINED: count("DECLINED"),
						pendingTotal: count("PENDING"),
					},
				}),
			};
		}
		const { data: res, error } = await api(
			"@get/platform/admin/partner-applications",
			{
				...(await withSession()),
				query: {
					...(query.status ? { status: query.status } : {}),
					...(query.q?.trim() ? { q: query.q.trim() } : {}),
					page: query.page ?? 0,
					size: query.size ?? 25,
				},
			},
		);
		if (error || !res) {
			console.error("platform-service partner applications:", error);
			return failedPage(
				errorMessage(error, "The applications didn't load"),
				query.size,
			);
		}
		return { ok: true, data: toPaged(res.data, toPartnerApplicationRow) };
	},

	/** GET /platform/admin/partner-applications/{id}: one application (the bell's link), or null. */
	get: async (id: string): Promise<PartnerApplicationRow | null> => {
		if (!live("platform"))
			return demoApplications.find((a) => a.id === id) ?? null;
		const { data: res, error } = await api(
			"@get/platform/admin/partner-applications/:id",
			{ ...(await withSession()), params: { id } },
		);
		if (error || !res) return null;
		return toPartnerApplicationRow(res.data);
	},

	/** GET /platform/admin/partner-applications/defaults: the standard share and months, and what this admin may do. */
	defaults: async (role: string): Promise<PartnerReviewDefaults> => {
		const byRole: PartnerReviewDefaults = {
			sharePct: 20,
			months: 12,
			canDecide: role === "SUPER_ADMIN" || role === "SUPPORT",
			canChangeTerms: role === "SUPER_ADMIN" || role === "FINANCE_ADMIN",
		};
		if (!live("platform")) return byRole;
		const { data: res, error } = await api(
			"@get/platform/admin/partner-applications/defaults",
			await withSession(),
		);
		if (error || !res) {
			console.error("platform-service partner application defaults:", error);
			return byRole;
		}
		return res.data;
	},
};

