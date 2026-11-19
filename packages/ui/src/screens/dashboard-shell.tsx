import { mySuspension } from "@hospio/api/actions/suspension";
import { SuspensionWatch } from "./suspended";
import { SetupLinks } from "@hospio/ui/shared/field";
import { NotUsedHere } from "@hospio/ui/shared/not-used-here";
import { isStayOnlyPath } from "@hospio/ui/links";
import { businessWording, hasAccommodation, venueNoun, wording } from "@hospio/api/venue";
import { WordingProvider } from "@hospio/ui/shared/wording";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider as JotaiProvider } from "jotai";
import { AppSidebar } from "@hospio/ui/shared/app-sidebar";
import { Header } from "@hospio/ui/shared/header";
import { SidebarInset, SidebarProvider } from "@hospio/ui/primitives/sidebar";
import { SupportBar } from "@hospio/ui/shared/support-bar";
import { LegalGate } from "@hospio/ui/shared/legal";
import { loadMyLegal } from "@hospio/api/actions/legal";
import { billingStatus } from "@hospio/api/actions/billing";
import { BillingBanner } from "@hospio/ui/shared/billing-banner";
import { logout } from "@hospio/api/actions/auth";
import { APP } from "@hospio/api/app";
import { data } from "@hospio/api/data";
import {
	getActiveHotel,
	getActiveRole,
	getBusiness,
	getHotels,
	getSession,
	getUser,
} from "@hospio/api/dal";
import { live } from "@hospio/api/data/live";
import {
	isHousekeepingSupervisor,
	seesAllOutlets,
} from "@hospio/api/supervisor";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import {
	REFRESHED_COOKIE,
	refreshUrl,
	tokenIsStale,
} from "@hospio/api/session-refresh";
import { cn } from "@hospio/ui/utils";
import { roleLabel } from "@hospio/api/roles";
import { brandStyle, encodeBrandCookie } from "@hospio/api/brand";
import { RememberBrand } from "@hospio/ui/shared/remember-brand";
import { DraftUser } from "@hospio/ui/shared/draft";
import { getSharedDevice, pinPromptAsked } from "@hospio/api/device";
import type { Hotel, Me } from "@hospio/api/api/schema";
import {
	type DeviceSetupHotel,
	IdleLock,
	PinPrompt,
} from "@hospio/ui/shared/shared-device";
import {
	DEVICE_ROLES,
	SHARED_DESK_ROLES,
} from "@hospio/ui/shared/shared-device-roles";

/** The hotels where this person may set up a shared device, with the roles they may pick there (docs/shared-devices.md). */
function deviceSetupHotels(user: Me, hotels: Hotel[]): DeviceSetupHotel[] {
	const owner = user.roles.includes("OWNER");
	return hotels
		.map((h) => {
			const here = user.roleLevels.filter((g) => g.hotelId === h.id);
			const roles =
				owner || here.some((g) => g.role === "MANAGER")
					? DEVICE_ROLES
					: here
							.filter((g) => g.level === "FULL")
							.map((g) => g.role)
							.filter((r) => (DEVICE_ROLES as string[]).includes(r));
			return { id: h.id, name: h.name, roles: [...new Set(roles)] };
		})
		.filter((h) => h.roles.length > 0);
}

export async function DashboardShell({ children }: PropsWithChildren) {
	const [session, user, role, hotels, activeHotel] = await Promise.all([
		getSession(),
		getUser(),
		getActiveRole(),
		getHotels(),
		getActiveHotel(),
	]);
	// "View as owner" from the admin portal: a read-only session with the admin in `act`.
	const support = session.actedBy ? { endsAt: session.exp } : null;
	if (!DEMO_AUTH && live("identity")) {
		// A manager changed this person's roles since the token was issued: the services refuse the old token
		// (401 "Your access has changed"), so swap it for one with the current roles and come back to this page.
		const from = (await headers()).get("x-hospio-path");
		const justRefreshed = !!(await cookies()).get(REFRESHED_COOKIE)?.value;
		if ((!user || tokenIsStale(session, user)) && !(justRefreshed && user))
			redirect(refreshUrl(from));
	}
	if (!user) redirect("/auth");
	if (!user.changedPassword) redirect("/reset-password");
	if (!role) redirect("/select-role");

	// Real suspension (hospio-backend docs/suspension.md): everyone at a suspended business gets the one screen, whatever page
	// they asked for; the services refuse everything else anyway. Support viewing as the owner still sees the business.
	if (APP === "hotel" && user.businessId && !support && !DEMO_AUTH) {
		const suspension = await mySuspension().catch(() => null);
		if (suspension?.suspended) {
			// Back from Paystack through an old link: keep the payment reference so it is confirmed there.
			const asked = (await headers()).get("x-hospio-path") ?? "";
			const reference = new URLSearchParams(asked.split("?")[1] ?? "").get("reference");
			redirect(reference ? `/suspended?reference=${encodeURIComponent(reference)}` : "/suspended");
		}
	}

	// Everything below depends only on who is signed in and the role: one round of calls, not five in a row.
	const ownerHotel = APP === "hotel" && role === "OWNER";
	const [
		business,
		shared,
		asked,
		unread,
		unpaidSales,
		inbox,
		approvals,
		brand,
		desk,
		legal,
		billing,
	] = await Promise.all([
		// getBusiness answers from the fixture (LIVE) in demo mode, so nothing changes there.
		ownerHotel ? getBusiness() : Promise.resolve(null),
		APP === "hotel" && !DEMO_AUTH ? getSharedDevice() : Promise.resolve(null),
		pinPromptAsked(),
		data.notifications.unreadCount().catch(() => 0),
		// The bar and kitchen see how many sales still owe money next to Sales.
		role === "BAR" || role === "KITCHEN" || role === "CASHIER"
			? data.outlets.unpaidSales(role, seesAllOutlets(session, role)).catch(() => null)
			: Promise.resolve(null),
		// Every hotel role: unread staff messages next to Inbox (the owner's Messaging).
		APP === "hotel" && !support
			? data.owner.inboxUnread().catch(() => null)
			: Promise.resolve(null),
		// The manager: approvals waiting for a decision next to Approvals.
		role === "MANAGER"
			? data.approvals
					.page({ tab: "waiting", size: 1 })
					.then((r) => (r.ok ? (r.data.counts?.waiting ?? r.data.total) : null))
					.catch(() => null)
			: Promise.resolve(null),
		// Hotel setup → Brand & colours: the hotel's colour, sidebar, short name and logo on every screen.
		APP === "hotel" && activeHotel
			? data.hotels.brand().catch(() => null)
			: Promise.resolve(null),
		// The bar and kitchen: their outlets for "Serving at" (shown only when there are several of their kind).
		// A waiter picks the outlet they serve at too (any outlet of the location); a cashier collects for all of them.
		APP === "hotel" && (role === "BAR" || role === "KITCHEN" || role === "WAITER")
			? data.outlets
					.desk(role, seesAllOutlets(session, role))
					.catch(() => null)
			: Promise.resolve(null),
		// The legal documents this person still has to accept (hospio-backend docs/legal-acceptance.md); never while support views as the owner.
		support ? Promise.resolve(null) : loadMyLegal().catch(() => null),
		// Hospio360's monthly invoice banner (docs/plan-monthly-invoices.md): reminders for the owner and managers, the pause for everyone.
		APP === "hotel" && user.businessId ? billingStatus().catch(() => null) : Promise.resolve(null),
	]);
	if (ownerHotel) {
		// A self-serve owner still in the wizard goes back to it; one handed over by Hospio360 reviews the
		// handover first.
		if (business?.stage === "ONBOARDING" && business.source === "SELF_SERVE")
			redirect("/onboarding");
		if (business?.stage === "HANDED_OVER") redirect("/handover");
	}

	// Shared devices (docs/shared-devices.md in hospio-backend): a removed device forgets its token and goes to sign-in; on a
	// shared device the header has Lock and the idle lock runs; anyone with Full access, a manager or the owner can set one up.
	if (shared?.state === "removed") redirect("/api/device/forget");
	const device = shared?.state === "ok" ? shared.device : null;
	const setupHotels =
		APP === "hotel" && !support && !shared?.device && shared?.state !== "error"
			? deviceSetupHotels(user, hotels)
			: [];
	const pinPrompt =
		APP === "hotel" &&
		!support &&
		!user.hasPin &&
		!user.roles.includes("OWNER") &&
		!!user.businessId &&
		asked &&
		(!!device || user.roles.some((r) => SHARED_DESK_ROLES.includes(r)));

	// The legal gate (hospio-backend docs/legal-acceptance.md) comes first: the PIN prompt waits until the terms are accepted.
	const legalGate = !!legal?.canAccept && legal.pending.length > 0;

	// A lounge, bar or restaurant (no accommodation, docs/plan-venue-type.md): pages about rooms and stays answer "Not used at a
	// lounge" for the active location, even when opened from a bookmark.
	const accommodation = APP !== "hotel" || hasAccommodation(activeHotel);
	const visiblePath = APP === "hotel" ? ((await headers()).get("x-hospio-path") ?? "") : "";
	const notUsedHere = !accommodation && !!visiblePath && isStayOnlyPath(role, visiblePath);

	const badges = {
		...(unpaidSales ? { unpaidSales } : {}),
		...(inbox ? { inbox } : {}),
		...(approvals ? { approvals } : {}),
	};

	return (
		<NuqsAdapter>
			{/* Half-typed forms and the page to come back to after the lock screen belong to this person (shared/draft.tsx);
			    not kept while support views as the owner. */}
			<DraftUser userId={support ? null : user.id}>
			<JotaiProvider>
			{/* The words every screen uses for the active location and the business (docs/plan-venue-type.md, phase 5). */}
			<WordingProvider
				place={APP === "hotel" ? wording(activeHotel) : wording(null)}
				biz={APP === "hotel" ? businessWording(hotels, business?.venueKind) : wording(null)}
				stays={accommodation}
				anyStays={APP !== "hotel" || hotels.length === 0 || hotels.some((h) => hasAccommodation(h))}
			>
				{/* Always the hotel's own brand, Hospio360 maroon included, so it replaces a look this browser remembered. */}
				{brand && (
					<style
						id="hotel-brand"
						// Built from a validated #rrggbb only (packages/api/src/brand.ts).
						// biome-ignore lint/security/noDangerouslySetInnerHtml: generated CSS, no user text
						dangerouslySetInnerHTML={{ __html: brandStyle(brand) }}
					/>
				)}
				{/* The sign-in screens keep this hotel's look after logout (not while support views as the owner). */}
				{brand && activeHotel && !support && (
					<RememberBrand value={encodeBrandCookie(brand, activeHotel.name)} />
				)}
				{support && <SupportBar endsAt={support.endsAt} />}
				{legal && legalGate && (
					<LegalGate
						pending={legal.pending}
						firstTime={!legal.records.some((r) => r.event === "ACCEPTED")}
						marketer={user.roles.includes("MARKETER")}
						signOut={logout}
					/>
				)}
				<SidebarProvider
					className={cn(
						support &&
							"pt-10 [&_[data-slot=sidebar-container]]:top-10 [&_[data-slot=sidebar-container]]:h-[calc(100svh-2.5rem)]",
					)}
				>
					<AppSidebar
						collapsible="icon"
						role={role}
						hotels={hotels}
						activeHotel={activeHotel}
						brandLogo={brand?.logoUrl ?? null}
						badges={badges}
						person={APP === "admin" ? { name: user.fullName, role: roleLabel(role) } : null}
						supervisor={
							role !== "HOUSEKEEPING" || isHousekeepingSupervisor(session)
						}
						outletSwitch={
							desk &&
							desk.outlets.length > 1 &&
							(role === "BAR" || role === "KITCHEN" || role === "WAITER")
								? {
										desk: role,
										outlets: desk.outlets.map((o) => ({
											id: o.id,
											name: o.name,
											kind: o.kind,
										})),
										current: desk.outlet?.id,
										all: desk.all,
										canSeeAll: seesAllOutlets(session, role),
									}
								: null
						}
					/>
					{/* min-w-0: wide tables scroll inside their card instead of pushing the page sideways. */}
					<SidebarInset className="min-w-0 bg-page">
						<Header
							user={user}
							role={role}
							hotelCount={hotels.length}
							unread={unread}
							device={device ? { name: device.name } : undefined}
							setupHotels={setupHotels}
							activeHotelId={activeHotel?.id}
						/>
						{APP === "hotel" && user.businessId && !support && !DEMO_AUTH && <SuspensionWatch />}
						{device && <IdleLock minutes={device.autoLockMinutes} />}
						{pinPrompt && !legalGate && <PinPrompt onDevice={!!device} />}
						<div className="flex flex-1 flex-col gap-5 px-5 py-6 lg:px-8">
							{APP === "hotel" && user.businessId && <BillingBanner initial={billing} role={role} />}
							{/* "Manage … in Hotel setup" links only where Hotel setup exists (manager, owner). */}
							<SetupLinks allowed={role === "MANAGER" || role === "OWNER"}>
								{notUsedHere ? (
									<NotUsedHere place={venueNoun(activeHotel)} locationName={activeHotel?.name} setup={wording(activeHotel).setup} />
								) : (
									children
								)}
							</SetupLinks>
						</div>
					</SidebarInset>
				</SidebarProvider>
			</WordingProvider>
			</JotaiProvider>
			</DraftUser>
		</NuqsAdapter>
	);
}
