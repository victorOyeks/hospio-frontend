"use server";

import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { DataPlanRenewal, DeviceCatalogueItem, DeviceInvoice, DevicePackage } from "@hospio/api/api/routes-device-packages";
import { withSession } from "@hospio/api/api/server";

/**
 * Devices and internet Hospio360 supplies to hotels (hospio-backend docs/plan-device-packages.md): the catalogue, each hotel's
 * package (put together during onboarding, installed, paid for), and the owner's and manager's read-only view.
 */

export type DeviceCatalogueRow = z.infer<typeof DeviceCatalogueItem>;
export type DevicePackageView = z.infer<typeof DevicePackage>;
export type DeviceInvoiceView = z.infer<typeof DeviceInvoice>;
export type DataPlanRenewalRow = z.infer<typeof DataPlanRenewal>;
export type DeviceItemInput = { catalogueId: string | null; name: string; kind: string; quantity: number; unitPrice: number };
export type DevicePackageInput = {
	paymentOption: string;
	items: DeviceItemInput[];
	deviceRate: number | null;
	months: number | null;
	notes: string | null;
};

const fail = <T>(error: unknown, fallback: string): ActionResult<T> => ({ ok: false, error: errorMessage(error, fallback) });

export async function deviceCatalogue(): Promise<ActionResult<DeviceCatalogueRow[]>> {
	const { data, error } = await api("@get/platform/admin/devices/catalogue", await withSession());
	return error || !data ? fail(error, "The device catalogue could not be loaded") : { ok: true, data: data.data };
}

export async function saveDeviceCatalogueItem(
	id: string | null,
	body: { name: string; kind: string; unitPrice: number; active?: boolean; sortOrder?: number },
): Promise<ActionResult<DeviceCatalogueRow>> {
	const { data, error } = id
		? await api("@put/platform/admin/devices/catalogue/:id", { ...(await withSession()), params: { id }, body })
		: await api("@post/platform/admin/devices/catalogue", { ...(await withSession()), body });
	return error || !data ? fail(error, "The item could not be saved") : { ok: true, data: data.data };
}

export async function allDevicePackages(status?: string[]): Promise<ActionResult<DevicePackageView[]>> {
	const { data, error } = await api("@get/platform/admin/devices/packages", { ...(await withSession()), query: status ? { status } : {} });
	return error || !data ? fail(error, "Device packages could not be loaded") : { ok: true, data: data.data };
}

export async function businessDevicePackages(businessId: string): Promise<ActionResult<DevicePackageView[]>> {
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/device-packages", {
		...(await withSession()),
		params: { businessId },
	});
	return error || !data ? fail(error, "Device packages could not be loaded") : { ok: true, data: data.data };
}

export async function hotelDevicePackage(businessId: string, hotelId: string): Promise<ActionResult<DevicePackageView | null>> {
	const { data, error } = await api("@get/platform/admin/businesses/:businessId/hotels/:hotelId/device-package", {
		...(await withSession()),
		params: { businessId, hotelId },
	});
	return error || !data ? fail(error, "The device package could not be loaded") : { ok: true, data: data.data };
}

export async function saveDevicePackage(
	businessId: string,
	hotelId: string,
	body: DevicePackageInput,
): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@put/platform/admin/businesses/:businessId/hotels/:hotelId/device-package", {
		...(await withSession()),
		params: { businessId, hotelId },
		body,
	});
	return error || !data ? fail(error, "The device package could not be saved") : { ok: true, data: data.data };
}

/** `signedScheduleRef`: when the owner hasn't ticked the device terms in the app, the reference of the signed device schedule instead. */
export async function installDevicePackage(
	id: string,
	installedOn: string | null,
	signedScheduleRef?: string | null,
): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@post/platform/admin/device-packages/:id/install", {
		...(await withSession()),
		params: { id },
		body: { installedOn, signedScheduleRef: signedScheduleRef?.trim() || null },
	});
	return error || !data ? fail(error, "The devices could not be marked installed") : { ok: true, data: data.data };
}

export async function recordDevicePayment(
	id: string,
	body: { amount: number; reference: string; paidOn: string | null; note: string | null },
): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@post/platform/admin/device-packages/:id/payments", { ...(await withSession()), params: { id }, body });
	return error || !data ? fail(error, "The payment could not be recorded") : { ok: true, data: data.data };
}

export async function cancelDevicePackage(id: string): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@post/platform/admin/device-packages/:id/cancel", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "The package could not be cancelled") : { ok: true, data: data.data };
}

/** The owner's business (a manager reaching it sees only their hotels). */
export async function ownerDevicePackages(): Promise<ActionResult<DevicePackageView[]>> {
	const { data, error } = await api("@get/platform/owner/devices", await withSession());
	return error || !data ? fail(error, "Devices could not be loaded") : { ok: true, data: data.data };
}

/** The manager's current hotel. */
export async function hotelDevices(): Promise<ActionResult<DevicePackageView | null>> {
	const { data, error } = await api("@get/platform/devices", await withSession());
	return error || !data ? fail(error, "Devices could not be loaded") : { ok: true, data: data.data };
}

// ---- monthly invoices (instalments and data plan) --------------------------------------------------------------------

export async function packageInvoices(id: string): Promise<ActionResult<DeviceInvoiceView[]>> {
	const { data, error } = await api("@get/platform/admin/device-packages/:id/invoices", { ...(await withSession()), params: { id } });
	return error || !data ? fail(error, "Invoices could not be loaded") : { ok: true, data: data.data };
}

export async function allDeviceInvoices(status?: string[]): Promise<ActionResult<DeviceInvoiceView[]>> {
	const { data, error } = await api("@get/platform/admin/devices/invoices", { ...(await withSession()), query: status ? { status } : {} });
	return error || !data ? fail(error, "Invoices could not be loaded") : { ok: true, data: data.data };
}

export async function markDeviceInvoicePaid(id: string, reference: string, note: string | null): Promise<ActionResult<DeviceInvoiceView>> {
	const { data, error } = await api("@post/platform/admin/device-invoices/:id/mark-paid", {
		...(await withSession()),
		params: { id },
		body: { reference, note },
	});
	return error || !data ? fail(error, "The invoice could not be marked paid") : { ok: true, data: data.data };
}

export async function runDeviceInvoices(): Promise<
	ActionResult<{ issued: number; paid: number; failed: number; overdue: number; reminded: number; flagged: number; paused: number; voided: number }>
> {
	const { data, error } = await api("@post/platform/admin/devices/invoices/run", await withSession());
	return error || !data ? fail(error, "The invoices could not be run") : { ok: true, data: data.data };
}

export async function ownerDeviceInvoices(): Promise<ActionResult<DeviceInvoiceView[]>> {
	const { data, error } = await api("@get/platform/owner/devices/invoices", await withSession());
	return error || !data ? fail(error, "Invoices could not be loaded") : { ok: true, data: data.data };
}

/** Starts a Paystack checkout for what is still owed; the owner comes back to {@code callbackUrl}. */
export async function payDeviceInvoice(id: string, callbackUrl: string | null): Promise<ActionResult<{ authorizationUrl: string; reference: string }>> {
	const { data, error } = await api("@post/platform/owner/devices/invoices/:id/pay", {
		...(await withSession()),
		params: { id },
		body: { callbackUrl },
	});
	return error || !data ? fail(error, "The payment could not be started") : { ok: true, data: data.data };
}

export async function confirmDeviceInvoice(reference: string): Promise<ActionResult<DeviceInvoiceView>> {
	const { data, error } = await api("@post/platform/owner/devices/invoices/confirm", { ...(await withSession()), query: { reference } });
	return error || !data ? fail(error, "The payment could not be confirmed") : { ok: true, data: data.data };
}

// ---- the data plan after installation ---------------------------------------------------------------------------------

/** Stop, start again (optionally at a new price) or reprice an installed package's data plan (Finance or Super admin). */
export async function setDataPlan(
	id: string,
	action: "STOP" | "START" | "PRICE",
	monthly: number | null,
): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@put/platform/admin/device-packages/:id/data-plan", {
		...(await withSession()),
		params: { id },
		body: { action, monthly },
	});
	return error || !data ? fail(error, "The data plan could not be changed") : { ok: true, data: data.data };
}

/** Hospio360 renewed the hotel's real data subscription with the provider through this day (YYYY-MM-DD). */
export async function markDataPlanRenewed(id: string, through: string): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@post/platform/admin/device-packages/:id/data-plan/renewed", {
		...(await withSession()),
		params: { id },
		body: { through },
	});
	return error || !data ? fail(error, "The renewal could not be recorded") : { ok: true, data: data.data };
}

/** Running data plans whose real subscription runs out within {@code days} (or was never recorded). */
export async function dataPlanRenewals(days = 7): Promise<ActionResult<DataPlanRenewalRow[]>> {
	const { data, error } = await api("@get/platform/admin/devices/data-plans/renewals", { ...(await withSession()), query: { days } });
	return error || !data ? fail(error, "Renewals could not be loaded") : { ok: true, data: data.data };
}
