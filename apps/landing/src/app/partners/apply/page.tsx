import {
	BanknoteIcon,
	CalendarClockIcon,
	type LucideIcon,
	PercentIcon,
	ReceiptTextIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PartnerApplyForm } from "@/components/partner-apply-form";
import { CheckItem, IconTile } from "@/components/sections/shared";
import { container, SiteFooter, SiteHeader } from "@/components/site";
import { cn } from "@hospio/ui/utils";

const description =
	"Know owners of hotels, lounges, bars or restaurants? Apply to be a Hospio360 referral partner and earn 20% of Hospio360's fee from each business you refer, for 12 months.";

export const metadata: Metadata = {
	title: "Apply to be a partner",
	description,
	alternates: { canonical: "/partners/apply" },
	openGraph: {
		title: "Apply to be a partner · Hospio360",
		description,
		url: "/partners/apply",
	},
};

/** The offer, in the words of the Referral partner terms (/legal/referral-partners, clauses 4 and 5). */
const offer: { icon: LucideIcon; title: string; text: string }[] = [
	{
		icon: PercentIcon,
		title: "20% of Hospio360’s fee",
		text: "You earn 20% of the Hospio360 platform fee we actually collect from each business you refer.",
	},
	{
		icon: CalendarClockIcon,
		title: "For 12 months per business",
		text: "Counted from the first fee collected from that business.",
	},
	{
		icon: BanknoteIcon,
		title: "Paid monthly",
		text: "A statement by the 5th of each month, paid by bank transfer by the 15th.",
	},
	{
		icon: ReceiptTextIcon,
		title: "5% WHT, ₦5,000 minimum",
		text: "5% withholding tax is deducted. A smaller amount rolls over to the next statement.",
	},
];

const steps = [
	"Send this form.",
	"We review it and email you within 2 working days.",
	"If approved, you set up your partner login, accept the Referral partner terms and get your referral link.",
];

/** /partners/apply: the public "Apply to be a partner" form, with the offer beside it. */
export default function PartnerApplyPage() {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<div
					className={cn(
						container,
						"flex flex-col gap-8 py-10 md:gap-12 md:py-16",
					)}
				>
					<div className="flex max-w-[760px] flex-col gap-4">
						<p className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
							Partner program
						</p>
						<h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px]">
							Apply to be a Hospio360 partner
						</h1>
						<p className="text-[17px] leading-[1.55] text-ink-2 md:text-[18px]">
							Know owners of hotels, lounges, bars or restaurants? Introduce
							them to Hospio360 and earn a share of our fee from every business
							you bring on.
						</p>
					</div>

					<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
						<div className="order-2 min-w-0 lg:order-1">
							<PartnerApplyForm />
						</div>
						<aside className="order-1 flex min-w-0 flex-col gap-6 lg:sticky lg:top-[111px] lg:order-2">
							<div className="flex flex-col gap-[18px] rounded-[16px] bg-brand p-6 md:p-8">
								<h2 className="text-[22px] font-bold text-white">
									What you earn
								</h2>
								{offer.map((o) => (
									<div key={o.title} className="flex items-start gap-[14px]">
										<IconTile icon={o.icon} tone="glass" size="sm" />
										<div className="flex min-w-0 flex-col gap-1">
											<p className="text-base font-bold text-white">
												{o.title}
											</p>
											<p className="text-sm leading-[1.5] text-nav-foreground">
												{o.text}
											</p>
										</div>
									</div>
								))}
								<p className="text-[13px] leading-[1.5] text-nav-foreground">
									No sign-up bonus, and no commission on devices, data plans,
									message charges or VAT. The full detail is in the{" "}
									<Link
										href="/legal/referral-partners"
										className="font-semibold text-white underline underline-offset-2"
									>
										Referral partner terms
									</Link>
									.
								</p>
							</div>
							<div className="hidden flex-col gap-4 rounded-[16px] border border-line bg-card p-6 lg:flex">
								<h2 className="text-lg font-bold text-ink">What happens next</h2>
								<ul className="flex flex-col gap-3">
									{steps.map((s) => (
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
