"use client";

import { AppWindowIcon, ArrowUpRightIcon, DownloadIcon, ShareIcon, SquarePlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { APP_NAME } from "@hospio/api/app";
import { useInstallPrompt } from "@hospio/ui/hooks/use-install-prompt";
import { DropdownMenuItem } from "@hospio/ui/primitives/dropdown-menu";
import { Modal } from "@hospio/ui/shared/modal";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/**
 * Install as an app (docs/pwa.md): the service worker registration, the "Install Hospio360" menu item, the one-time
 * banner on tablets and phones, and the iPhone/iPad "Tap Share, then Add to Home Screen" tip.
 */
const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const DISMISSED = "hospio.install-banner.dismissed";

/** Registers /sw.js in production over https only; ?v= is the build, so each deploy installs a fresh worker. */
export function ServiceWorker() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (
			window.location.protocol !== "https:" ||
			!("serviceWorker" in navigator)
		)
			return;
		navigator.serviceWorker
			.register(`/sw.js?v=${encodeURIComponent(BUILD)}`, { scope: "/" })
			.catch(() => {
				// No service worker: the app works exactly as a normal website.
			});
	}, []);
	return null;
}

function IosTip({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			size="confirm"
			icon={DownloadIcon}
			title={`Install ${APP_NAME}`}
			subtitle="Add it to your Home Screen to open it like an app."
			footer={
				<button
					type="button"
					className={btn.primary}
					onClick={() => onOpenChange(false)}
				>
					Got it
				</button>
			}
		>
			<ol className="space-y-3 text-sm text-ink">
				<li className="flex items-center gap-3">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
						<ShareIcon className="size-4" />
					</span>
					<span>
						Tap <b>Share</b> (the square with an arrow, in Safari's toolbar or
						Chrome's address bar).
					</span>
				</li>
				<li className="flex items-center gap-3">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
						<SquarePlusIcon className="size-4" />
					</span>
					<span>
						Choose <b>Add to Home Screen</b>, then <b>Add</b>.
					</span>
				</li>
			</ol>
		</Modal>
	);
}

// The tip outlives the menu that opens it (a dropdown unmounts its items on close), so its state lives here and the
// banner, which is always mounted next to the menu, renders it.
let openTip: (() => void) | null = null;

/** "Install Hospio360" in the profile menu: the browser's install dialog, or the iOS tip; absent when neither applies. */
export function InstallMenuItem() {
	const { canPrompt, showIosTip, install } = useInstallPrompt();
	if (!canPrompt && !showIosTip) return null;
	return (
		<DropdownMenuItem
			className="rounded-lg"
			onSelect={() => {
				if (canPrompt) void install();
				// After the menu has closed, so the dialog takes the focus and the page lock cleanly.
				else setTimeout(() => openTip?.(), 0);
			}}
		>
			<DownloadIcon /> Install {APP_NAME}
		</DropdownMenuItem>
	);
}

function readDismissed() {
	try {
		return window.localStorage.getItem(DISMISSED) === "1";
	} catch {
		return false;
	}
}

/** Tablet and phone widths: up to 1024px, or a touch screen up to 1366px (iPad Pro landscape). */
const TABLET = "(max-width: 1024px), (pointer: coarse) and (max-width: 1366px)";

/**
 * A small banner on tablets and phones, shown until it is dismissed or the app is installed (remembered per device).
 * Render it once next to the menu that holds InstallMenuItem: it also hosts the iOS tip that item opens.
 */
export function InstallBanner() {
	const { canPrompt, showIosTip, install } = useInstallPrompt();
	const [show, setShow] = useState(false);
	const [tip, setTip] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(TABLET);
		const update = () => setShow(media.matches && !readDismissed());
		update();
		media.addEventListener("change", update);
		openTip = () => setTip(true);
		return () => {
			media.removeEventListener("change", update);
			openTip = null;
		};
	}, []);

	const dismiss = () => {
		setShow(false);
		try {
			window.localStorage.setItem(DISMISSED, "1");
		} catch {
			// private mode or blocked storage: hidden for this visit only
		}
	};

	if (!show || (!canPrompt && !showIosTip))
		return <IosTip open={tip} onOpenChange={setTip} />;
	// Portalled to <body>: the dashboard shell's containers would otherwise anchor "fixed" to themselves, not the screen.
	return (
		<>
			{createPortal(
				<section
					aria-label={`Install ${APP_NAME}`}
					data-install-banner
					className={cn(
						"fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[520px] items-center gap-3 rounded-xl border border-brand/20 bg-card px-4 py-3 shadow-lg",
						"pb-[max(12px,env(safe-area-inset-bottom))]",
					)}
				>
					<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
						<DownloadIcon className="size-5" />
					</span>
					<div className="min-w-0 flex-1 text-[13px]">
						<p className="font-semibold text-ink">Install {APP_NAME}</p>
						<p className="text-ink-2">
							{canPrompt
								? "Open it from your home screen like an app, full screen."
								: "Tap Share, then Add to Home Screen."}
						</p>
					</div>
					<button
						type="button"
						className={cn(btn.primary, "shrink-0")}
						onClick={async () => {
							if (!canPrompt) return setTip(true);
							if (await install()) dismiss();
						}}
					>
						{canPrompt ? "Install" : "How"}
					</button>
					<button
						type="button"
						onClick={dismiss}
						aria-label="Dismiss"
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-subtle hover:text-ink"
					>
						<XIcon className="size-[18px]" />
					</button>
				</section>,
				document.body,
			)}
			<IosTip open={tip} onOpenChange={setTip} />
		</>
	);
}

const OPEN_IN_APP_HIDDEN = "hospio.open-in-app.hidden-until";
const WEEK = 7 * 86_400_000;

function hiddenUntil() {
	try {
		return Number(window.localStorage.getItem(OPEN_IN_APP_HIDDEN) ?? 0);
	} catch {
		return 0;
	}
}

type RelatedAppsNavigator = Navigator & { getInstalledRelatedApps?: () => Promise<{ platform: string; url?: string }[]> };

/**
 * "Hospio360 is installed on this device." in a normal browser tab when the app is installed here (Chrome/Edge on
 * Android and computers: navigator.getInstalledRelatedApps, with the manifest naming itself in related_applications).
 * A website cannot switch itself into the installed app, so "Open the app" shows where the browser's own button is.
 * iOS and Firefox cannot tell; nothing shows there. "Continue in browser" hides it for 7 days on this device.
 */
export function OpenInAppBanner() {
	const { standalone } = useInstallPrompt();
	const [installed, setInstalled] = useState(false);
	const [hint, setHint] = useState(false);
	const [android, setAndroid] = useState(false);

	useEffect(() => {
		if (standalone) return;
		const nav = navigator as RelatedAppsNavigator;
		if (typeof nav.getInstalledRelatedApps !== "function" || hiddenUntil() > Date.now()) return;
		setAndroid(/Android/i.test(navigator.userAgent));
		nav
			.getInstalledRelatedApps()
			.then((apps) => setInstalled(apps.some((a) => a.platform === "webapp")))
			.catch(() => {
				// not allowed here (e.g. not https): no banner
			});
	}, [standalone]);

	if (standalone || !installed) return null;
	const keepBrowsing = () => {
		setInstalled(false);
		try {
			window.localStorage.setItem(OPEN_IN_APP_HIDDEN, String(Date.now() + WEEK));
		} catch {
			// blocked storage: hidden for this visit only
		}
	};
	return createPortal(
		<section
			aria-label={`${APP_NAME} is installed`}
			data-open-in-app-banner
			className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[560px] flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-card px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-lg"
		>
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
				<AppWindowIcon className="size-5" />
			</span>
			<div className="min-w-0 flex-1 text-[13px]">
				<p className="font-semibold text-ink">{APP_NAME} is installed on this device.</p>
				{hint ? (
					<p className="text-ink-2" data-open-in-app-hint>
						{android ? (
							<>
								Tap <b>⋮</b> then <b>&lsquo;Open in {APP_NAME}&rsquo;</b>.
							</>
						) : (
							<>
								Click <b>&lsquo;Open in app&rsquo;</b> in the address bar{" "}
								<ArrowUpRightIcon className="inline size-4 align-text-bottom text-brand" />
							</>
						)}
					</p>
				) : (
					<p className="text-ink-2">Open it in its own window, or carry on here.</p>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-2">
				{!hint && (
					<button type="button" className={btn.primary} onClick={() => setHint(true)}>
						Open the app
					</button>
				)}
				<button type="button" className={btn.secondary} onClick={keepBrowsing}>
					Continue in browser
				</button>
			</div>
		</section>,
		document.body,
	);
}
