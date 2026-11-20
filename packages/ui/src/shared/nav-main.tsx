"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import * as sidebar from "@hospio/ui/primitives/sidebar";
import { linksByRole, type NavLink } from "@hospio/ui/links";
import type { HotelRole } from "@hospio/api/roles";
import { cn } from "@hospio/ui/utils";
import { useBizText } from "@hospio/ui/shared/wording";

function LinkIcon({ icon: Icon }: { icon: NavLink["icon"] }) {
	const { pending } = useLinkStatus();
	return pending ? <Loader2Icon className="size-[18px] animate-spin" /> : <Icon className="size-[18px]" />;
}

const badgeWord: Record<NonNullable<NavLink["badge"]>, string> = {
	inbox: "unread",
	unpaidSales: "unpaid",
	approvals: "waiting",
	applications: "new",
};

/**
 * One menu row, for every link in every menu (admin groups and the hotel roles' flat lists alike), so a link added to
 * links.tsx needs no styling of its own: transparent at rest with white text at 80%, a faint wash on hover, and the open
 * page in a lighter row with full-white text and a short white bar on its left. The icon rail (below 1280px) centres the
 * icon and shows the open page as a white tile with the nav colour. Overrides the primitive's filled pill (primitives/sidebar).
 */
const navRow = cn(
	"relative h-[36px] gap-[10px] rounded-[10px] bg-transparent px-[10px] py-0 text-[13.5px] font-normal text-white/80 transition-colors",
	"hover:bg-white/[0.07] hover:text-white active:bg-white/10 active:text-white",
	"focus-visible:ring-2 focus-visible:ring-white/70",
	"data-[active=true]:bg-white/[0.13] data-[active=true]:font-medium data-[active=true]:text-white",
	"before:absolute before:inset-y-[9px] before:left-0 before:w-[3px] before:rounded-r-full before:bg-white before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100",
	"group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-[40px]! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[11px]! group-data-[collapsible=icon]:before:hidden",
	"group-data-[collapsible=icon]:data-[active=true]:bg-white group-data-[collapsible=icon]:data-[active=true]:text-nav",
	"[&>svg]:size-[18px]",
);

/** Which link owns the current path: the longest matching prefix. */
function activeUrl(pathname: string, items: NavLink[]) {
	return items
		.filter((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))
		.sort((a, b) => b.url.length - a.url.length)[0]?.url;
}

export function NavMain({
	role,
	badges = {},
	supervisor = true,
	accommodation = true,
}: {
	role: HotelRole;
	/** False at a lounge, bar or restaurant: the `stay` links (Rooms, Bookings, Folios …) are left out. */
	accommodation?: boolean;
	/** False hides the supervisor-only links (Inspect) from a housekeeping attendant. */
	supervisor?: boolean;
	/** Counts for links that carry one (`NavLink.badge`); nothing is shown for 0 or a missing count. */
	badges?: Partial<Record<NonNullable<NavLink["badge"]>, number>>;
}) {
	const items = linksByRole[role].filter(
		(i) => (supervisor || !i.supervisorOnly) && (!i.roles || i.roles.includes(role)) && (accommodation || !i.stay),
	);
	const pathname = usePathname();
	const active = activeUrl(pathname, items);
	// "Hotels" and "Hotel setup" read "Locations" and "Lounge setup" where that is what they are (docs/plan-venue-type.md).
	const t = useBizText();
	// Menus with groups (the admin portal) get a small heading per group; the others stay one flat list as before.
	const groups: { title?: string; items: NavLink[] }[] = [];
	for (const item of items) {
		const last = groups[groups.length - 1];
		if (last && last.title === item.group) last.items.push(item);
		else groups.push({ title: item.group, items: [item] });
	}

	return groups.map((g) => (
		<sidebar.SidebarGroup
			key={g.title ?? "all"}
			className={cn("px-0 py-0", g.title ? "pt-[12px] first:pt-[2px] group-data-[collapsible=icon]:pt-[8px]" : "py-[12px]")}
		>
			{g.title && (
				<sidebar.SidebarGroupLabel className="h-[22px] px-[10px] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 group-data-[collapsible=icon]:-mt-[22px]">
					{g.title}
				</sidebar.SidebarGroupLabel>
			)}
			<sidebar.SidebarMenu className={g.title ? "gap-y-[2px]" : "gap-y-[4px]"}>
				{g.items.map((item) => {
					const isActive = active === item.url;
					const count = item.badge ? (badges[item.badge] ?? 0) : 0;
					return (
						<sidebar.SidebarMenuItem key={item.url}>
							<sidebar.SidebarMenuButton
								tooltip={t(item.title)}
								asChild
								isActive={isActive}
								className={navRow}
							>
								<Link
									href={item.url}
									prefetch={false}
									aria-current={isActive ? "page" : undefined}
									className="flex w-full items-center gap-[10px]"
								>
									<LinkIcon icon={item.icon} />
									<span className="truncate">{t(item.title)}</span>
									{count > 0 && (
										<span
											className={cn(
												"ml-auto rounded-pill px-[6px] text-[11px] font-semibold leading-[18px] text-white group-data-[collapsible=icon]:hidden",
												item.badge === "inbox" ? "bg-danger" : "bg-warning",
											)}
											title={`${count} ${badgeWord[item.badge ?? "inbox"]}`}
										>
											{count > 99 ? "99+" : count}
											<span className="sr-only"> {badgeWord[item.badge ?? "inbox"]}</span>
										</span>
									)}
								</Link>
							</sidebar.SidebarMenuButton>
						</sidebar.SidebarMenuItem>
					);
				})}
			</sidebar.SidebarMenu>
		</sidebar.SidebarGroup>
	));
}
