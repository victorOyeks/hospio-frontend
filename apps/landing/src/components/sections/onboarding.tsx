import { BOOK_DEMO_URL, Section } from "@/components/site";

const steps: { title: string; text: string }[] = [
	{
		title: "Book a demo",
		text: "Tell us about your business. We call you within 1 working day.",
	},
	{
		title: "Meet our team",
		text: "We show you Hospio360 on a laptop or tablet and agree what you need.",
	},
	{
		title: "We set you up",
		text: "Your business, locations, rooms or outlets, prices and staff.",
	},
	{
		title: "Sign in and go live",
		text: "Your login comes by email. Then you’re live.",
	},
];

/** The four steps from a demo to live, as one compact row of numbered chips (on a small screen: the step names only). */
export function Onboarding() {
	return (
		<Section
			id="onboarding"
			eyebrow="Getting started"
			title="Live in four steps."
			compact
		>
			<ol className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-5">
				{steps.map((s, i) => (
					<li
						key={s.title}
						className="flex items-center gap-3 rounded-[14px] border border-line bg-card px-[14px] py-[10px] sm:items-start sm:py-3 lg:p-5"
					>
						<span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-brand text-[13px] font-bold text-white">
							{i + 1}
						</span>
						<p className="flex min-w-0 flex-col gap-[2px]">
							<span className="text-[15px] font-bold leading-[1.3] text-ink">
								{s.title}
							</span>
							<span className="hidden text-[13px] leading-[1.4] text-ink-2 sm:block">
								{s.text}
							</span>
						</p>
					</li>
				))}
			</ol>
			<p className="-mt-2 text-center text-[13px] leading-[1.5] text-ink-2 md:-mt-3 md:text-sm">
				No forms to fill in on your own: the Hospio360 team sets it all up with you.{" "}
				<a href={BOOK_DEMO_URL} className="font-semibold text-brand underline underline-offset-2">
					Book a demo
				</a>
			</p>
		</Section>
	);
}
