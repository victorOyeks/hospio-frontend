"use client";

import { LogOutIcon } from "lucide-react";
import { useTransition } from "react";
import { logout } from "@hospio/api/actions";
import { forgetEverything } from "@hospio/ui/shared/draft";

export type SidebarPersonProps = { name: string; role: string };

function initials(name: string) {
	return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * The admin portal's sidebar foot: who is signed in (initials, name, role) and Sign out. It stays in view while the menu
 * above it scrolls; the icon rail keeps only the initials. The header's person menu still has profile and Switch role.
 */
export function SidebarPerson({ name, role }: SidebarPersonProps) {
	const [pending, startTransition] = useTransition();
	return (
		<div className="flex items-center gap-[10px] rounded-[10px] px-[4px] py-[2px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
			<span
				className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-white/[0.14] text-xs font-semibold text-white"
				title={`${name} · ${role}`}
			>
				{initials(name)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
				<span className="truncate text-[13px] font-medium text-white">{name}</span>
				<span className="truncate text-[11.5px] text-white/55">{role}</span>
			</span>
			<button
				type="button"
				aria-label="Sign out"
				title="Sign out"
				disabled={pending}
				onClick={() => {
					forgetEverything();
					startTransition(() => logout());
				}}
				className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50 group-data-[collapsible=icon]:hidden"
			>
				<LogOutIcon className="size-[17px]" />
			</button>
		</div>
	);
}
