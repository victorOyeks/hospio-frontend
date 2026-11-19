/**
 * The videos shown on the public site. To swap one, paste its new YouTube link in `url` and update the facts under it
 * (they are what search engines read; YouTube's own page for the video gives the title, date and length).
 */
export type SiteVideo = {
	/** Any YouTube link to the video: youtu.be/<id>, youtube.com/watch?v=<id>, /embed/<id> or /shorts/<id>. */
	url: string;
	/** The video's title on YouTube; shown on the poster and read out as the player's name. */
	title: string;
	/** One or two sentences on what the video shows (search engines). */
	description: string;
	/** The line under the player. */
	caption: string;
	/** When it was published on YouTube (ISO 8601). */
	uploadDate: string;
	/** Its length as ISO 8601 ("PT1M1S" is 1 minute 1 second); leave out if unknown. */
	duration?: string;
};

export const VIDEOS = {
	overview: {
		url: "https://youtu.be/v28K0LTJqK8",
		title: "Hospio360 promo v2",
		description:
			"A look at Hospio360: one app for hotels, lounges, bars and restaurants, from tabs, orders and split bills to POS payments, tills and the owner's view, and how we set you up with devices.",
		caption: "One app for hotels, lounges, bars and restaurants — 80 seconds",
		uploadDate: "2026-11-19T00:40:19-08:00",
		duration: "PT1M19S",
	},
	partner: {
		url: "https://youtu.be/5_qhbYZEWc4",
		title: "Hospio360 partner video v2",
		description:
			"How the Hospio360 partner programme works: introduce owners of hotels, lounges, bars or restaurants and earn 20% of Hospio360's fee from each business for 12 months.",
		caption: "How the partner programme works — 75 seconds",
		uploadDate: "2026-11-19T00:38:40-08:00",
		duration: "PT1M15S",
	},
} as const satisfies Record<string, SiteVideo>;

/** The 11-character video id inside a YouTube link. */
export function youtubeId(url: string): string {
	const id = url.match(
		/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/,
	)?.[1];
	if (!id) throw new Error(`Not a YouTube video link: ${url}`);
	return id;
}

/** The video's page on YouTube (the plain link that works without JavaScript). */
export const youtubeWatchUrl = (id: string) =>
	`https://www.youtube.com/watch?v=${id}`;

/** The player address on YouTube's privacy-enhanced domain, which sets no cookies before the video plays. */
export const youtubeEmbedUrl = (id: string) =>
	`https://www.youtube-nocookie.com/embed/${id}`;

/** YouTube's poster pictures: the 1280px one, and the 480px one every video has. */
export const youtubePoster = (id: string) => ({
	large: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
	fallback: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
});

/** VideoObject structured data, so search engines know the page carries this video. */
export function videoJsonLd(video: SiteVideo) {
	const id = youtubeId(video.url);
	const poster = youtubePoster(id);
	return {
		"@context": "https://schema.org",
		"@type": "VideoObject",
		name: video.title,
		description: video.description,
		thumbnailUrl: [poster.large, poster.fallback],
		uploadDate: video.uploadDate,
		...(video.duration ? { duration: video.duration } : {}),
		embedUrl: youtubeEmbedUrl(id),
		url: youtubeWatchUrl(id),
	};
}
