import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@hospio/ui/primitives/sidebar";
import { NavMain } from "./nav-main";
import { BranchSwitcher } from "./branch-switcher";
import type { HotelRole } from "@hospio/api/roles";
import type { Hotel } from "@hospio/api/api/schema";

export function AppSidebar({
	role,
	hotels,
	activeHotel,
	brandLogo,
	badges,
	supervisor,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	role: HotelRole;
	hotels: Hotel[];
	activeHotel: Hotel | null;
	/** Hotel setup → Brand & colours: the hotel's logo in the branch box. */
	brandLogo?: string | null;
	badges?: React.ComponentProps<typeof NavMain>["badges"];
	supervisor?: boolean;
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
			</SidebarHeader>
			<SidebarContent className="scrollbar-hidden px-4">
				<NavMain role={role} badges={badges} supervisor={supervisor} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
