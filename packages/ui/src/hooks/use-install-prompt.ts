"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Install Hospio360" (docs/pwa.md). Chrome and Edge on Android, Windows, macOS and ChromeOS fire `beforeinstallprompt`
 * when the app can be installed; it is kept here (it can fire before any component mounts) and replayed on demand.
 * iPhone and iPad browsers never fire it: there the person adds the app from the Share menu, so `ios` shows that tip.
 * Nothing is offered once the app already runs installed (standalone).
 */
type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type State = { deferred: InstallPromptEvent | null; installed: boolean };

let state: State = { deferred: null, installed: false };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
	state = { ...state, ...next };
	for (const l of listeners) l();
};

if (typeof window !== "undefined") {
	window.addEventListener("beforeinstallprompt", (e) => {
		// Keep Chrome's own mini-infobar away; our menu item and banner offer the install instead.
		e.preventDefault();
		set({ deferred: e as InstallPromptEvent });
	});
	window.addEventListener("appinstalled", () => set({ deferred: null, installed: true }));
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	const media = window.matchMedia("(display-mode: standalone)");
	media.addEventListener("change", listener);
	return () => {
		listeners.delete(listener);
		media.removeEventListener("change", listener);
	};
}

/** Running as the installed app: Android/desktop report the display mode, iOS sets navigator.standalone. */
function isStandalone() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		window.matchMedia("(display-mode: fullscreen)").matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true
	);
}

/** iPhone, iPod and iPad (iPadOS reports itself as a Mac with a touch screen), in Safari, Chrome or any other browser. */
function isIos() {
	const ua = navigator.userAgent;
	return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

type Snapshot = { canPrompt: boolean; ios: boolean; standalone: boolean; installed: boolean };
let snapshot: Snapshot = { canPrompt: false, ios: false, standalone: false, installed: false };
const SERVER: Snapshot = snapshot;
function getSnapshot(): Snapshot {
	const next = {
		canPrompt: state.deferred !== null,
		ios: isIos(),
		standalone: isStandalone(),
		installed: state.installed,
	};
	if (
		next.canPrompt !== snapshot.canPrompt ||
		next.ios !== snapshot.ios ||
		next.standalone !== snapshot.standalone ||
		next.installed !== snapshot.installed
	)
		snapshot = next;
	return snapshot;
}

export function useInstallPrompt() {
	const s = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
	const hidden = s.standalone || s.installed;
	/** Opens the browser's install dialog; resolves true when the person installed. */
	const install = useCallback(async () => {
		const e = state.deferred;
		if (!e) return false;
		await e.prompt();
		const { outcome } = await e.userChoice;
		// A prompt can only be used once; Chrome fires a fresh beforeinstallprompt if it may be offered again.
		set({ deferred: null, installed: outcome === "accepted" });
		return outcome === "accepted";
	}, []);
	return {
		/** The browser can show its install dialog now (Chrome/Edge). */
		canPrompt: !hidden && s.canPrompt,
		/** iPhone/iPad, not yet installed: show "Tap Share, then Add to Home Screen". */
		showIosTip: !hidden && s.ios,
		/** Already running as the installed app (or just installed). */
		standalone: hidden,
		install,
	};
}
