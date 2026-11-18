"use client";

import { CheckIcon, ChevronsUpDownIcon, LayersIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@hospio/ui/primitives/dropdown-menu";
import { chooseOutlet } from "@hospio/api/actions/fnb";
import { OutletMark } from "@hospio/ui/shared/outlet-mark";
import { cn } from "@hospio/ui/utils";

export type OutletSwitchProps = {
	desk: "KITCHEN" | "BAR" | "WAITER" | "CASHIER";
	outlets: { id: string; name: string; kind: string }[];
	/** The outlet this device works (cookie `hms.outlet.<desk>`). */
	current?: string;
	/** "All outlets" is on (cookie `hms.outlet.<desk>.all`, honoured for a manager or lead only). */
	all: boolean;
	/** A manager, the owner or Full access on the desk: the menu offers "All outlets". */
	canSeeAll: boolean;
};

/** The screens that can show every outlet at once; the others always show one. */
const ALL_PAGES: Record<OutletSwitchProps["desk"], string[]> = {
	BAR: ["/dashboard/tabs", "/dashboard/sales"],
	KITCHEN: ["/dashboard/sales"],
	WAITER: ["/dashboard/sales"],
	CASHIER: ["/dashboard/sales"],
};

/**
 * "Serving at", under the branch card: which outlet this desk works when the hotel has more than one of its kind (a Bar
 * and a Patio Lounge, a Kitchen and a Restaurant). The choice is kept on this device by `chooseOutlet` and every screen
 * of the desk follows it; picking one reloads the page you are on. Managers and leads also get "All outlets" on Tabs and
 * Sales. Nothing shows with a single outlet.
 */
export function OutletSwitcher({
	desk,
	outlets,
	current,
	all,
	canSeeAll,
}: OutletSwitchProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [pending, start] = useTransition();
	if (outlets.length < 2) return null;
	const peers = outlets.map((o) => o.id);
	const here = outlets.find((o) => o.id === current) ?? outlets[0];
	const allHere = ALL_PAGES[desk].some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	);
	const showingAll = all && allHere;

	const pick = (id: string) =>
		start(async () => {
			await chooseOutlet(desk, id);
			// "All outlets" from a screen that shows one outlet opens the first screen that shows them all.
			if (id === "ALL" && !allHere)
				router.push(ALL_PAGES[desk][0] ?? "/dashboard");
			else router.refresh();
		});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					disabled={pending}
					aria-label={`Serving at ${showingAll ? "all outlets" : here?.name}. Change outlet`}
					className={cn(
						"w-full rounded-xl border border-white/[0.18] bg-white/10 px-[10px] py-2 text-left text-white",
						"transition-colors hover:bg-white/[0.14] group-data-[collapsible=icon]:hidden",
						pending && "opacity-60",
					)}
				>
					<div className="flex items-center gap-[10px]">
						{showingAll ? (
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.16]">
								<LayersIcon className="size-4" />
							</span>
						) : (
							<OutletMark
								id={here?.id}
								peers={peers}
								kind={here?.kind}
								size="lg"
								className="ring-2 ring-white/30"
							/>
						)}
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="text-[9px] font-semibold uppercase tracking-wide text-white/60">
								Serving at
							</span>
							<span className="truncate text-sm font-bold">
								{pending
									? "Switching…"
									: showingAll
										? "All outlets"
										: here?.name}
							</span>
						</span>
						<ChevronsUpDownIcon className="size-[14px] text-white/70" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[220px] rounded-xl">
				<DropdownMenuLabel className="text-xs text-ink-3">
					Switch outlet
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{outlets.map((o) => {
					const on = !showingAll && o.id === here?.id;
					return (
						<DropdownMenuItem
							key={o.id}
							className="gap-2 rounded-lg"
							onSelect={() => !on && pick(o.id)}
						>
							<OutletMark id={o.id} peers={peers} kind={o.kind} />
							<span className="flex-1 truncate">{o.name}</span>
							{on && <CheckIcon className="size-4 text-brand" />}
						</DropdownMenuItem>
					);
				})}
				{canSeeAll && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2 rounded-lg"
							onSelect={() => !showingAll && pick("ALL")}
						>
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-subtle text-ink-2">
								<LayersIcon className="size-3" />
							</span>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="truncate">All outlets</span>
								<span className="text-[11px] text-ink-3">
									{desk === "BAR" ? "Tabs and sales" : "Sales"}
								</span>
							</span>
							{showingAll && <CheckIcon className="size-4 text-brand" />}
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
