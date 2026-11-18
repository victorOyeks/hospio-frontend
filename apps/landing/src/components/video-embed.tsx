"use client";

import { ExternalLinkIcon, PlayIcon } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { cn } from "@hospio/ui/utils";
import {
	type SiteVideo,
	youtubeEmbedUrl,
	youtubeId,
	youtubePoster,
	youtubeWatchUrl,
} from "@/config/videos";

/** YouTube answers a missing poster with a 120px grey placeholder rather than an error. */
const PLACEHOLDER_WIDTH = 120;

/**
 * A YouTube video that loads only when the visitor presses play. Until then it is a poster picture inside a link to
 * the video on YouTube, so it works without JavaScript and nothing of YouTube's player (scripts, cookies) is loaded.
 * Pressing play (click, Enter or Space) swaps in the player from youtube-nocookie.com, in the same 16:9 box.
 */
export function VideoEmbed({
	video,
	caption = video.caption,
	dark = false,
	className,
}: {
	video: SiteVideo;
	/** The line under the player; pass `null` for none. */
	caption?: string | null;
	/** On a maroon background. */
	dark?: boolean;
	className?: string;
}) {
	const id = youtubeId(video.url);
	const poster = youtubePoster(id);
	const watchUrl = youtubeWatchUrl(id);
	const [playing, setPlaying] = useState(false);
	const [posterSrc, setPosterSrc] = useState(poster.large);
	const img = useRef<HTMLImageElement>(null);
	const frame = useRef<HTMLIFrameElement>(null);

	const showFallback = () => setPosterSrc(poster.fallback);
	const checkPoster = (el: HTMLImageElement | null) => {
		if (el?.complete && el.naturalWidth <= PLACEHOLDER_WIDTH) showFallback();
	};
	// The picture may have finished loading before React took over the page.
	useEffect(() => checkPoster(img.current), []);
	// Keyboard users land on the player they just opened.
	useEffect(() => {
		if (playing) frame.current?.focus();
	}, [playing]);

	const play = (e: MouseEvent | KeyboardEvent) => {
		e.preventDefault();
		setPlaying(true);
	};

	return (
		<figure className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
			<div className="@container relative aspect-video w-full overflow-hidden rounded-[16px] border border-line bg-brand shadow-[0_24px_60px_rgba(77,8,31,0.1)]">
				{playing ? (
					<iframe
						ref={frame}
						src={`${youtubeEmbedUrl(id)}?autoplay=1&rel=0`}
						title={video.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
						loading="lazy"
						referrerPolicy="strict-origin-when-cross-origin"
						className="absolute inset-0 size-full border-0"
					/>
				) : (
					<a
						href={watchUrl}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Play video: ${video.title}`}
						onClick={(e) => {
							// Ctrl, Cmd, Shift and middle clicks keep opening YouTube in a new tab.
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
							play(e);
						}}
						onKeyDown={(e) => {
							if (e.key === " ") play(e);
						}}
						className="group absolute inset-0 block outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
					>
						{/* A plain img: YouTube's own poster, fetched straight from YouTube. */}
						<img
							ref={img}
							src={posterSrc}
							alt=""
							width={1280}
							height={720}
							loading="lazy"
							decoding="async"
							referrerPolicy="no-referrer"
							onLoad={(e) => checkPoster(e.currentTarget)}
							onError={showFallback}
							className="absolute inset-0 size-full object-cover"
						/>
						<span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pt-10 pb-3 text-left text-[13px] font-semibold text-white @xl:px-5 @xl:pb-4 @xl:text-base">
							{video.title}
						</span>
						<span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-4 ring-white/85 transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none @xl:size-[72px] @3xl:size-20">
							<PlayIcon
								aria-hidden
								className="ml-1 size-6 fill-current @xl:size-8 @3xl:size-9"
								strokeWidth={0}
							/>
						</span>
					</a>
				)}
			</div>
			<figcaption
				className={cn(
					"flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm",
					dark ? "text-nav-foreground" : "text-ink-2",
				)}
			>
				{caption && <span>{caption}</span>}
				<a
					href={watchUrl}
					target="_blank"
					rel="noopener noreferrer"
					className={cn(
						"inline-flex items-center gap-[6px] font-semibold underline underline-offset-2",
						dark ? "text-white" : "text-brand",
					)}
				>
					Watch on YouTube
					<ExternalLinkIcon aria-hidden className="size-[14px]" />
				</a>
			</figcaption>
		</figure>
	);
}
