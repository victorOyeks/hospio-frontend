"use client";

import { Command as CommandPrimitive } from "cmdk";
import { BedDoubleIcon, BuildingIcon, CornerDownLeftIcon, FileTextIcon, HeadsetIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { adminSearchBusinesses, adminSearchHotels, adminSearchTickets, type SearchIndex } from "@hospio/api/actions/admin-search";
import type { TicketItem } from "@hospio/api/data/admin-types";
import type { HotelRole } from "@hospio/api/roles";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@hospio/ui/primitives/dialog";
import { adminLinks } from "@hospio/ui/links";
import { cn } from "@hospio/ui/utils";

/**
 * The admin portal's search (⌘K / Ctrl+K, or the box in the header): businesses, hotels, tickets and pages, each jumping
 * straight to its page or panel. Businesses and hotels are read once when it first opens (businesses first, hotels as they
 * land) and filtered as you type; tickets are searched on the server as you type.
 */

type PageEntry = { title: string; url: string; hint?: string; roles?: HotelRole[] };

const MONEY: HotelRole[] = ["SUPER_ADMIN", "FINANCE_ADMIN"];

/** Tabs worth jumping to directly, on top of the menu itself. */
const DEEP_PAGES: PageEntry[] = [
	{ title: "Daily fees", url: "/dashboard/fees?view=daily", hint: "Fees & billing", roles: MONEY },
	{ title: "Fee rules", url: "/dashboard/fees?view=rules", hint: "Fees & billing" },
	{ title: "Statements", url: "/dashboard/fees?view=statements", hint: "Fees & billing" },
	{ title: "Guest message prices and invoices", url: "/dashboard/fees?view=messages", hint: "Fees & billing", roles: MONEY },
	{ title: "Settlements", url: "/dashboard/payments", hint: "Payments & POS" },
	{ title: "Payout batches", url: "/dashboard/payments?tab=batches", hint: "Payments & POS" },
	{ title: "Failed payouts", url: "/dashboard/payments?tab=failed", hint: "Payments & POS" },
	{ title: "Guest payments", url: "/dashboard/payments?tab=payments", hint: "Payments & POS" },
	{ title: "POS keys and fee collection", url: "/dashboard/payments?tab=pos", hint: "Payments & POS", roles: MONEY },
	{ title: "Commissions", url: "/dashboard/marketers?tab=commissions", hint: "Marketers", roles: MONEY },
	{ title: "Fee defaults", url: "/dashboard/settings?tab=fees", hint: "Settings" },
	{ title: "Security", url: "/dashboard/settings?tab=security", hint: "Settings" },
	{ title: "Admin activity", url: "/dashboard/changes?tab=activity", hint: "Changes by Hospio360" },
	{ title: "Help", url: "/dashboard/help" },
	{ title: "My profile & security", url: "/dashboard/profile" },
];

const match = (q: string, ...parts: (string | undefined)[]) => {
	const text = parts.filter(Boolean).join(" ").toLowerCase();
	return q
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.every((w) => text.includes(w));
};

export function AdminSearch({ role }: { role: HotelRole }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const [businessIndex, setBusinessIndex] = useState<SearchIndex["businesses"] | null>(null);
	const [hotelIndex, setHotelIndex] = useState<SearchIndex["hotels"] | null>(null);
	const [indexError, setIndexError] = useState<string | null>(null);
	// The highlighted row: kept on the first result as results change, so Enter always opens what is shown on top.
	const [selected, setSelected] = useState("");
	const [tickets, setTickets] = useState<TicketItem[]>([]);
	const [ticketsLoading, setTicketsLoading] = useState(false);
	const loading = useRef(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((o) => !o);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// The index is read the first time the search opens, then kept for the visit.
	useEffect(() => {
		if (!open || businessIndex || loading.current) return;
		loading.current = true;
		void adminSearchBusinesses().then((r) => {
			if (r.ok) setBusinessIndex(r.data);
			else setIndexError(r.error);
		});
		void adminSearchHotels().then((r) => {
			if (r.ok) setHotelIndex(r.data);
			else setIndexError(r.error);
		});
	}, [open, businessIndex]);

	useEffect(() => {
		const term = q.trim();
		if (term.length < 2) {
			setTickets([]);
			return;
		}
		setTicketsLoading(true);
		const t = setTimeout(() => {
			void adminSearchTickets(term).then((r) => {
				setTickets(r.ok ? r.data : []);
				setTicketsLoading(false);
			});
		}, 250);
		return () => clearTimeout(t);
	}, [q]);

	const pages = useMemo(() => {
		const all: PageEntry[] = [...adminLinks.map((l) => ({ title: l.title, url: l.url, hint: l.group, roles: l.roles })), ...DEEP_PAGES];
		return all.filter((p) => !p.roles || p.roles.includes(role));
	}, [role]);

	const term = q.trim();
	const indexReady = !!businessIndex && !!hotelIndex;
	const businesses = term ? (businessIndex ?? []).filter((b) => match(term, b.name, b.ownerName, b.city)).slice(0, 6) : [];
	const hotels = term ? (hotelIndex ?? []).filter((h) => match(term, h.name, h.businessName, h.city)).slice(0, 6) : [];
	const pageHits = (term ? pages.filter((p) => match(term, p.title, p.hint)) : pages).slice(0, term ? 6 : 8);

	const go = (url: string) => {
		setOpen(false);
		setQ("");
		router.push(url);
	};

	const item = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] text-ink data-[selected=true]:bg-subtle";
	const heading =
		"[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-ink-3";
	const nothing = term && !businesses.length && !hotels.length && !pageHits.length && !tickets.length && !ticketsLoading && indexReady;
	const first = businesses[0]
		? `b-${businesses[0].id}`
		: hotels[0]
			? `h-${hotels[0].id}`
			: tickets[0]
				? `t-${tickets[0].id}`
				: pageHits[0]
					? `p-${pageHits[0].url}`
					: "";
	useEffect(() => setSelected(first), [first]);
	// Where each shown row goes, so Enter opens the highlighted row even while results are still arriving.
	const targets: Record<string, string> = {
		...Object.fromEntries(businesses.map((b) => [`b-${b.id}`, `/dashboard/businesses/${b.id}`])),
		...Object.fromEntries(hotels.map((h) => [`h-${h.id}`, `/dashboard/hotels?hotel=${h.id}`])),
		...Object.fromEntries(tickets.map((t) => [`t-${t.id}`, `/dashboard/support?status=ALL&open=${t.id}`])),
		...Object.fromEntries(pageHits.map((p) => [`p-${p.url}`, p.url])),
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="hidden h-[42px] w-full min-w-0 max-w-[380px] items-center gap-[10px] rounded-xl border border-line bg-card pl-[14px] pr-[10px] text-left md:flex"
			>
				<SearchIcon className="size-[18px] text-ink-3" />
				<span className="min-w-0 flex-1 truncate text-sm text-ink-3">Search businesses, hotels, tickets, pages…</span>
				<kbd className="rounded-md bg-subtle px-[6px] py-[2px] text-[11px] font-medium text-ink-2">⌘ K</kbd>
			</button>
			<button type="button" onClick={() => setOpen(true)} className="flex size-[42px] items-center justify-center rounded-xl border border-line bg-card text-ink-2 md:hidden" aria-label="Search">
				<SearchIcon className="size-5" />
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="top-[15%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[620px]" showCloseButton={false}>
					<DialogTitle className="sr-only">Search</DialogTitle>
					<DialogDescription className="sr-only">Find a business, hotel, ticket or page</DialogDescription>
					<CommandPrimitive shouldFilter={false} loop value={selected} onValueChange={setSelected} className="flex flex-col">
						<div className="flex items-center gap-3 border-b border-line px-4">
							<SearchIcon className="size-[18px] shrink-0 text-ink-3" />
							<CommandPrimitive.Input
								onKeyDown={(e) => {
									const url = targets[selected];
									if (e.key === "Enter" && url) {
										e.preventDefault();
										e.stopPropagation();
										go(url);
									}
								}}
								value={q}
								onValueChange={setQ}
								placeholder="Search businesses, hotels, tickets, pages…"
								className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
							/>
							{(ticketsLoading || (open && !indexReady && !indexError)) && <Loader2Icon className="size-4 animate-spin text-ink-3" />}
						</div>
						<CommandPrimitive.List className={cn("max-h-[420px] overflow-y-auto px-2 pb-2", heading)}>
							{indexError && <p className="px-3 pt-3 text-[13px] text-danger">{indexError}</p>}
							{nothing && <p className="px-3 py-6 text-center text-[13px] text-ink-3">Nothing matches “{term}”. Try a business, hotel or owner name.</p>}
							{businesses.length > 0 && (
								<CommandPrimitive.Group heading="Businesses">
									{businesses.map((b) => (
										<CommandPrimitive.Item key={b.id} value={`b-${b.id}`} onSelect={() => go(`/dashboard/businesses/${b.id}`)} className={item}>
											<BuildingIcon className="size-4 shrink-0 text-ink-3" />
											<span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
											<span className="truncate text-xs text-ink-3">{[b.ownerName, b.city].filter(Boolean).join(" · ")}</span>
										</CommandPrimitive.Item>
									))}
								</CommandPrimitive.Group>
							)}
							{hotels.length > 0 && (
								<CommandPrimitive.Group heading="Hotels">
									{hotels.map((h) => (
										<CommandPrimitive.Item key={h.id} value={`h-${h.id}`} onSelect={() => go(`/dashboard/hotels?hotel=${h.id}`)} className={item}>
											<BedDoubleIcon className="size-4 shrink-0 text-ink-3" />
											<span className="min-w-0 flex-1 truncate font-medium">{h.name}</span>
											<span className="truncate text-xs text-ink-3">{[h.businessName, h.city].filter(Boolean).join(" · ")}</span>
										</CommandPrimitive.Item>
									))}
								</CommandPrimitive.Group>
							)}
							{tickets.length > 0 && (
								<CommandPrimitive.Group heading="Tickets">
									{tickets.map((t) => (
										<CommandPrimitive.Item key={t.id} value={`t-${t.id}`} onSelect={() => go(`/dashboard/support?status=ALL&open=${t.id}`)} className={item}>
											<HeadsetIcon className="size-4 shrink-0 text-ink-3" />
											<span className="min-w-0 flex-1 truncate font-medium">{t.subject}</span>
											<span className="truncate text-xs text-ink-3">{t.businessName}</span>
										</CommandPrimitive.Item>
									))}
								</CommandPrimitive.Group>
							)}
							{pageHits.length > 0 && (
								<CommandPrimitive.Group heading={term ? "Pages" : "Go to"}>
									{pageHits.map((p) => (
										<CommandPrimitive.Item key={p.url} value={`p-${p.url}`} onSelect={() => go(p.url)} className={item}>
											<FileTextIcon className="size-4 shrink-0 text-ink-3" />
											<span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
											{p.hint && <span className="truncate text-xs text-ink-3">{p.hint}</span>}
										</CommandPrimitive.Item>
									))}
								</CommandPrimitive.Group>
							)}
						</CommandPrimitive.List>
						<div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-ink-3">
							<span className="flex items-center gap-1">
								<CornerDownLeftIcon className="size-3" /> open
							</span>
							<span>↑ ↓ move</span>
							<span>esc close</span>
						</div>
					</CommandPrimitive>
				</DialogContent>
			</Dialog>
		</>
	);
}
