import type { MetadataRoute } from "next";

/** The web app manifest (served at /manifest.webmanifest) that makes the app installable; see docs/pwa.md. */
export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: "Hospio360",
		short_name: "Hospio360",
		description: "Run your hotels from one place",
		start_url: "/dashboard",
		scope: "/",
		display: "standalone",
		orientation: "any",
		// Hospio360 maroon (--brand-primary): the title bar and the splash screen.
		theme_color: "#4c091e",
		background_color: "#4c091e",
		icons: [
			{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
