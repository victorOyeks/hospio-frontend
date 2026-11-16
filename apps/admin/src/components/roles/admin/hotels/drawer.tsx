"use client";

import { ArrowRightIcon, BedDoubleIcon, CreditCardIcon, LogInIcon, LogOutIcon, ReceiptIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { loadHotelOverview } from "@hospio/api/actions/admin-search";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { GuestMessagePlans } from "../guest-messages";
import { HotelFeesPanel } from "../hotel-fees";
import { Loading, useLoaded } from "../live";
import { can, StagePill } from "../shared";
import { SupportAccessButton } from "../support-access-button";

/** What the panel needs to know about a hotel; the Hotels list, Payments → POS and a business's Hotels tab all have it. */
export type HotelRef = {
	id: string;
	name: string;
	businessId: string;
	businessName: string;
	stage?: string;
	city: string;
	address: string;
	rooms: number;
	timezone: string;
	manager?: string;
};

type HotelTab = "overview" | "fees" | "messages";

/**
 * One hotel in a side panel, opened from any list with `?hotel=<id>` so the link can be shared and Back closes it. Its
 * tabs (`?htab=`) hold everything about the hotel that used to sit at the bottom of the business page: today's figures, the
 * POS keys and Hospio fee collection, and the guest-message plan.
 */
export function HotelDrawer({ hotels, role }: { hotels: HotelRef[]; role: AdminRole }) {
	const [hotelId, setHotelId] = useQueryState("hotel", parseAsString.withOptions({ history: "push", scroll: false }));
	const [tab, setTab] = useQueryState("htab", parseAsString.withOptions({ scroll: false }));
	const hotel = hotels.find((h) => h.id === hotelId) ?? null;
	const money = can.money(role);
	const tabs: { key: HotelTab; label: string }[] = [
		{ key: "overview", label: "Overview" },
		...(money ? [{ key: "fees" as const, label: "POS & Hospio fees" }] : []),
		{ key: "messages", label: "Guest messages" },
	];
	const active: HotelTab = tabs.some((t) => t.key === tab) ? (tab as HotelTab) : "overview";
	const close = () => {
		void setHotelId(null);
		void setTab(null);
	};

	return (
		<SidePanel
			open={!!hotelId}
			onOpenChange={(o) => !o && close()}
			title={hotel?.name ?? "Hotel"}
			subtitle={
				hotel ? (
					<span className="flex flex-wrap items-center gap-2">
						<Link href={`/dashboard/businesses/${hotel.businessId}`} className="font-medium text-brand hover:underline">
							{hotel.businessName}
						</Link>
						{hotel.city ? <span>· {hotel.city}</span> : null}
						{hotel.stage ? <StagePill stage={hotel.stage} /> : null}
					</span>
				) : undefined
			}
			icon={BedDoubleIcon}
			width="lg"
			className="sm:max-w-[760px]"
		>
			{!hotel ? (
				<Note tone="warning">This hotel isn't in the list here. It may have been removed, or it belongs to a business you can't see.</Note>
			) : (
				<div className="flex flex-col gap-4">
					<PillTabs tabs={tabs} value={active} onChange={(k) => void setTab(k === "overview" ? null : k)} />
					{active === "overview" && <HotelOverview hotel={hotel} />}
					{active === "fees" && <HotelFeesPanel key={hotel.id} businessId={hotel.businessId} hotelId={hotel.id} role={role} />}
					{active === "messages" && (
						<GuestMessagePlans key={hotel.id} businessId={hotel.businessId} hotels={[{ id: hotel.id, name: hotel.name }]} />
					)}
				</div>
			)}
		</SidePanel>
	);
}

function HotelOverview({ hotel }: { hotel: HotelRef }) {
	const { data: overview, loading, error } = useLoaded(`${hotel.businessId}/${hotel.id}`, () => loadHotelOverview(hotel.businessId, hotel.id));
	return (
		<>
			{loading && !overview ? (
				<Loading label="Gathering today's figures…" />
			) : error || !overview ? (
				<Note tone="warning">{error ?? "Today's figures aren't available for this hotel right now. Try again in a moment."}</Note>
			) : (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					<KpiCard
						label="Occupancy"
						value={`${Math.round(overview.occupancyPct)}%`}
						icon={BedDoubleIcon}
						hint={`${overview.occupiedRooms} of ${overview.rooms || hotel.rooms || 0} rooms`}
					/>
					<KpiCard label="Arrivals today" value={overview.arrivalsToday} icon={LogInIcon} />
					<KpiCard label="Departures today" value={overview.departuresToday} icon={LogOutIcon} />
					<KpiCard label="Open folios" value={overview.openFolios} icon={ReceiptIcon} />
					<KpiCard
						label="Payments today"
						value={nairaShort(overview.paymentsTodayGross)}
						icon={CreditCardIcon}
						hint={plural(overview.paymentsTodayCount, "payment")}
					/>
					<KpiCard
						label="Manager"
						value={<span className="text-base">{overview.managerName ?? hotel.manager ?? "—"}</span>}
						icon={UserIcon}
					/>
				</div>
			)}
			<SectionCard title="Hotel">
				<DetailList
					columns={2}
					items={[
						{ label: "Business", value: hotel.businessName },
						{ label: "City", value: hotel.city || "—" },
						{ label: "Address", value: hotel.address || "—" },
						{ label: "Rooms", value: overview?.rooms || hotel.rooms || 0 },
						{ label: "Time zone", value: hotel.timezone || "—" },
						{ label: "Payments today", value: overview ? naira(overview.paymentsTodayGross) : "—" },
					]}
				/>
			</SectionCard>
			<div className="flex flex-wrap gap-2">
				<Link href={`/dashboard/businesses/${hotel.businessId}`} className={cn(btn.secondary, "flex items-center gap-2")}>
					Open the business <ArrowRightIcon className="size-4" />
				</Link>
				<Link href={`/dashboard/support?status=ALL&businessId=${hotel.businessId}`} className={btn.secondary}>
					Its support tickets
				</Link>
				<SupportAccessButton businessId={hotel.businessId} businessName={hotel.businessName} />
			</div>
		</>
	);
}
