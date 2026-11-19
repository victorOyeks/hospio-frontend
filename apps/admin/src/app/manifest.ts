import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/** The web app manifest (served at /manifest.webmanifest) that makes the app installable; see docs/pwa.md. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
	// This environment's own address (behind nginx): the manifest names itself so a browser tab can ask
	// navigator.getInstalledRelatedApps() whether the app is already installed ("Open in app" banner).
	const h = await headers();
	const host = h.get("x-forwarded-host") ?? h.get("host");
	const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "https";
	return {
		id: "/",
		name: "Hospio360 Admin",
		short_name: "H360 Admin",
		description: "The Hospio360 admin portal",
		start_url: "/dashboard",
		scope: "/",
		display: "standalone",
		orientation: "any",
		// Hospio360 maroon (--brand-primary): the title bar and the splash screen.
		theme_color: "#4c091e",
		background_color: "#4c091e",
		// Opening the installed app again focuses its open window instead of starting a second one.
		launch_handler: { client_mode: ["navigate-existing", "auto"] },
		prefer_related_applications: false,
		related_applications: host ? [{ platform: "webapp", url: `${proto}://${host}/manifest.webmanifest` }] : [],
		icons: [
			{ src: "/icons/icon-192.png?v=c", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icons/icon-512.png?v=c", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "/icons/maskable-512.png?v=c", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
