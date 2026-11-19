import { ImageResponse } from "next/og";
import { HOSPIO_MAROON, mix, normalizeHex, onColour } from "@hospio/api/brand";
import { svgDataUrl, wordmarkSvg } from "@hospio/ui/brand/logo-paths";

/**
 * A hotel's WhatsApp banner (hospio-backend docs/sms-whatsapp.md): the image at the top of its booking WhatsApp messages, in
 * the hotel's colour with its name (Hotel setup → Brand & colours). messaging-service sends
 * `https://hospio360.com/whatsapp/banner?c=rrggbb&n=<hotel name>` as each message's header; WhatsApp fetches it when it
 * delivers. Only a colour and a short name are taken, so the address can't be used to draw anything else.
 */
export const runtime = "edge";

export function GET(req: Request) {
	const url = new URL(req.url);
	const colour = normalizeHex(url.searchParams.get("c")) ?? HOSPIO_MAROON;
	const name =
		(url.searchParams.get("n") ?? "")
			.replace(/[^\p{L}\p{N} &'.,-]/gu, "")
			.trim()
			.slice(0, 40) || "Hospio360";
	const on = onColour(colour);
	const faint = on === "#ffffff" ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.6)";
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				padding: "0 110px",
				background: `linear-gradient(135deg, ${mix(colour, -0.25)} 0%, ${colour} 55%, ${mix(colour, 0.15)} 100%)`,
				color: on,
				position: "relative",
			}}
		>
			<div
				style={{
					position: "absolute",
					right: -160,
					top: -200,
					width: 620,
					height: 620,
					borderRadius: 9999,
					border: `2px solid ${on === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
				}}
			/>
			<div
				style={{
					display: "flex",
					fontSize: name.length > 22 ? 76 : 96,
					fontWeight: 700,
					letterSpacing: "-0.02em",
					lineHeight: 1.05,
				}}
			>
				{name}
			</div>
			<div
				style={{ display: "flex", marginTop: 36, fontSize: 38, color: faint }}
			>
				Your stay, confirmed and in your pocket.
			</div>
			<div
				style={{
					position: "absolute",
					left: 110,
					bottom: 56,
					display: "flex",
					alignItems: "center",
					gap: 14,
					fontSize: 24,
					color: faint,
				}}
			>
				Booked with
				<img src={svgDataUrl(wordmarkSvg(on))} width={136} height={27} alt="Hospio360" style={{ opacity: 0.85 }} />
			</div>
		</div>,
		{
			width: 1200,
			height: 628,
			headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
		},
	);
}
