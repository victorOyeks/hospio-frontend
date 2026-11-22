import "server-only";

import { api, errorMessage } from "@hospio/api/api/client";
import type { HotelApplication } from "@hospio/api/api/routes-hotel-applications";
import { withSession } from "@hospio/api/api/server";
import type {
	HotelApplicationNoteRow,
	HotelApplicationPermissions,
	HotelApplicationRow,
	HotelApplicationStatus,
} from "./hotel-application-types";
import { MONTHLY_SALES_NOT_ASKED, monthlySalesRank } from "./hotel-application-types";
import { live } from "./live";
import { failedPage, type PageResult, slicePage, toPaged } from "./paging";

/**
 * Hotel applications (platform-service `/admin/hotel-applications`, hospio-backend docs/onboarding.md "Applications"): the
 * "Book a demo" requests from the landing site, a page at a time, and one with its timeline.
 */

const STATUSES: HotelApplicationStatus[] = ["NEW", "CONTACTED", "MEETING_BOOKED", "APPROVED", "ONBOARDED", "DECLINED"];
const statusOf = (s: string): HotelApplicationStatus =>
	(STATUSES as string[]).includes(s) ? (s as HotelApplicationStatus) : "NEW";
const kindOf = (k: string): HotelApplicationNoteRow["kind"] => (k === "STATUS" || k === "SYSTEM" ? k : "NOTE");

export const toHotelApplicationRow = (a: HotelApplication): HotelApplicationRow => ({
	id: a.id,
	ownerName: a.ownerName,
	email: a.email ?? "",
	phone: a.phone ?? "",
	businessName: a.businessName,
	businessType: a.businessType,
	city: a.city ?? "",
	state: a.state ?? "",
	rooms: a.rooms ?? undefined,
	monthlySales: a.monthlySales ?? undefined,
	heardFrom: a.heardFrom ?? undefined,
	preferredTime: a.preferredTime ?? undefined,
	message: a.message ?? undefined,
	referralCode: a.referralCode ?? undefined,
	marketerProfileId: a.marketerProfileId ?? undefined,
	marketerName: a.marketerName ?? undefined,
	status: statusOf(a.status),
	statusChangedAt: a.statusChangedAt ?? undefined,
	assigneeId: a.assigneeId ?? undefined,
	assigneeName: a.assigneeName ?? undefined,
	meetingAt: a.meetingAt ?? undefined,
	declineReason: a.declineReason ?? undefined,
	businessId: a.businessId ?? undefined,
	linkedBusinessName: a.linkedBusinessName ?? undefined,
	onboardedAt: a.onboardedAt ?? undefined,
	createdAt: a.createdAt ?? "",
	ip: a.ip ?? undefined,
	userAgent: a.userAgent ?? undefined,
	notes: (a.notes ?? []).map((n) => ({
		id: n.id,
		kind: kindOf(n.kind),
		body: n.body,
		authorName: n.authorName ?? "Hospio360",
		createdAt: n.createdAt ?? "",
	})),
});

/** Demo mode: two made-up requests, so the page has something to show. */
const demoApplications: HotelApplicationRow[] = [
	{
		id: "ha-demo-1",
		ownerName: "Bola Ade",
		email: "bola@example.com",
		phone: "+2348000000201",
		businessName: "Palm Court Suites",
		businessType: "HOTEL",
		city: "Ikeja",
		state: "Lagos",
		rooms: 24,
		monthlySales: "FROM_5M_TO_20M",
		heardFrom: "MARKETER",
		preferredTime: "MORNING",
		message: "We have 24 rooms and a small bar.",
		referralCode: "HM-DEMO01",
		marketerName: "Ada Marketer",
		status: "NEW",
		createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
		notes: [],
	},
	{
		id: "ha-demo-2",
		ownerName: "Chidi Okafor",
		email: "chidi@example.com",
		phone: "+2348000000202",
		businessName: "Blue Note Lounge",
		businessType: "LOUNGE",
		city: "Wuse",
		state: "FCT",
		heardFrom: "SOCIAL",
		status: "CONTACTED",
		createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
		notes: [],
	},
];

export const hotelApplicationsData = {
	/**
	 * GET /platform/admin/hotel-applications: newest first, or `sort: "SALES"` (highest monthly sales band first, Prefer not to say
	 * then Not asked last); `monthlySales` filters by band (or NOT_ASKED); `counts` per status (and OPEN) follow the search and band,
	 * `newTotal` for the badge.
	 */
	list: async (
		query: {
			status?: string;
			q?: string;
			assigneeId?: string;
			monthlySales?: string;
			sort?: string;
			page?: number;
			size?: number;
		} = {},
	): Promise<PageResult<HotelApplicationRow>> => {
		if (!live("platform")) {
			const open = (a: HotelApplicationRow) => a.status !== "ONBOARDED" && a.status !== "DECLINED";
			const band = (a: HotelApplicationRow) =>
				!query.monthlySales ||
				(query.monthlySales === MONTHLY_SALES_NOT_ASKED ? !a.monthlySales : a.monthlySales === query.monthlySales);
			const rows = demoApplications.filter(
				(a) =>
					(!query.status || (query.status === "OPEN" ? open(a) : a.status === query.status)) &&
					band(a) &&
					(!query.q || `${a.ownerName} ${a.businessName} ${a.city}`.toLowerCase().includes(query.q.toLowerCase())),
			);
			if (query.sort === "SALES") rows.sort((x, y) => monthlySalesRank(x.monthlySales) - monthlySalesRank(y.monthlySales));
			const counts: Record<string, number> = { all: demoApplications.length, OPEN: demoApplications.filter(open).length };
			for (const s of STATUSES) counts[s] = demoApplications.filter((a) => a.status === s).length;
			counts.newTotal = counts.NEW ?? 0;
			return { ok: true, data: slicePage(rows, query.page, query.size, { counts }) };
		}
		const { data: res, error } = await api("@get/platform/admin/hotel-applications", {
			...(await withSession()),
			query: {
				...(query.status ? { status: query.status } : {}),
				...(query.q?.trim() ? { q: query.q.trim() } : {}),
				...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
				...(query.monthlySales ? { monthlySales: query.monthlySales } : {}),
				...(query.sort ? { sort: query.sort } : {}),
				page: query.page ?? 0,
				size: query.size ?? 25,
			},
		});
		if (error || !res) {
			console.error("platform-service hotel applications:", error);
			return failedPage(errorMessage(error, "The applications didn't load"), query.size);
		}
		return { ok: true, data: toPaged(res.data, toHotelApplicationRow) };
	},

	/** GET /platform/admin/hotel-applications/{id}: one request with its timeline, or null. */
	get: async (id: string): Promise<HotelApplicationRow | null> => {
		if (!live("platform")) return demoApplications.find((a) => a.id === id) ?? null;
		const { data: res, error } = await api("@get/platform/admin/hotel-applications/:id", {
			...(await withSession()),
			params: { id },
		});
		if (error || !res) return null;
		return toHotelApplicationRow(res.data);
	},

	/** GET /platform/admin/hotel-applications/new-count: the sidebar badge. Null when it can't be read. */
	newCount: async (): Promise<number | null> => {
		if (!live("platform")) return demoApplications.filter((a) => a.status === "NEW").length;
		const { data: res, error } = await api("@get/platform/admin/hotel-applications/new-count", await withSession());
		if (error || !res) return null;
		return res.data.count;
	},

	/** GET /platform/admin/hotel-applications/permissions; by role when it can't be read. */
	permissions: async (role: string): Promise<HotelApplicationPermissions> => {
		const byRole = {
			canUpdate: role === "SUPER_ADMIN" || role === "SUPPORT",
			canDecline: role === "SUPER_ADMIN" || role === "SUPPORT",
		};
		if (!live("platform")) return byRole;
		const { data: res, error } = await api("@get/platform/admin/hotel-applications/permissions", await withSession());
		if (error || !res) return byRole;
		return res.data;
	},
};
