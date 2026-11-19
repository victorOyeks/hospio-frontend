import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@hospio/ui/primitives/sidebar";
import { NavMain } from "./nav-main";
import { BranchSwitcher } from "./branch-switcher";
import { OutletSwitcher, type OutletSwitchProps } from "./outlet-switcher";
import type { HotelRole } from "@hospio/api/roles";
import type { Hotel } from "@hospio/api/api/schema";
import { hasAccommodation } from "@hospio/api/venue";
import { APP } from "@hospio/api/app";
import { cn } from "@hospio/ui/utils";
import { HospioIcon, HospioWordmark } from "../brand/logo";
import { SidebarPerson, type SidebarPersonProps } from "./sidebar-person";

export function AppSidebar({
	role,
	hotels,
	activeHotel,
	brandLogo,
	badges,
	supervisor,
	outletSwitch,
	person,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	role: HotelRole;
	hotels: Hotel[];
	activeHotel: Hotel | null;
	/** Hotel setup → Brand & colours: the hotel's logo in the branch box. */
	brandLogo?: string | null;
	badges?: React.ComponentProps<typeof NavMain>["badges"];
	supervisor?: boolean;
	/** The bar and kitchen desks: "Serving at" under the branch card when the hotel has several outlets of their kind. */
	outletSwitch?: OutletSwitchProps | null;
	/** The admin portal: who is signed in, pinned at the foot of the sidebar with Sign out. */
	person?: SidebarPersonProps | null;
}) {
	const admin = APP === "admin";
	return (
		<Sidebar
			{...props}
			className="border-r-0 bg-nav text-white [&_[data-sidebar=sidebar]]:bg-nav"
		>
			{admin ? (
				// The admin portal has no branch: Hospio360's wordmark and the console tag head it, over a thin divider. The icon
				// rail shows the H mark instead of the wordmark.
				<SidebarHeader className="gap-0 px-[12px] pb-0 pt-[22px] group-data-[collapsible=icon]:px-0">
					<div className="flex items-center gap-[10px] border-b border-white/10 px-[10px] pb-[18px] group-data-[collapsible=icon]:hidden">
						<HospioWordmark className="h-[22px] text-white" />
						<span className="rounded-[6px] bg-white/[0.14] px-[6px] py-[4px] text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-white/90">
							Admin
						</span>
					</div>
					<div className="hidden justify-center border-b border-white/10 pb-[14px] group-data-[collapsible=icon]:mx-[12px] group-data-[collapsible=icon]:flex">
						<HospioIcon tile={false} title="Hospio360 admin" className="size-[30px] text-white" />
					</div>
				</SidebarHeader>
			) : (
				// The branch box is the top of the hotel sidebar (the Hospio360 / hotel name row was removed, 2026-11-15).
				<SidebarHeader className="gap-2 px-4 pt-8">
					<BranchSwitcher hotels={hotels} active={activeHotel} logoUrl={brandLogo} />
					{outletSwitch && <OutletSwitcher {...outletSwitch} />}
				</SidebarHeader>
			)}
			<SidebarContent
				className={cn(
					"scrollbar-hidden px-4 group-data-[collapsible=icon]:px-0",
					admin && "gap-0 px-[12px] py-[12px] group-data-[collapsible=icon]:px-0",
				)}
			>
				<NavMain role={role} badges={badges} supervisor={supervisor} accommodation={hasAccommodation(activeHotel)} />
			</SidebarContent>
			{person && (
				<SidebarFooter className="gap-0 border-t border-white/10 p-[10px] group-data-[collapsible=icon]:px-0">
					<SidebarPerson {...person} />
				</SidebarFooter>
			)}
			<SidebarRail />
		</Sidebar>
	);
}
