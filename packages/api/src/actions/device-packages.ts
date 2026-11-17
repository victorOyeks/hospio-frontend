"use server";

import type { z } from "zod";
import type { ActionResult } from "@hospio/api/actions/auth";
import { api, errorMessage } from "@hospio/api/api/client";
import type { DeviceCatalogueItem, DevicePackage } from "@hospio/api/api/routes-device-packages";
import { withSession } from "@hospio/api/api/server";

/**
 * Devices and internet Hospio360 supplies to hotels (hospio-backend docs/plan-device-packages.md): the catalogue, each hotel's
 * package (put together during onboarding, installed, paid for), and the owner's and manager's read-only view.
 */

export type DeviceCatalogueRow = z.infer<typeof DeviceCatalogueItem>;
export type DevicePackageView = z.infer<typeof DevicePackage>;
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

export async function installDevicePackage(id: string, installedOn: string | null): Promise<ActionResult<DevicePackageView>> {
	const { data, error } = await api("@post/platform/admin/device-packages/:id/install", {
		...(await withSession()),
		params: { id },
		body: { installedOn },
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
