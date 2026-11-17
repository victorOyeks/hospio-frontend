"use server";

import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { DailyFee, DayRun, DebitRun, FeeCollection, PosConfig, PosProviderKeys } from "@hospio/api/api/routes-fees";
import { withSession } from "@hospio/api/api/server";

/**
 * Hospio's daily fee (hospio-backend docs/plan-daily-fees.md) and each hotel's POS keys (docs/pos-providers.md): the owner's
 * Hospio fees screen, the hotel's read-only POS keys, and the admin portal's daily fees, fee collection switch and POS keys.
 */

export type DailyFeeRow = z.infer<typeof DailyFee>;
export type FeeCollectionView = z.infer<typeof FeeCollection>;
export type PosConfigView = z.infer<typeof PosConfig>;
export type PosProviderKeysView = z.infer<typeof PosProviderKeys>;
export type DayRunResult = z.infer<typeof DayRun>;
export type DebitRunResult = z.infer<typeof DebitRun>;

const fail = <T>(error: unknown, fallback: string): ActionResult<T> => ({ ok: false, error: errorMessage(error, fallback) });

// ---- the hotel's own -----------------------------------------------------------------------------------------------

export async function ownerDailyFees(from?: string, to?: string): Promise<ActionResult<DailyFeeRow[]>> {
	const { data, error } = await api("@get/platform/owner/fees/daily", { ...(await withSession()), query: { from, to } });
	return error || !data ? fail(error, "Hospio fees could not be loaded") : { ok: true, data: data.data };
}

/** A manager's own hotel's daily fees (read-only; the fee is debited automatically, nothing to pay here). */
export async function hotelDailyFees(from?: string, to?: string): Promise<ActionResult<DailyFeeRow[]>> {
	const { data, error } = await api("@get/platform/fees/daily", { ...(await withSession()), query: { from, to } });
	return error || !data ? fail(error, "Hospio fees could not be loaded") : { ok: true, data: data.data };
}

export async function hotelPosConfig(): Promise<ActionResult<PosConfigView>> {
	const { data, error } = await api("@get/payment/pos-config", await withSession());
	return error || !data ? fail(error, "The POS provider could not be loaded") : { ok: true, data: data.data };
}

// ---- Hospio360 admin -----------------------------------------------------------------------------------------------

export async function adminDailyFees(q: { businessId?: string; hotelId?: string; from?: string; to?: string }): Promise<ActionResult<DailyFeeRow[]>> {
	const { data, error } = await api("@get/platform/admin/fees/daily", { ...(await withSession()), query: q });
	return error || !data ? fail(error, "Daily fees could not be loaded") : { ok: true, data: data.data };
}

export async function runFeeDay(date: string): Promise<ActionResult<DayRunResult>> {
	const { data, error } = await api("@post/platform/admin/fees/daily/run", { ...(await withSession()), query: { date } });
	return error || !data ? fail(error, "The day could not be worked out") : { ok: true, data: data.data };
}

export async function runFeeDebit(): Promise<ActionResult<DebitRunResult>> {
	const { data, error } = await api("@post/platform/admin/fees/daily/debit", await withSession());
	return error || !data ? fail(error, "The debit could not be run") : { ok: true, data: data.data };
}

export async function redoFeeDay(id: string): Promise<ActionResult<DailyFeeRow>> {
	const { data, error } = await api("@post/platform/admin/fees/daily/:id/redo", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The day could not be worked out again") : { ok: true, data: data.data };
}

export async function feeCollection(businessId: string, hotelId: string): Promise<ActionResult<FeeCollectionView>> {
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/hotels/:hotelId/fee-collection", {
		...(await withSession()),
		params: { businessId, hotelId },
	});
	return error || !data ? fail(error, "Fee collection could not be loaded") : { ok: true, data: data.data };
}

export async function setFeeCollection(
	businessId: string,
	hotelId: string,
	provider: string | null,
	debitEnabled: boolean,
): Promise<ActionResult<FeeCollectionView>> {
	const { data, error } = await api("@put/platform/admin/businesses/:businessId/hotels/:hotelId/fee-collection", {
		...(await withSession()),
		params: { businessId, hotelId },
		body: { provider, debitEnabled },
	});
	return error || !data ? fail(error, "Fee collection could not be saved") : { ok: true, data: data.data };
}

export async function adminPosConfig(hotelId: string): Promise<ActionResult<PosConfigView>> {
	const { data, error } = await api("@get/payment/admin/hotels/:hotelId/pos-config", { ...(await withSession()), params: { hotelId } });
	return error || !data ? fail(error, "POS keys could not be loaded") : { ok: true, data: data.data };
}

/** Removes one provider's keys; the hotel's other provider is untouched. */
export async function removeAdminPosConfig(hotelId: string, provider: string): Promise<ActionResult<PosConfigView>> {
	const { data, error } = await api("@delete/payment/admin/hotels/:hotelId/pos-config/:provider", {
		...(await withSession()),
		params: { hotelId, provider },
	});
	return error || !data ? fail(error, "POS keys could not be removed") : { ok: true, data: data.data };
}

export async function saveAdminPosConfig(
	businessId: string,
	hotelId: string,
	provider: string,
	fields: Record<string, string>,
): Promise<ActionResult<PosConfigView>> {
	const { data, error } = await api("@put/payment/admin/hotels/:hotelId/pos-config", {
		...(await withSession()),
		params: { hotelId },
		body: { businessId, provider, fields },
	});
	return error || !data ? fail(error, "POS keys could not be saved") : { ok: true, data: data.data };
}
