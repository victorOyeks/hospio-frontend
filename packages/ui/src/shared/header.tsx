"use client";

import { BellIcon, ChevronDownIcon, CircleHelpIcon, LogOutIcon, MonitorSmartphoneIcon, SearchIcon, TabletSmartphoneIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@hospio/ui/primitives/avatar";
import { photoUrl } from "@hospio/api/profile-options";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@hospio/ui/primitives/dropdown-menu";
import { SidebarTrigger } from "@hospio/ui/primitives/sidebar";
import type { Me } from "@hospio/api/api/schema";
import { logout, logoutEverywhere } from "@hospio/api/actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@hospio/ui/primitives/alert-dialog";
import { APP } from "@hospio/api/app";
import { PLATFORM_ROLES, roleLabel, type HotelRole } from "@hospio/api/roles";
import { AdminSearch } from "@hospio/ui/shared/admin-search";
import { cn } from "@hospio/ui/utils";
import { type DeviceSetupHotel, LockButton, SetupDeviceModal } from "@hospio/ui/shared/shared-device";
import { forgetEverything, rememberPage } from "@hospio/ui/shared/draft";
import { InstallBanner, InstallMenuItem, OpenInAppBanner } from "@hospio/ui/shared/pwa";
import { useWording } from "@hospio/ui/shared/wording";

function initials(name: string) {
	return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const iconButton = "flex size-[42px] items-center justify-center rounded-xl border border-line bg-card text-ink-2 transition-colors hover:bg-subtle";

export function Header({
	user,
	role,
	hotelCount,
	unread,
	device,
	setupHotels = [],
	activeHotelId,
}: {
	user: Me;
	role: HotelRole;
	hotelCount: number;
	unread: number;
	/** On a shared device: its name, for the Lock button (docs/shared-devices.md). */
	device?: { name: string };
	/** Where this person may set up a shared device; empty hides "Use this device as a shared device". */
	setupHotels?: DeviceSetupHotel[];
	activeHotelId?: string;
}) {
	const words = useWording();
	const { biz } = useWording();
	const [pending, startTransition] = useTransition();
	const [setupOpen, setSetupOpen] = useState(false);
	const [everywhereOpen, setEverywhereOpen] = useState(false);
	const subtitle = `${roleLabel(role, biz.hotel)}${hotelCount > 0 ? ` · ${hotelCount} ${hotelCount === 1 ? "branch" : "branches"}` : ""}`;

	return (
		<header className="flex items-center justify-between gap-3 px-5 pt-6 lg:px-8">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				{/* Phones open the menu drawer; tablets (icon rail below 1280px) open the full menu. */}
				<SidebarTrigger className="shrink-0 xl:hidden" />
				{/* The admin portal's staff get a working search (⌘K); the hotel app keeps its box as it is. */}
				{APP === "admin" && PLATFORM_ROLES.includes(role) ? (
					<AdminSearch role={role} />
				) : (
					<label className="hidden h-[42px] w-full min-w-0 max-w-[380px] items-center gap-[10px] rounded-xl border border-line bg-card pl-[14px] pr-[10px] md:flex">
						<SearchIcon className="size-[18px] text-ink-3" />
						<input
							type="search"
							placeholder={words.stays ? "Search bookings, guests, branches…" : "Search sales, staff, branches…"}
							className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
						/>
						<kbd className="rounded-md bg-subtle px-[6px] py-[2px] text-[11px] font-medium text-ink-2">⌘ K</kbd>
					</label>
				)}
			</div>

			<div className="flex shrink-0 items-center gap-3">
				{device && <LockButton deviceName={device.name} />}
				<Link href="/dashboard/help" className={iconButton} aria-label="Help">
					<CircleHelpIcon className="size-5" />
				</Link>
				<Link href="/dashboard/notifications" className={cn(iconButton, "relative")} aria-label="Notifications">
					<BellIcon className="size-5" />
					{unread > 0 && <span className="absolute right-[9px] top-[9px] size-2 rounded-full bg-danger ring-2 ring-card" />}
				</Link>
				<span className="h-7 w-px bg-line-strong/60" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button type="button" className="flex items-center gap-[10px] rounded-xl py-1 pl-1 pr-2 text-left hover:bg-subtle">
							<Avatar className="size-10">
								{user.photoVersion ? <AvatarImage src={photoUrl(user.id, user.photoVersion) ?? undefined} alt="" className="object-cover" /> : null}
								<AvatarFallback className="bg-brand text-sm font-semibold text-white">{initials(user.fullName)}</AvatarFallback>
							</Avatar>
							<span className="hidden flex-col lg:flex">
								<span className="text-sm font-semibold text-ink">{user.fullName}</span>
								<span className="text-xs text-ink-3">{subtitle}</span>
							</span>
							<ChevronDownIcon className="size-4 text-ink-3" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60 rounded-xl">
						<DropdownMenuLabel>
							<p className="text-sm font-semibold text-ink">{user.fullName}</p>
							<p className="text-xs font-normal text-ink-3">{user.email}</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild className="rounded-lg">
							<Link href="/dashboard/profile">
								<UserIcon /> My profile & security
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="rounded-lg">
							<Link href="/select-role">Switch role</Link>
						</DropdownMenuItem>
						{setupHotels.length > 0 && (
							<DropdownMenuItem className="rounded-lg" onSelect={() => setSetupOpen(true)}>
								<TabletSmartphoneIcon /> Use this device as a shared device
							</DropdownMenuItem>
						)}
						<InstallMenuItem />
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="rounded-lg text-danger focus:text-danger"
							disabled={pending}
							onSelect={() => {
								// Lock (shared device) keeps this person's page and drafts for when they unlock; signing out forgets them.
								if (device) rememberPage(user.id);
								else forgetEverything();
								startTransition(() => logout());
							}}
						>
							<LogOutIcon /> {device ? "Lock" : "Sign out"}
						</DropdownMenuItem>
						{/* "Sign out" ends this browser's sessions in both apps; this ends every device (hospio-backend docs/sign-in.md). */}
						<DropdownMenuItem
							className="rounded-lg text-danger focus:text-danger"
							disabled={pending}
							onSelect={() => setEverywhereOpen(true)}
						>
							<MonitorSmartphoneIcon /> Sign out everywhere
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<InstallBanner />
				<OpenInAppBanner />
				<AlertDialog open={everywhereOpen} onOpenChange={setEverywhereOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Sign out everywhere?</AlertDialogTitle>
							<AlertDialogDescription>
								You'll be signed out on every phone, computer and browser where you use Hospio360, in the hotel app and the admin
								console. Shared devices go back to their lock screen. You'll need your password to sign in again.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
							<AlertDialogAction
								disabled={pending}
								className="bg-danger text-white hover:bg-danger/90"
								onClick={() => {
									forgetEverything();
									startTransition(() => logoutEverywhere());
								}}
							>
								Sign out everywhere
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
				{setupHotels.length > 0 && (
					<SetupDeviceModal open={setupOpen} onOpenChange={setSetupOpen} hotels={setupHotels} activeHotelId={activeHotelId} activeRole={role} />
				)}
			</div>
		</header>
	);
}
