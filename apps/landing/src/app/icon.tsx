import { ImageResponse } from "next/og";

export const size = {
	width: 32,
	height: 32,
};

export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					background: "linear-gradient(160deg, #0b1220 0%, #111a33 55%, #1e1b4b 100%)",
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: "6px",
				}}
			>
				<span
					style={{
						color: "white",
						fontSize: "11px",
						fontWeight: "bold",
						letterSpacing: "-0.5px",
					}}
				>
					H360
				</span>
			</div>
		),
		{ ...size },
	);
}
