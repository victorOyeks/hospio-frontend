import { ArrowRightIcon, CalendarDaysIcon } from "lucide-react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { btnLg, DEMO_MAILTO, Section, SIGN_UP_URL } from "@/components/site";
import { VideoEmbed } from "@/components/video-embed";
import { VIDEOS } from "@/config/videos";

/** The one-minute overview video, straight under the hero, with the hero's two calls to action repeated below it. */
export function SeeItInAction() {
	return (
		<Section
			id="video"
			eyebrow="Watch"
			title="See Hospio360 in action"
			contentClassName="items-center gap-8 pt-0 md:gap-10 md:pt-0"
		>
			<VideoEmbed video={VIDEOS.overview} className="max-w-[960px]" />
			<div className="flex flex-wrap items-center justify-center gap-3">
				<a
					href={SIGN_UP_URL}
					className={cn(
						btn.primary,
						btnLg,
						"inline-flex items-center gap-[6px]",
					)}
				>
					<ArrowRightIcon className="size-[15px]" strokeWidth={2.5} />
					Get started
				</a>
				<a
					href={DEMO_MAILTO}
					className={cn(
						btn.secondary,
						btnLg,
						"inline-flex items-center gap-[6px]",
					)}
				>
					<CalendarDaysIcon className="size-[15px]" strokeWidth={2.5} />
					Book a demo
				</a>
			</div>
		</Section>
	);
}
