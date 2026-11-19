import { Section } from "@/components/site";

const steps: { title: string; text: string }[] = [
	{
		title: "Create your account",
		text: "Sign up as the owner and confirm your phone number.",
	},
	{
		title: "Add your business",
		text: "Its details and your first location.",
	},
	{
		title: "Rooms or outlets, and prices",
		text: "Rooms for a hotel; outlets for a lounge, bar or restaurant.",
	},
	{
		title: "Invite your manager",
		text: "The person who runs it day to day. Then you’re live.",
	},
];

/** The four sign-up steps as one compact row of numbered chips (on a phone: the step names only). */
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
				Prefer to hand it over? The Hospio360 team can set it all up for you.
			</p>
		</Section>
	);
}
