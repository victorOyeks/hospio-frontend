"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import { withSession } from "@hospio/api/api/server";
import { toMarketerProfileRow } from "@hospio/api/data/admin";
import type { MarketerInvitedData } from "@hospio/api/data/admin-types";
import { live } from "@hospio/api/data/live";
import type { PartnerApplicationRow } from "@hospio/api/data/partner-application-types";
import { toPartnerApplicationRow } from "@hospio/api/data/partner-applications";
import { demoDelay } from "@hospio/api/demo/mode";

/**
 * Marketers · Applications: approve (the usual marketer invite, then the application is linked to the marketer it made)
 * and decline with a reason. Super admin and Support; the server refuses anyone else.
 */

export type PartnerApplicationApproved = MarketerInvitedData & {
	application: PartnerApplicationRow;
};

/** POST /platform/admin/partner-applications/{id}/approve. */
export async function approvePartnerApplication(
	application: PartnerApplicationRow,
	input: {
		fullName: string;
		email: string;
		phone?: string;
		sharePct: number;
		months: number;
	},
): Promise<ActionResult<PartnerApplicationApproved>> {
	if (!live("platform")) {
		await demoDelay(500);
		return {
			ok: true,
			data: {
				application: {
					...application,
					status: "APPROVED",
					decidedAt: new Date().toISOString(),
					marketerName: input.fullName,
				},
				profile: {
					id: `mk-${Date.now()}`,
					fullName: input.fullName,
					email: input.email,
					phone: input.phone ?? "",
					status: "PENDING",
					sharePct: input.sharePct,
					months: input.months,
					joined: new Date().toISOString().slice(0, 10),
					referralCode: "HM-DEMO01",
					businesses: 0,
					earnedTotal: 0,
					due: 0,
				},
				login: {
					userId: `u-${Date.now()}`,
					inviteToken: `demo-invite-${Date.now().toString(36)}`,
					inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
				},
				deliveries: [],
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/partner-applications/:id/approve",
		{
			...(await withSession()),
			params: { id: application.id },
			body: {
				fullName: input.fullName,
				email: input.email,
				// Empty (the admin cleared it) invites without a phone; the service keeps the applicant's only when none is sent.
				phone: input.phone ?? "",
				sharePct: input.sharePct,
				months: input.months,
			},
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The application could not be approved"),
		};
	revalidatePath("/admin/marketers");
	const d = data.data;
	return {
		ok: true,
		data: {
			application: toPartnerApplicationRow(d.application),
			profile: toMarketerProfileRow(d.invited.profile),
			login: d.invited.login
				? {
						userId: d.invited.login.userId,
						temporaryPassword: d.invited.login.temporaryPassword ?? undefined,
						temporaryPasswordExpiresAt:
							d.invited.login.temporaryPasswordExpiresAt ?? undefined,
						inviteToken: d.invited.login.inviteToken ?? undefined,
						inviteExpiresAt: d.invited.login.inviteExpiresAt ?? undefined,
					}
				: undefined,
			deliveries: d.invited.deliveries ?? [],
		},
	};
}

/** POST /platform/admin/partner-applications/{id}/decline: the reason is kept; it goes in the email only with `shareReason`. */
export async function declinePartnerApplication(
	application: PartnerApplicationRow,
	input: { reason: string; shareReason: boolean },
): Promise<ActionResult<PartnerApplicationRow>> {
	if (!live("platform")) {
		await demoDelay(400);
		return {
			ok: true,
			data: {
				...application,
				status: "DECLINED",
				decidedAt: new Date().toISOString(),
				declineReason: input.reason,
				declineReasonShared: input.shareReason,
			},
		};
	}
	const { data, error } = await api(
		"@post/platform/admin/partner-applications/:id/decline",
		{
			...(await withSession()),
			params: { id: application.id },
			body: { reason: input.reason, shareReason: input.shareReason },
		},
	);
	if (error || !data)
		return {
			ok: false,
			error: errorMessage(error, "The application could not be declined"),
		};
	revalidatePath("/admin/marketers");
	return { ok: true, data: toPartnerApplicationRow(data.data) };
}
