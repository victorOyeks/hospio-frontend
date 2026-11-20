import { MenuIcon } from "lucide-react";
import { HospioWordmark } from "@hospio/ui/brand/logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

import { HOTEL_APP_URL, SITE_URL } from "@/config/env";

/** Every environment-specific address is in config/env.ts (build-time env, staging fallbacks). */
export { HOTEL_APP_URL, SITE_URL };
/**
 * Every "get started" call to action: self sign-up is off, so businesses book a demo and the Hospio360 team sets them up
 * (hospio-backend docs/onboarding.md, "Applications").
 */
export const BOOK_DEMO_URL = "/book-a-demo";
export const SIGN_IN_URL = `${HOTEL_APP_URL}/auth`;
/**
 * Where demo requests, sales and support questions go: Oyeks Global's inbox, the same address the legal pages give for notices
 * (NEXT_PUBLIC_CONTACT_EMAIL overrides it).
 */
export const CONTACT_EMAIL =
	process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@oyeksglobal.com";

/** Where Oyeks Global Ltd is (footer, legal pages, notices clause of the Terms). */
export const REGISTERED_OFFICE = "Lagos, Nigeria";
/** Search engines index the site only when NEXT_PUBLIC_SITE_INDEXABLE=true (production); staging stays noindex. */
export const SITE_INDEXABLE = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

/** The design's 1200px content column (1440 frame with 120px margins), with 16px gutters on small screens. */
export const container = "mx-auto w-full max-w-[1200px] px-4";
/** The design's large button: 15px label with 13px vertical padding, layered over the kit's `btn` recipes. */
export const btnLg = "px-4 py-[13px] text-[15px]";

const nav = [
	{ href: "/features", label: "Features" },
	{ href: "/#onboarding", label: "Getting started" },
	{ href: "/#pricing", label: "Pricing" },
	{ href: "/#partners", label: "Partners" },
	{ href: "/#faq", label: "FAQ" },
];

export function Wordmark({
	dark = false,
	className,
}: {
	dark?: boolean;
	className?: string;
}) {
	return (
		<Link
			href="/"
			aria-label="Hospio360 home"
			className={cn("flex shrink-0 items-center", className)}
		>
			<HospioWordmark
				title=""
				className={cn("h-[26px] md:h-[30px]", dark ? "text-white" : "text-brand")}
			/>
		</Link>
	);
}

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-b border-line/70 bg-page/90 backdrop-blur">
			<div
				className={cn(
					container,
					"flex h-[60px] items-center justify-between gap-4 md:h-[76px] md:gap-6",
				)}
			>
				<Wordmark />
				<nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
					{nav.map((n) => (
						<Link
							key={n.href}
							href={n.href}
							className="text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
						>
							{n.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-3">
					<a
						href={SIGN_IN_URL}
						className={cn(btn.secondary, "hidden sm:inline-flex")}
					>
						Sign in
					</a>
					<Link href={BOOK_DEMO_URL} className={btn.primary}>
						Book a demo
					</Link>
					<MobileMenu />
				</div>
			</div>
		</header>
	);
}

/** Small-screen menu with no JavaScript: a <details> that drops the nav links under the header. */
function MobileMenu() {
	return (
		<details className="relative lg:hidden">
			<summary
				aria-label="Open menu"
				className={cn(
					btn.icon,
					"cursor-pointer list-none [&::-webkit-details-marker]:hidden",
				)}
			>
				<MenuIcon className="size-[18px]" />
			</summary>
			<div className="absolute top-[calc(100%+10px)] right-0 flex w-56 flex-col gap-1 rounded-card border border-line bg-card p-2 shadow-[0_16px_40px_rgba(77,8,31,0.12)]">
				{nav.map((n) => (
					<Link
						key={n.href}
						href={n.href}
						className="rounded-control px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-subtle hover:text-ink"
					>
						{n.label}
					</Link>
				))}
				<a
					href={SIGN_IN_URL}
					className="rounded-control px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-subtle hover:text-ink sm:hidden"
				>
					Sign in
				</a>
			</div>
		</details>
	);
}

const footerColumns: {
	title: string;
	links: { href: string; label: string }[];
}[] = [
	{
		title: "Product",
		links: [
			{ href: "/features", label: "All features" },
			{ href: "/features#product", label: "Owner, manager and staff apps" },
			{ href: "/features#departments", label: "Departments" },
			{ href: "/features#payments", label: "Payments" },
			{ href: "/#pricing", label: "Pricing" },
		],
	},
	{
		title: "Get started",
		links: [
			{ href: BOOK_DEMO_URL, label: "Book a demo" },
			{ href: SIGN_IN_URL, label: "Sign in" },
		],
	},
	{
		title: "Company",
		links: [
			{ href: "/partners/apply", label: "Partner program" },
			{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
			{
				href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Support")}`,
				label: "Support",
			},
		],
	},
	{
		title: "Legal",
		links: [
			{ href: "/legal", label: "Legal" },
			{ href: "/legal/terms", label: "Terms of Service" },
			{ href: "/legal/privacy", label: "Privacy Policy" },
			{ href: "/legal/fees", label: "Fees" },
		],
	},
];

export function SiteFooter() {
	return (
		<footer className="border-t border-line bg-page">
			<div
				className={cn(
					container,
					"flex flex-col gap-8 pt-10 pb-8 md:gap-10 md:pt-14 md:pb-10",
				)}
			>
				<div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[minmax(0,300px)_repeat(4,minmax(0,1fr))] md:gap-10">
					<div className="col-span-2 flex flex-col gap-3 md:col-span-1">
						<Wordmark />
						<p className="text-sm leading-[1.55] text-ink-2">
							One system for hotels, lounges, bars and restaurants — owners,
							managers and every department.
						</p>
					</div>
					{footerColumns.map((c) => (
						<div
							key={c.title}
							className="flex min-w-0 flex-col gap-[10px] text-sm"
						>
							<p className="font-bold text-ink">{c.title}</p>
							{c.links.map((l) => (
								<a
									key={l.label + l.href}
									href={l.href}
									className="text-ink-2 hover:text-ink"
								>
									{l.label}
								</a>
							))}
						</div>
					))}
				</div>
				<div className="flex flex-col gap-2 text-[13px] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-1">
						<p>
							© {new Date().getFullYear()} Hospio360, a product of Oyeks Global Ltd (RC 10001123)
						</p>
						<p>{REGISTERED_OFFICE}</p>
					</div>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-1">
						<a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">
							{CONTACT_EMAIL}
						</a>
						<a href="#top" className="font-semibold hover:text-ink">
							Back to top ↑
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

type SectionHeaderProps = {
	eyebrow: string;
	title: string;
	intro?: string;
	align?: "center" | "left";
	dark?: boolean;
	className?: string;
	titleClassName?: string;
	/** The shorter home-page style: a smaller headline and tighter spacing. */
	compact?: boolean;
};

/** Eyebrow, headline and intro in the design's section-header style; centred by default. */
export function SectionHeader({
	eyebrow,
	title,
	intro,
	align = "center",
	dark = false,
	className,
	titleClassName,
	compact = false,
}: SectionHeaderProps) {
	const center = align === "center";
	return (
		<div
			className={cn(
				"flex w-full flex-col",
				compact ? "gap-[10px]" : "gap-4",
				center && "items-center text-center",
				className,
			)}
		>
			<p
				className={cn(
					"text-[13px] font-bold uppercase tracking-[0.1em]",
					dark ? "text-nav-foreground" : "text-brand",
				)}
			>
				{eyebrow}
			</p>
			<h2
				className={cn(
					"font-bold leading-[1.1] tracking-[-0.02em]",
					compact
						? "text-[26px] md:text-[38px]"
						: "text-[34px] md:text-[48px]",
					dark ? "text-white" : "text-ink",
					center && "max-w-[820px]",
					titleClassName,
				)}
			>
				{title}
			</h2>
			{intro && (
				<p
					className={cn(
						"leading-[1.55]",
						compact ? "text-[15px] md:text-[17px]" : "text-[17px] md:text-[18px]",
						dark ? "text-nav-foreground" : "text-ink-2",
						center && "max-w-[720px]",
					)}
				>
					{intro}
				</p>
			)}
		</div>
	);
}

type SectionProps = SectionHeaderProps & {
	id?: string;
	children: ReactNode;
	tone?: "card" | "page" | "brand";
	contentClassName?: string;
};

/** A full-width band with the design's section header above its content. */
export function Section({
	id,
	children,
	tone = "page",
	className,
	contentClassName,
	...header
}: SectionProps) {
	const dark = tone === "brand";
	return (
		<section
			id={id}
			className={cn(
				"scroll-mt-[76px]",
				tone === "card" && "bg-card",
				tone === "page" && "bg-page",
				dark && "bg-brand",
				className,
			)}
		>
			<div
				className={cn(
					container,
					"flex flex-col",
					header.compact
						? "gap-6 py-10 md:gap-9 md:py-16"
						: "gap-12 py-16 md:gap-14 md:py-[112px]",
					contentClassName,
				)}
			>
				<SectionHeader {...header} dark={dark} />
				{children}
			</div>
		</section>
	);
}
