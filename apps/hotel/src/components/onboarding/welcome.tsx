import {
	ArrowRightIcon,
	BedDoubleIcon,
	BuildingIcon,
	CheckIcon,
	StoreIcon,
	ClockIcon,
	HotelIcon,
	type LucideIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingStep,
} from "@hospio/api/types";
import { HospioWordmark } from "@hospio/ui/brand/logo";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { placeWord, stepHref, stepMeta } from "./steps";

const icons: Record<OwnerOnboardingStep, LucideIcon> = {
	business: BuildingIcon,
	hotel: HotelIcon,
	rooms: BedDoubleIcon,
	manager: UserIcon,
};

/** Welcome checklist (Figma 3163:16235): the four steps, ticked as they are saved, and "Start setup". */
export function WelcomeChecklist({
	firstName,
	done,
	next,
	kind,
	accommodation,
}: {
	firstName: string;
	done: OwnerOnboardingStep[];
	next: OwnerOnboardingStep | "done";
	/** The business's kind (hospio-backend docs/plan-venue-type.md): a lounge's step 3 is Outlets, not Rooms & prices. */
	kind?: string | null;
	accommodation?: boolean;
}) {
	const STEP_META = stepMeta(kind, accommodation);
	const minutes = OWNER_ONBOARDING_STEPS.filter(
		(s) => !done.includes(s),
	).reduce((sum, s) => sum + STEP_META[s].minutes, 0);
	const started = done.length > 0;
	return (
		<section className="flex w-full max-w-[520px] flex-col gap-6 rounded-card border border-line bg-card px-8 py-8 shadow-[0_8px_30px_rgba(76,9,30,0.06)]">
			<div className="flex items-center gap-[10px]">
				<HospioWordmark className="h-[22px] text-brand" />
			</div>
			<div>
				<h1 className="text-2xl font-bold tracking-[-0.01em] text-ink">
					{started ? `Welcome back, ${firstName}` : `Welcome, ${firstName}`}
				</h1>
				<p className="mt-1 text-[13px] text-ink-2">
					{next === "done"
						? "Everything is in. One last look and your dashboard is ready."
						: `Let's set up your ${placeWord(kind) === "location" ? "" : `${placeWord(kind)} `}business. It takes about ${Math.max(minutes, 1)} minutes, and you can stop and come back any time.`}
				</p>
			</div>
			<ol className="divide-y divide-line rounded-xl border border-line">
				{OWNER_ONBOARDING_STEPS.map((key, i) => {
					const Icon =
						key === "rooms" && STEP_META.rooms.short === "Outlets" ? StoreIcon : icons[key];
					const isDone = done.includes(key);
					const isNext = key === next;
					return (
						<li key={key}>
							<Link
								href={stepHref(key)}
								className={cn(
									"flex items-center gap-3 px-4 py-3 hover:bg-subtle/60",
									isNext && "bg-brand-soft/30",
								)}
							>
								<span
									className={cn(
										"flex size-8 shrink-0 items-center justify-center rounded-lg",
										isDone
											? "bg-success-soft text-success"
											: "bg-brand-soft text-brand",
									)}
								>
									{isDone ? (
										<CheckIcon className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-[13px] font-semibold text-ink">
										{i + 1}. {STEP_META[key].title}
									</span>
									<span className="block text-xs text-ink-3">
										{STEP_META[key].blurb}
									</span>
								</span>
								<span className="flex items-center gap-1 text-[11px] text-ink-3">
									{isDone ? (
										"Done"
									) : (
										<>
											<ClockIcon className="size-3" /> {STEP_META[key].minutes}{" "}
											min
										</>
									)}
								</span>
							</Link>
						</li>
					);
				})}
			</ol>
			<div className="flex items-center gap-3">
				<p className="flex-1 text-xs text-ink-3">
					Your work is saved after every step.
				</p>
				<Link
					href={stepHref(next)}
					className={cn(btn.primary, "flex items-center gap-2")}
				>
					<ArrowRightIcon className="size-4" />{" "}
					{next === "done"
						? "Finish setup"
						: started
							? "Continue setup"
							: "Start setup"}
				</Link>
			</div>
		</section>
	);
}
