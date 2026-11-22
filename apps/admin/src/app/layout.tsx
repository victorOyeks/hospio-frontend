import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "@hospio/ui/react-query";
import { Toaster } from "@hospio/ui/primitives/sonner";
import { ApiLog } from "@hospio/ui/shared/api-log";
import { UpdateNotice } from "@hospio/ui/shared/update-notice";
import { ServiceWorker } from "@hospio/ui/shared/pwa";
import { cn } from "@hospio/ui/utils";
import "./globals.css";

/** DM Sans is the one typeface in the design system; the variable font covers every weight. */
const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
	title: "Hospio360 Admin",
	description: "Run your business from one place",
	// Installed on iPhone/iPad: full screen, its own name under the icon (docs/pwa.md). The icon is app/apple-icon.png.
	appleWebApp: { capable: true, title: "Hospio360 Admin", statusBarStyle: "default" },
	other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
	// Hospio360 maroon for the browser bar and the installed app's title bar (the apps are light-only).
	themeColor: "#4c091e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", dmSans.variable)}>
				<Providers>
					{children}
					<Toaster theme="light" />
					<UpdateNotice />
					<ServiceWorker />
					<ApiLog />
				</Providers>
			</body>
		</html>
	);
}
