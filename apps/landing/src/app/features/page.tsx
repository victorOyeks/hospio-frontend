import { CalendarDaysIcon, MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { ClosingCta } from "@/components/sections/closing-cta";
import { Control } from "@/components/sections/control";
import { Departments } from "@/components/sections/departments";
import { FAQS, Faq, FaqJsonLd } from "@/components/sections/faq";
import { GuestFolio } from "@/components/sections/guest-folio";
import { Payments } from "@/components/sections/payments";
import { RolesStrip } from "@/components/sections/roles-strip";
import { ThreeApps } from "@/components/sections/three-apps";
import { YourBrand } from "@/components/sections/your-brand";
import {
	BOOK_DEMO_URL,
	btnLg,
	CONTACT_EMAIL,
	container,
	SiteFooter,
	SiteHeader,
} from "@/components/site";

const description =
	"Everything Hospio360 does for hotels, lounges, bars and restaurants: the owner and manager portals and the staff tablet app, guest folios and bills, card, transfer and cash at the POS, approvals and access levels, every department, and your own brand colours.";

export const metadata: Metadata = {
	title: "Features",
	description,
	alternates: { canonical: "/features" },
	openGraph: {
		title: "Features · Hospio360",
		description,
		url: "/features",
	},
};

const jump = [
	{ href: "#product", label: "Owner, manager, staff" },
	{ href: "#folio", label: "Guest folio" },
	{ href: "#payments", label: "Payments" },
	{ href: "#control", label: "Control" },
	{ href: "#departments", label: "Departments" },
	{ href: "#brand", label: "Your brand" },
	{ href: "#faq", label: "FAQ" },
];

/** The full feature sections that used to make the home page long, each under the id its links have always used. */
export default function FeaturesPage() {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<section className="bg-page">
					<div
						className={cn(
							container,
							"flex flex-col items-center gap-5 pt-10 pb-10 text-center md:pt-16 md:pb-14",
						)}
					>
						<p className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
							Features
						</p>
						<h1 className="max-w-[900px] text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-ink md:text-[56px]">
							Everything Hospio360 does, in detail.
						</h1>
						<p className="max-w-[720px] text-[16px] leading-[1.5] text-ink-2 md:text-[19px]">
							One system for hotels, lounges, bars and restaurants: owners,
							managers and every department work from the same live picture.
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
								href={`mailto:${CONTACT_EMAIL}`}
								className={cn(
									btn.secondary,
									btnLg,
									"inline-flex items-center gap-[6px]",
								)}
							>
								<MailIcon className="size-[15px]" strokeWidth={2.5} />
								Email us
							</a>
						</div>
						<nav
							aria-label="On this page"
							className="flex flex-wrap justify-center gap-2 pt-1"
						>
							{jump.map((j) => (
								<a
									key={j.href}
									href={j.href}
									className="rounded-pill border border-line bg-card px-[14px] py-2 text-sm font-medium text-ink hover:border-brand/40 hover:text-brand"
								>
									{j.label}
								</a>
							))}
						</nav>
					</div>
				</section>
				<RolesStrip />
				<ThreeApps />
				<GuestFolio />
				<Payments />
				<Control />
				<Departments />
				<YourBrand />
				<Faq />
				<ClosingCta />
			</main>
			<SiteFooter />
			<FaqJsonLd faqs={FAQS} />
		</>
	);
}
