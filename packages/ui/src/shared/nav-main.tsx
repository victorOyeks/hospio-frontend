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
};

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
		<sidebar.SidebarGroup key={g.title ?? "all"} className={cn("px-0", g.title ? "py-1 first:pt-3" : "py-3")}>
			{g.title && (
				<sidebar.SidebarGroupLabel className="h-7 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
					{g.title}
				</sidebar.SidebarGroupLabel>
			)}
			<sidebar.SidebarMenu className={g.title ? "gap-y-[2px]" : "gap-y-[10px]"}>
				{g.items.map((item) => {
					const isActive = active === item.url;
					const count = item.badge ? (badges[item.badge] ?? 0) : 0;
					return (
						<sidebar.SidebarMenuItem key={item.url}>
							<sidebar.SidebarMenuButton
								tooltip={t(item.title)}
								asChild
								isActive={isActive}
								className={cn(
									"h-10 rounded-[14px] px-2 text-sm text-white transition-opacity",
									"hover:bg-white/10 hover:text-white",
									"data-[active=true]:bg-white/10 data-[active=true]:font-medium data-[active=true]:text-white",
									!isActive && "opacity-70 hover:opacity-100",
									g.title && "h-9",
								)}
							>
								<Link href={item.url} prefetch={false} className="flex w-full items-center gap-2">
									<LinkIcon icon={item.icon} />
									<span className="truncate">{t(item.title)}</span>
									{count > 0 && (
										<span
											className={cn(
												"ml-auto rounded-pill px-[7px] py-px text-[11px] font-bold leading-[18px] text-white group-data-[collapsible=icon]:hidden",
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
