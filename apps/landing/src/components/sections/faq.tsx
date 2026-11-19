import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@hospio/ui/utils";
import { container, DEMO_MAILTO, SectionHeader } from "@/components/site";

/**
 * Every question, the most important first: the home page shows the first HOME_FAQ_COUNT, /features#faq shows them all.
 * Money answers follow the Fees and monthly invoice terms (/legal/fees).
 */
export const FAQS: { q: string; a: string }[] = [
	{
		q: "What does Hospio360 cost?",
		a: "1.5% of each location’s daily sales (before VAT), the same for every business. It is billed on one monthly invoice, issued on the 1st and due within 7 days, which you pay online by card, bank transfer or USSD. There is no subscription or set-up fee, and Hospio360 never debits your account.",
	},
	{
		q: "Does it work for a lounge, bar or restaurant, not only a hotel?",
		a: "Yes. A lounge, bar or restaurant gets tabs, orders, bill splitting, tills, waiters and cashiers, stock and reports, without the room screens. A hotel gets rooms, bookings and guest folios as well. One business can run both, each location with its own setup.",
	},
	{
		q: "Do we need new hardware?",
		a: "No special hardware. Hospio360 runs in the browser on a computer or tablet, and a shared tablet can be used by several staff, each signing in with their own PIN. Card terminals come from your POS provider and are assigned to each role in setup.",
	},
	{
		q: "Who sets everything up?",
		a: "You can: sign up and follow the four setup steps. Or the Hospio360 team sets up your business, locations, rooms or outlets and staff with you, then hands it over with your logins.",
	},
	{
		q: "Can one location see another location’s data?",
		a: "No. Each location’s data is kept separate. As the owner you see all of your own locations; managers see only the ones they run.",
	},
	{
		q: "What happens if the POS goes offline?",
		a: "Staff can keep taking cash, and any pending card or transfer payments can be verified later from My payments.",
	},
	{
		q: "Can we change our rules ourselves?",
		a: "Yes. Prices, charges, payment types, approval limits, stay rules and more are set per location. Nothing is hard-coded.",
	},
];

export const HOME_FAQ_COUNT = 5;

/** FAQPage structured data for the questions a page shows. */
export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
	const data = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((f) => ({
			"@type": "Question",
			name: f.q,
			acceptedAnswer: { "@type": "Answer", text: f.a },
		})),
	};
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: our own constants, with "<" escaped
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}

/**
 * The questions as a closed accordion. Plain <details>, so it opens without JavaScript and every answer is in the page
 * for search engines. `limit` shows only the first few, with a link to the rest on /features.
 */
export function Faq({ limit }: { limit?: number }) {
	const faqs = limit ? FAQS.slice(0, limit) : FAQS;
	const more = faqs.length < FAQS.length;
	return (
		<section id="faq" className="scroll-mt-[76px] bg-page">
			<div
				className={cn(
					container,
					"flex max-w-[860px] flex-col gap-5 py-10 md:gap-7 md:py-16",
				)}
			>
				<SectionHeader eyebrow="FAQ" title="Questions owners ask us." compact />
				<div className="flex flex-col border-t border-line">
					{faqs.map((f) => (
						<details key={f.q} className="group border-b border-line">
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[14px] text-[16px] font-bold leading-[1.3] text-ink md:py-[18px] md:text-[18px] [&::-webkit-details-marker]:hidden">
								{f.q}
								<ChevronDownIcon
									aria-hidden
									className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
								/>
							</summary>
							<p className="pb-4 text-[15px] leading-[1.55] text-ink-2 md:pb-5">
								{f.a}
							</p>
						</details>
					))}
				</div>
				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[15px] font-semibold">
					{more && (
						<Link
							href="/features#faq"
							className="inline-flex items-center gap-[6px] text-brand underline underline-offset-2"
						>
							More questions
							<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
						</Link>
					)}
					<a
						href={DEMO_MAILTO}
						className="text-brand underline underline-offset-2"
					>
						Ask us on a demo
					</a>
				</div>
			</div>
		</section>
	);
}
