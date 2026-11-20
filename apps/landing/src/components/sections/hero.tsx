import {
	ArrowRightIcon,
	BedDoubleIcon,
	CalendarDaysIcon,
	Building2Icon,
	ClockIcon,
	CoinsIcon,
	CreditCardIcon,
	DownloadIcon,
	LockIcon,
	type LucideIcon,
	MartiniIcon,
	ReceiptIcon,
	ShieldIcon,
	TriangleAlertIcon,
	UtensilsCrossedIcon,
	WineIcon,
} from "lucide-react";
import { HospioWordmark } from "@hospio/ui/brand/logo";
import Link from "next/link";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { BOOK_DEMO_URL, btnLg, container } from "@/components/site";
import { type PillTone, shotShadow, softTileTones, StatusPill } from "./shared";

const trust: { icon: LucideIcon; text: string }[] = [
	{ icon: ShieldIcon, text: "Each location’s data kept separate" },
	{ icon: LockIcon, text: "2-step sign-in with an authenticator app" },
	{ icon: CreditCardIcon, text: "Cash, card and transfer on every bill" },
];

const sidebar = [
	"Dashboard",
	"Approvals",
	"Operations",
	"Payments & payouts",
	"Hotels",
	"Bookings",
	"Staff Management",
	"Financials",
	"Reports",
	"Activity log",
];

const kpis = [
	{ label: "Revenue", value: "₦1.53B", note: "↑ 8.4% vs August" },
	{ label: "Net profit", value: "₦497M", note: "32.5% margin" },
	{ label: "Occupancy tonight", value: "81.2%", note: "918 of 1,130 rooms" },
	{
		label: "Avg. room rate",
		value: "₦58,200",
		note: "per night, all branches",
	},
];

const worthALook: {
	icon: LucideIcon;
	iconTone: keyof typeof softTileTones;
	title: string;
	detail: string;
	tag: string;
	tagTone: PillTone;
}[] = [
	{
		icon: TriangleAlertIcon,
		iconTone: "red",
		title: "Ivory Court Yaba is losing money",
		detail: "−₦19.5M this month · occupancy only 41%",
		tag: "Financials",
		tagTone: "red",
	},
	{
		icon: CoinsIcon,
		iconTone: "amber",
		title: "3 branches are over budget",
		detail: "Opebi (113%), Yaba (109%), Ajah (101%)",
		tag: "Expenses",
		tagTone: "amber",
	},
	{
		icon: ReceiptIcon,
		iconTone: "blue",
		title: "₦48.0M unpaid by guests",
		detail: "14 bookings · 3 more than 7 days overdue",
		tag: "Bookings",
		tagTone: "blue",
	},
	{
		icon: ClockIcon,
		iconTone: "amber",
		title: "Opebi morning shift is short on 1 Oct",
		detail: "1 technician scheduled · minimum is 2",
		tag: "Staff",
		tagTone: "grey",
	},
];

const branches = [
	{ name: "Ivory Court V.I.", pct: 90, value: "₦110M" },
	{ name: "Ivory Court Ikoyi", pct: 80, value: "₦88.5M" },
	{ name: "Ivory Court Ajah", pct: 72, value: "₦78.0M" },
	{ name: "Ivory Court Ikeja", pct: 66, value: "₦67.5M" },
	{ name: "Ivory Court Lekki Phase 1", pct: 50, value: "₦52.5M" },
	{ name: "Ivory Court Yaba", pct: 8, value: "−₦19.5M", negative: true },
];

/** The kinds of business Hospio360 runs, shown as small icons in the hero pill. */
const VENUE_ICONS: LucideIcon[] = [BedDoubleIcon, MartiniIcon, WineIcon, UtensilsCrossedIcon];

export function Hero() {
	return (
		<section className="bg-page">
			<div
				className={cn(
					container,
					"flex flex-col items-center gap-5 pt-9 pb-10 md:gap-6 md:pt-14 md:pb-16",
				)}
			>
				<p className="inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-pill border border-brand/15 bg-white py-1 pr-3 pl-1 text-[12px] text-ink-2 shadow-[0_1px_2px_rgba(76,9,30,0.06)] sm:gap-3 sm:py-[5px] sm:pr-4 sm:pl-[5px] sm:text-[13px] md:text-sm">
					<span className="flex shrink-0 -space-x-[6px] sm:-space-x-[7px]" aria-hidden="true">
						{VENUE_ICONS.map((Icon) => (
							<span
								key={Icon.displayName}
								className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-brand ring-2 ring-white sm:size-7 md:size-8"
							>
								<Icon className="size-3 sm:size-[14px] md:size-4" strokeWidth={2.2} />
							</span>
						))}
					</span>
					<span className="font-semibold text-brand">
						Hotels, lounges, bars &amp; restaurants
					</span>
				</p>
				<h1 className="max-w-[980px] text-center text-[36px] font-bold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px] md:text-[60px]">
					Every room, every table, every till — on one screen.
				</h1>
				<p className="max-w-[720px] text-center text-[16px] leading-[1.5] text-ink-2 md:text-[19px]">
					Hospio360 runs your hotel, lounge, bar or restaurant from one place:
					bookings, orders, payments and every department, in real time, at
					every location.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<a
						href={BOOK_DEMO_URL}
						className={cn(
							btn.primary,
							btnLg,
							"inline-flex items-center gap-[6px]",
						)}
					>
						<CalendarDaysIcon className="size-[15px]" strokeWidth={2.5} />
						Book a demo
					</a>
					<a
						href="/features"
						className={cn(
							btn.secondary,
							btnLg,
							"inline-flex items-center gap-[6px]",
						)}
					>
						<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
						See all features
					</a>
				</div>
				<ul className="hidden flex-wrap items-center justify-center gap-x-7 gap-y-2 sm:flex">
					{trust.map((t) => {
						const Icon = t.icon;
						return (
							<li
								key={t.text}
								className="flex items-center gap-2 text-sm text-ink-2"
							>
								<Icon className="size-[18px] shrink-0" />
								{t.text}
							</li>
						);
					})}
				</ul>
				{/* The product shot is for wider screens only, and cut short with a fade: the full pictures are on /features. */}
				<figure className="hidden w-full flex-col items-center gap-3 md:flex">
					<div className="relative max-h-[300px] w-full overflow-hidden rounded-t-[20px] lg:max-h-[340px]">
						<OwnerDashboardShot />
						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page to-transparent" />
					</div>
					<figcaption className="text-[13px] text-ink-3">
						The owner’s morning view, shown with sample data.{" "}
						<Link
							href="/features"
							className="font-semibold text-brand underline underline-offset-2"
						>
							See all features
						</Link>
					</figcaption>
				</figure>
			</div>
		</section>
	);
}

/** Static illustration of the owner dashboard (design "Product shot · Owner dashboard"). */
function OwnerDashboardShot() {
	return (
		<div
			aria-hidden
			className={cn(
				"flex w-full overflow-hidden rounded-[20px] border border-line bg-card",
				shotShadow,
			)}
		>
			<aside className="hidden w-[228px] shrink-0 flex-col gap-1 bg-brand px-4 py-6 lg:flex">
				<div className="flex items-center gap-[10px] pb-5 pl-2">
					<HospioWordmark title="" className="h-[22px] text-white" />
				</div>
				{sidebar.map((item, i) => (
					<div
						key={item}
						className={cn(
							"flex h-10 items-center rounded-control px-3 text-sm",
							i === 0
								? "bg-white/10 font-semibold text-white"
								: "font-medium text-nav-foreground",
						)}
					>
						{item}
					</div>
				))}
			</aside>
			<div className="flex min-w-0 flex-1 flex-col gap-5 bg-page p-4 sm:p-7">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-col gap-1">
						<p className="text-[20px] font-bold text-ink sm:text-[24px]">
							Good morning, Kayode
						</p>
						<p className="text-[13px] text-ink-2">
							Ivory Court Hotels Ltd · 10 hotels · 1,130 rooms · Tuesday, 30 Sep
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-[10px]">
						<span
							className={cn(
								btn.secondary,
								"inline-flex items-center gap-[6px]",
							)}
						>
							<Building2Icon className="size-[15px]" />
							All branches (10)
						</span>
						<span
							className={cn(btn.primary, "inline-flex items-center gap-[6px]")}
						>
							<DownloadIcon className="size-[15px]" />
							Download report
						</span>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-[14px] xl:grid-cols-4">
					{kpis.map((k) => (
						<div
							key={k.label}
							className="flex flex-col gap-[2px] rounded-[14px] border border-line bg-card px-4 py-[14px]"
						>
							<p className="text-xs font-medium text-ink-3">{k.label}</p>
							<p className="text-[22px] font-bold text-ink">{k.value}</p>
							<p className="text-xs text-ink-3">{k.note}</p>
						</div>
					))}
				</div>
				<div className="grid grid-cols-1 gap-[14px] xl:grid-cols-[minmax(0,1fr)_380px]">
					<div className="flex flex-col gap-1 rounded-[14px] border border-line bg-card p-5">
						<div className="flex items-center justify-between pb-2">
							<p className="text-base font-bold text-ink">Worth a look</p>
							<StatusPill label="6 items" tone="red" />
						</div>
						{worthALook.map((w) => {
							const Icon = w.icon;
							return (
								<div
									key={w.title}
									className="flex items-center gap-3 py-[10px]"
								>
									<span
										className={cn(
											"flex size-9 shrink-0 items-center justify-center rounded-control",
											softTileTones[w.iconTone],
										)}
									>
										<Icon className="size-[18px]" />
									</span>
									<div className="flex min-w-0 flex-1 flex-col gap-[2px]">
										<p className="truncate text-sm font-semibold text-ink">
											{w.title}
										</p>
										<p className="truncate text-xs text-ink-2">{w.detail}</p>
									</div>
									<StatusPill
										label={w.tag}
										tone={w.tagTone}
										className="hidden sm:inline-flex"
									/>
								</div>
							);
						})}
					</div>
					<div className="flex flex-col gap-3 rounded-[14px] border border-line bg-card p-5">
						<div className="flex flex-col gap-1">
							<p className="text-base font-bold text-ink">
								Your branches this month
							</p>
							<p className="text-xs text-ink-2">Ranked by net profit</p>
						</div>
						{branches.map((b) => (
							<div key={b.name} className="flex items-center gap-3">
								<p className="w-[120px] shrink-0 truncate text-[13px] font-medium text-ink sm:w-[140px]">
									{b.name}
								</p>
								<div className="h-[6px] min-w-[60px] flex-1 overflow-hidden rounded-[3px] bg-subtle">
									<div
										className={cn(
											"h-full rounded-[3px]",
											b.negative ? "bg-status-bad" : "bg-status-ok",
										)}
										style={{ width: `${b.pct}%` }}
									/>
								</div>
								<p
									className={cn(
										"w-[64px] shrink-0 text-right text-[13px] font-bold",
										b.negative ? "text-status-bad" : "text-ink",
									)}
								>
									{b.value}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
