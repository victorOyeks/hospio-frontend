import { CalendarDaysIcon } from "lucide-react";
import Link from "next/link";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { BOOK_DEMO_URL, btnLg, Section } from "@/components/site";
import { VideoEmbed } from "@/components/video-embed";
import { VIDEOS } from "@/config/videos";
import { CheckItem } from "./shared";

/** In the words of the Fees and monthly invoice terms (/legal/fees, sections 1 to 4) and Support & services. */
const included = [
	"Every feature: the owner and manager portals and the staff tablet app",
	"The same rate for hotels, lounges, bars and restaurants",
	"No subscription, no set-up fee and no licence up front",
	"Set-up, staff training and support from the Hospio360 team",
];

/** The one price and the partner offer, side by side; the detail is on /legal/fees and /partners/apply. */
export function Pricing() {
	return (
		<Section
			id="pricing"
			tone="card"
			eyebrow="Pricing"
			title="One simple price."
			compact
			className="border-y border-line"
		>
			<div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
				<div className="flex min-w-0 flex-col gap-4 rounded-[16px] border border-line bg-page p-5 md:p-7">
					<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<p className="text-[52px] font-bold leading-none tracking-[-0.03em] text-brand md:text-[64px]">
							1.5%
						</p>
						<p className="text-[20px] font-bold leading-[1.2] text-ink md:text-[22px]">
							of your sales
						</p>
					</div>
					<p className="text-[15px] leading-[1.5] text-ink-2">
						Worked out on each location’s daily sales (before VAT) and billed on
						one monthly invoice, due within 7 days. You pay it online by card,
						bank transfer or USSD; nothing is ever debited from your account.
					</p>
					<ul className="flex flex-col gap-2">
						{included.map((line) => (
							<CheckItem key={line} className="text-sm">
								{line}
							</CheckItem>
						))}
					</ul>
					<p className="text-[13px] leading-[1.5] text-ink-3">
						Guest messages (WhatsApp and email) and any devices you take
						from us are charged separately on the same invoice.
					</p>
					<div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
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
						<Link
							href="/legal/fees"
							className="text-[15px] font-semibold text-brand underline underline-offset-2"
						>
							How fees work
						</Link>
					</div>
				</div>
				<div
					id="partners"
					className="flex min-w-0 scroll-mt-[88px] flex-col gap-4 rounded-[16px] bg-brand-soft p-5 md:p-7"
				>
					<div className="flex flex-col gap-[6px]">
						<p className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">
							Partners
						</p>
						<h3 className="text-[20px] font-bold leading-[1.2] text-ink md:text-[22px]">
							Know owners of hotels, lounges, bars or restaurants?
						</h3>
						<p className="text-[15px] leading-[1.5] text-ink-2">
							Earn 20% of Hospio360’s fee from every business you bring on, for
							12 months.
						</p>
					</div>
					<Link
						href="/partners/apply"
						className={cn(
							btn.primary,
							btnLg,
							"inline-flex items-center self-start",
						)}
					>
						Apply to be a partner
					</Link>
					<VideoEmbed
						video={VIDEOS.partner}
						className="mt-auto max-w-[420px]"
					/>
				</div>
			</div>
		</Section>
	);
}
