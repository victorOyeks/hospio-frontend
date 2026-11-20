import { ArrowRightIcon, CalendarDaysIcon } from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { BOOK_DEMO_URL, btnLg, Section } from "@/components/site";
import { VideoEmbed } from "@/components/video-embed";
import { VIDEOS } from "@/config/videos";

/** The one-minute overview video, straight under the hero, with the hero's two calls to action repeated below it. */
export function SeeItInAction() {
	return (
		<Section
			id="video"
			eyebrow="Watch"
			title="See Hospio360 in action"
			compact
			contentClassName="items-center pt-0 md:pt-0"
		>
			<VideoEmbed video={VIDEOS.overview} className="max-w-[760px]" />
			{/* On a phone the hero's two buttons are still in view just above, so they are not repeated. */}
			<div className="hidden flex-wrap items-center justify-center gap-3 sm:flex">
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
		</Section>
	);
}
