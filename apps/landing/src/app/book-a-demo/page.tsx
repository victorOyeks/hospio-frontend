import {
	CalendarCheckIcon,
	type LucideIcon,
	MonitorIcon,
	PhoneCallIcon,
	SettingsIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { BookDemoForm } from "@/components/book-demo-form";
import { CheckItem, IconTile } from "@/components/sections/shared";
import { container, SiteFooter, SiteHeader } from "@/components/site";
import { cleanRef } from "@/demo-request/schema";
import { cn } from "@hospio/ui/utils";

const description =
	"Book a Hospio360 demo for your hotel, lounge, bar or restaurant. Our team calls you within 1 working day, shows you Hospio360 on a laptop or tablet, and sets your business up with you.";

export const metadata: Metadata = {
	title: "Book a demo",
	description,
	alternates: { canonical: "/book-a-demo" },
	openGraph: {
		title: "Book a demo · Hospio360",
		description,
		url: "/book-a-demo",
	},
};

/** What happens after the form: the owner decision of 21 Nov 2026 (no self sign-up; the team onboards every business). */
const steps: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: PhoneCallIcon,
		title: "We call you",
		text: "Within 1 working day, at the time you prefer when we can.",
	},
	{
		icon: CalendarCheckIcon,
		title: "We meet",
		text: "A demo on a business like yours, and we agree what you need.",
	},
	{
		icon: SettingsIcon,
		title: "We set you up",
		text: "Your business, locations, rooms or outlets, prices and staff.",
	},
	{
		icon: MonitorIcon,
		title: "You sign in",
		text: "Your login comes by email. Run it all from a laptop or tablet.",
	},
];

const included = [
	"No forms to fill in on your own: our team does the setup with you",
	"Every feature, for hotels, lounges, bars and restaurants",
];

/**
 * /book-a-demo: the public "Book a demo" form (it replaces self sign-up), with what happens next beside it on laptops and below
 * it on phones and tablets (22 Nov 2026: the Meta ad's visitors are on phones and the form must be on the first screen).
 */
export default async function BookDemoPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const referralCode = cleanRef((await searchParams).ref);
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<div
					className={cn(
						container,
						"flex flex-col gap-5 py-6 md:gap-8 md:py-10 lg:gap-12 lg:py-16",
					)}
				>
					<div className="flex min-w-0 max-w-[760px] flex-col gap-2 lg:gap-4">
						<p className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
							Book a demo
						</p>
						<h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[40px] lg:text-[48px]">
							See Hospio360 on a business like yours
						</h1>
						{/* Phones and tablets: one short line, so the form starts on the first screen (the Meta ad's visitors). */}
						<p className="text-[16px] leading-[1.5] text-ink-2 md:text-[17px] lg:hidden">
							We call you within 1 working day and set everything up with you.
						</p>
						<p className="hidden text-[18px] leading-[1.55] text-ink-2 lg:block">
							Tell us about your hotel, lounge, bar or restaurant. Our team calls
							you within 1 working day, shows you Hospio360 and sets everything up
							with you.
						</p>
					</div>

					<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
						{/* The form first on every screen; on laptops What happens next sits beside it. */}
						<div className="min-w-0">
							<BookDemoForm referralCode={referralCode} />
						</div>
						<aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[111px]">
							<div className="flex flex-col gap-[18px] rounded-[16px] bg-brand p-6 md:p-8">
								<h2 className="text-[22px] font-bold text-white">
									What happens next
								</h2>
								{steps.map((s) => (
									<div key={s.title} className="flex items-start gap-[14px]">
										<IconTile icon={s.icon} tone="glass" size="sm" />
										<div className="flex min-w-0 flex-col gap-1">
											<p className="text-base font-bold text-white">
												{s.title}
											</p>
											<p className="text-sm leading-[1.5] text-nav-foreground">
												{s.text}
											</p>
										</div>
									</div>
								))}
							</div>
							<div className="hidden flex-col gap-4 rounded-[16px] border border-line bg-card p-6 lg:flex">
								<h2 className="text-lg font-bold text-ink">Included</h2>
								<ul className="flex flex-col gap-3">
									{included.map((s) => (
										<CheckItem key={s}>{s}</CheckItem>
									))}
								</ul>
							</div>
						</aside>
					</div>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
