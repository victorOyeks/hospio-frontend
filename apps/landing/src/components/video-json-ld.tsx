import { type SiteVideo, videoJsonLd } from "@/config/videos";

/** The page's videos as schema.org VideoObject data (one script tag, read by search engines only). */
export function VideoJsonLd({ videos }: { videos: SiteVideo[] }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: our own constants, with "<" escaped
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(videos.map(videoJsonLd)).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
