import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "@hospio/ui/react-query";
import { Toaster } from "@hospio/ui/primitives/sonner";
import { ApiLog } from "@hospio/ui/shared/api-log";
import { UpdateNotice } from "@hospio/ui/shared/update-notice";
import { ServiceWorker } from "@hospio/ui/shared/pwa";
import { cn } from "@hospio/ui/utils";
import {
	RememberedBrandStyle,
	rememberedBrand,
} from "@hospio/ui/screens/auth-shell";
import "./globals.css";

/** DM Sans is the one typeface in the design system; the variable font covers every weight. */
const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
	title: "Hospio360",
	description: "Run your hotels from one place",
	// Installed on iPhone/iPad: full screen, its own name under the icon (docs/pwa.md). The icon is app/apple-icon.png.
	appleWebApp: { capable: true, title: "Hospio360", statusBarStyle: "default" },
	other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
	// Hospio360 maroon for the browser bar and the installed app's title bar (the apps are light-only).
	themeColor: "#4c091e",
};

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	// The hotel's colours on every page from the first paint (packages/api/src/brand.ts): the role picker, onboarding,
	// invites, receipts, lock and error pages too. The dashboard shell's live brand comes later in the page and wins.
	const remembered = await rememberedBrand();
	return (
		<html lang="en">
			<head>
				<RememberedBrandStyle remembered={remembered} />
			</head>
			<body
				className={cn(
					"min-h-screen bg-background font-sans text-foreground antialiased",
					dmSans.variable,
				)}
			>
				<Providers>
					{children}
					<Toaster
						richColors
						theme="light"
						duration={5000}
						position="bottom-right"
					/>
					<UpdateNotice />
					<ServiceWorker />
					<ApiLog />
				</Providers>
			</body>
		</html>
	);
}
