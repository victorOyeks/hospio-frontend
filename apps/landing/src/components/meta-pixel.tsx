"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useRef, useState } from "react";
import { META_PIXEL_ID } from "@/config/env";
import { trackMeta } from "@/lib/meta-pixel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** The visitor's answer on the cookie notice, kept in this browser only. */
const CONSENT_KEY = "hospio-ads-consent";
/** The footer's "Cookie settings" link shows the notice again. */
const SETTINGS_HASH = "#cookie-settings";
type Consent = "yes" | "no" | null;

function readConsent(): Consent {
	try {
		const v = window.localStorage.getItem(CONSENT_KEY);
		return v === "yes" || v === "no" ? v : null;
	} catch {
		return null;
	}
}

function saveConsent(v: "yes" | "no") {
	try {
		window.localStorage.setItem(CONSENT_KEY, v);
	} catch {
		// Private windows can refuse storage: the answer then lasts for this page only.
	}
}

/** A PageView for every client-side page change after the first (the base code sends the first). */
function RouteChanges() {
	const pathname = usePathname();
	const search = useSearchParams().toString();
	const first = useRef(true);
	useEffect(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		trackMeta("PageView");
	}, [pathname, search]);
	return null;
}

/**
 * The Meta Pixel (measuring our adverts), only after the visitor taps Accept on the cookie notice (22 Nov 2026, owner; NDPA:
 * consent before advertising trackers). Only when NEXT_PUBLIC_META_PIXEL_ID is set (production): staging and local builds show no
 * notice and load nothing. No answer yet: the notice shows and nothing from Meta loads. "No thanks": nothing loads until the
 * answer is changed. "Cookie settings" in the footer shows the notice again. Automatic configuration is off, so only the events we
 * send go (no automatic button-click events carrying page text). Privacy Policy 11.2.
 */
export function MetaPixel() {
	const [consent, setConsent] = useState<Consent>(null);
	const [asking, setAsking] = useState(false);

	useEffect(() => {
		if (!META_PIXEL_ID) return;
		const c = readConsent();
		setConsent(c);
		setAsking(c === null);
		const fromHash = () => {
			if (window.location.hash === SETTINGS_HASH) {
				setAsking(true);
				history.replaceState(null, "", window.location.pathname + window.location.search);
			}
		};
		// Next's <Link> changes the hash without a hashchange event, so the link's click is caught too.
		const onClick = (e: MouseEvent) => {
			const a = (e.target as Element | null)?.closest?.("a");
			if (a?.getAttribute("href") === SETTINGS_HASH) {
				e.preventDefault();
				setAsking(true);
			}
		};
		fromHash();
		window.addEventListener("hashchange", fromHash);
		document.addEventListener("click", onClick, true);
		return () => {
			window.removeEventListener("hashchange", fromHash);
			document.removeEventListener("click", onClick, true);
		};
	}, []);

	if (!META_PIXEL_ID) return null;

	const answer = (v: "yes" | "no") => {
		saveConsent(v);
		setAsking(false);
		if (v === "no" && consent === "yes") {
			// Meta's code is already on this page: reloading is the only way to unload it.
			window.location.reload();
			return;
		}
		setConsent(v);
	};

	return (
		<>
			{consent === "yes" && (
				<>
					<Script id="meta-pixel" strategy="afterInteractive">
						{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${META_PIXEL_ID}');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
					</Script>
					<Suspense fallback={null}>
						<RouteChanges />
					</Suspense>
				</>
			)}
			{asking && (
				<section
					aria-label="Cookies"
					className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[640px] flex-col gap-3 rounded-[14px] border border-line bg-card p-4 shadow-[0_12px_32px_-12px_rgba(76,9,30,0.35)] sm:flex-row sm:items-center sm:gap-4"
				>
					<p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-2">
						We use cookies to measure our adverts on Facebook and Instagram. We never share what you type into
						our forms.{" "}
						<Link href="/legal/privacy" className="font-medium text-brand underline underline-offset-2">
							Privacy Policy
						</Link>
					</p>
					<div className="flex shrink-0 gap-2">
						<button type="button" onClick={() => answer("no")} className={cn(btn.secondary, "flex-1 sm:flex-none")}>
							No thanks
						</button>
						<button type="button" onClick={() => answer("yes")} className={cn(btn.primary, "flex-1 sm:flex-none")}>
							Accept
						</button>
					</div>
				</section>
			)}
		</>
	);
}
