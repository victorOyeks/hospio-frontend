import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@hospio/ui/primitives/sidebar";
import { NavMain } from "./nav-main";
import { BranchSwitcher } from "./branch-switcher";
import { OutletSwitcher, type OutletSwitchProps } from "./outlet-switcher";
import type { HotelRole } from "@hospio/api/roles";
import type { Hotel } from "@hospio/api/api/schema";
import { hasAccommodation } from "@hospio/api/venue";

export function AppSidebar({
	role,
	hotels,
	activeHotel,
	brandLogo,
	badges,
	supervisor,
	outletSwitch,
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
}) {
	return (
		<Sidebar
			{...props}
			className="border-r-0 bg-nav text-white [&_[data-sidebar=sidebar]]:bg-nav"
		>
			{/* The branch box is the top of the sidebar (the Hospio360 / hotel name row was removed, 2026-11-15). */}
			<SidebarHeader className="gap-2 px-4 pt-8">
				<BranchSwitcher
					hotels={hotels}
					active={activeHotel}
					logoUrl={brandLogo}
				/>
				{outletSwitch && <OutletSwitcher {...outletSwitch} />}
			</SidebarHeader>
			<SidebarContent className="scrollbar-hidden px-4">
				<NavMain role={role} badges={badges} supervisor={supervisor} accommodation={hasAccommodation(activeHotel)} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
