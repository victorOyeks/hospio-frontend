import { ImageResponse } from "next/og";
import { svgDataUrl, wordmarkSvg } from "@hospio/ui/brand/logo-paths";

export const alt =
	"Hospio360 · Hotel, lounge, bar and restaurant management in Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The share card: the brand maroon with the wordmark (brand/logo-paths.ts) and the one-line pitch. */
export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				padding: "80px",
				background: "#4c091e",
				color: "white",
			}}
		>
			<img src={svgDataUrl(wordmarkSvg("#FFFFFF"))} width={302} height={60} alt="Hospio360" />
			<div
				style={{
					marginTop: 32,
					fontSize: 68,
					fontWeight: 700,
					lineHeight: 1.1,
					maxWidth: 980,
				}}
			>
				Every room, every table, every till, on one screen.
			</div>
			<div style={{ marginTop: 28, fontSize: 30, color: "#e8c9d3" }}>
				For hotels, lounges, bars and restaurants in Nigeria
			</div>
		</div>,
		{ ...size },
	);
}
